import { insforge } from "@/lib/insforge";
import { AppUserType, normalizeUserType } from "@/lib/authRoutes";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Platform } from "react-native";

type AuthUser = {
  id: string;
  email: string;
  profile?: Record<string, any> | null;
};

type SignUpParams = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  userType: string;
};

type AuthActionResult = {
  error: string | null;
  requiresVerification?: boolean;
  email?: string;
  userType?: AppUserType;
};

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string,
    requestedUserType?: string,
  ) => Promise<AuthActionResult>;
  signUp: (params: SignUpParams) => Promise<AuthActionResult>;
  verifyEmail: (
    email: string,
    otp: string,
    profile?: Partial<SignUpParams>,
  ) => Promise<{ error: string | null; userType?: AppUserType }>;
  resendVerificationCode: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<{ error: string | null; accessToken: string | null }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const KEYS = {
  user: "ubar_chops_user",
  accessToken: "ubar_chops_access_token",
  refreshToken: "ubar_chops_refresh_token",
};

const isWeb = Platform.OS === "web";

function isVerificationRequiredError(error: { message?: string } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    message.includes("verify") ||
    message.includes("verification") ||
    message.includes("confirm") ||
    message.includes("email not verified") ||
    message.includes("email verification")
  );
}

async function setItem(key: string, value: string) {
  if (!isWeb) {
    try {
      await SecureStore.setItemAsync(key, value);
      return;
    } catch {
      // Fallback to AsyncStorage if SecureStore is unavailable.
    }
  }
  await AsyncStorage.setItem(key, value);
}

async function getItem(key: string) {
  if (!isWeb) {
    try {
      const value = await SecureStore.getItemAsync(key);
      if (value !== null) return value;
    } catch {
      // Fallback to AsyncStorage if SecureStore is unavailable.
    }
  }
  return AsyncStorage.getItem(key);
}

async function removeItem(key: string) {
  if (!isWeb) {
    try {
      await SecureStore.deleteItemAsync(key);
      return;
    } catch {
      // Fallback to AsyncStorage if SecureStore is unavailable.
    }
  }
  await AsyncStorage.removeItem(key);
}

async function saveSession(
  user: AuthUser,
  accessToken: string,
  refreshToken: string,
) {
  await Promise.all([
    setItem(KEYS.user, JSON.stringify(user)),
    setItem(KEYS.accessToken, accessToken),
    setItem(KEYS.refreshToken, refreshToken),
  ]);
}

function getUserTypeFromProfile(profile?: Record<string, any> | null) {
  return normalizeUserType(profile?.userType) ?? 'customer';
}

function createAuthUser(
  user: { id: string; email: string; profile?: Record<string, any> | null },
  profilePatch?: Record<string, unknown>,
): AuthUser {
  return {
    id: user.id,
    email: user.email,
    profile: {
      ...(user.profile ?? {}),
      ...(profilePatch ?? {}),
    },
  };
}

async function setSignedInProfile(profile: Record<string, unknown>) {
  const { data, error } = await insforge.auth.setProfile(profile);
  if (error) return { profile: null, error: error.message };
  return { profile: data ?? profile, error: null };
}

async function clearSession() {
  await Promise.all([
    removeItem(KEYS.user),
    removeItem(KEYS.accessToken),
    removeItem(KEYS.refreshToken),
  ]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restore() {
      try {
        const [storedUser, storedRefreshToken] = await Promise.all([
          getItem(KEYS.user),
          getItem(KEYS.refreshToken),
        ]);

        if (!storedUser || !storedRefreshToken) {
          setUser(null);
          setAccessToken(null);
          return;
        }

        const { data, error } = await insforge.auth.refreshSession({
          refreshToken: storedRefreshToken,
        });
        if (error || !data?.user) {
          await clearSession();
          setUser(null);
          setAccessToken(null);
          return;
        }

        const newUser: AuthUser = {
          id: data.user.id,
          email: data.user.email,
          profile: data.user.profile,
        };

        const newAccessToken = data.accessToken;
        const newRefreshToken = data.refreshToken ?? storedRefreshToken;
        await saveSession(newUser, newAccessToken, newRefreshToken);
        setUser(newUser);
        setAccessToken(newAccessToken);
      } catch {
        setUser(null);
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    }

    restore();
  }, []);

  async function signIn(
    email: string,
    password: string,
    requestedUserType?: string,
  ): Promise<AuthActionResult> {
    const normalizedRequestedUserType = normalizeUserType(requestedUserType);
    const { data, error } = await insforge.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return {
        error: error.message,
        requiresVerification: isVerificationRequiredError(error),
        email,
      };
    }

    const requireEmailVerification = Boolean(
      (data as { requireEmailVerification?: boolean } | undefined)?.requireEmailVerification,
    );

    if (data?.user?.emailVerified === false || requireEmailVerification) {
      return {
        error: "Please verify your email before signing in.",
        requiresVerification: true,
        email,
        userType: normalizedRequestedUserType ?? undefined,
      };
    }

    let profilePatch: Record<string, unknown> | undefined;
    if (normalizedRequestedUserType) {
      const profileResult = await setSignedInProfile({
        ...(data!.user.profile ?? {}),
        userType: normalizedRequestedUserType,
      });
      if (profileResult.error) return { error: profileResult.error };
      profilePatch = profileResult.profile ?? { userType: normalizedRequestedUserType };
    }

    const authUser = createAuthUser(data!.user, profilePatch);

    const accessTokenValue = data!.accessToken;
    const refreshTokenValue = data!.refreshToken;
    if (!refreshTokenValue)
      return { error: "No refresh token returned. Check isServerMode." };
    await saveSession(authUser, accessTokenValue, refreshTokenValue);
    setUser(authUser);
    setAccessToken(accessTokenValue);
    return { error: null, userType: getUserTypeFromProfile(authUser.profile) };
  }

  async function signUp(params: SignUpParams): Promise<AuthActionResult> {
    const { email, password, firstName, lastName, phone, userType } = params;
    const normalizedUserType = normalizeUserType(userType) ?? 'customer';
    const name = [firstName, lastName].filter(Boolean).join(" ");
    const profilePatch = {
      firstName,
      lastName,
      phone,
      userType: normalizedUserType,
    };
    const { data, error } = await insforge.auth.signUp({
      email,
      password,
      name,
    });
    if (error) return { error: error.message };

    if (data?.requireEmailVerification || data?.user?.emailVerified === false) {
      await insforge.auth.resendVerificationEmail({ email });
      return {
        error: null,
        requiresVerification: true,
        email,
        userType: normalizedUserType,
      };
    }

    if (data?.user && data?.accessToken) {
      const profileResult = await setSignedInProfile(profilePatch);
      if (profileResult.error) return { error: profileResult.error };

      const authUser = createAuthUser(data.user, profileResult.profile ?? profilePatch);
      const accessTokenValue = data.accessToken;
      const refreshTokenValue = data.refreshToken;
      if (refreshTokenValue) {
        await saveSession(authUser, accessTokenValue, refreshTokenValue);
      } else {
        await setItem(KEYS.user, JSON.stringify(authUser));
        await setItem(KEYS.accessToken, accessTokenValue);
        await removeItem(KEYS.refreshToken);
      }
      setUser(authUser);
      setAccessToken(accessTokenValue);
    }

    return { error: null, userType: normalizedUserType };
  }

  async function verifyEmail(
    email: string,
    otp: string,
    profile?: Partial<SignUpParams>,
  ): Promise<{ error: string | null; userType?: AppUserType }> {
    const { data, error } = await insforge.auth.verifyEmail({ email, otp });
    if (error) return { error: error.message };
    if (!data?.user || !data?.accessToken) {
      return { error: "Verification could not be completed." };
    }

    const normalizedUserType = normalizeUserType(profile?.userType);
    const profilePatch = normalizedUserType
      ? {
          firstName: profile?.firstName ?? data.user.profile?.firstName,
          lastName: profile?.lastName ?? data.user.profile?.lastName,
          phone: profile?.phone ?? data.user.profile?.phone,
          userType: normalizedUserType,
        }
      : undefined;

    let savedProfile: Record<string, unknown> | undefined;
    if (profilePatch) {
      const profileResult = await setSignedInProfile(profilePatch);
      if (profileResult.error) return { error: profileResult.error };
      savedProfile = profileResult.profile ?? profilePatch;
    }

    const authUser = createAuthUser(data.user, savedProfile);

    const accessTokenValue = data.accessToken;
    const refreshTokenValue = data.refreshToken ?? "";
    if (refreshTokenValue) {
      await saveSession(authUser, accessTokenValue, refreshTokenValue);
    } else {
      await setItem(KEYS.user, JSON.stringify(authUser));
      await setItem(KEYS.accessToken, accessTokenValue);
      await removeItem(KEYS.refreshToken);
    }
    setUser(authUser);
    setAccessToken(accessTokenValue);
    return { error: null, userType: getUserTypeFromProfile(authUser.profile) };
  }

  async function resendVerificationCode(email: string): Promise<{ error: string | null }> {
    const { error } = await insforge.auth.resendVerificationEmail({ email });
    if (error) return { error: error.message };
    return { error: null };
  }

  async function signOut(): Promise<void> {
    await insforge.auth.signOut();
    await clearSession();
    setUser(null);
    setAccessToken(null);
  }

  async function refreshAuth(): Promise<{ error: string | null; accessToken: string | null }> {
    const storedRefreshToken = await getItem(KEYS.refreshToken);
    if (!storedRefreshToken) return { error: "No refresh token stored", accessToken: null };
    const { data, error } = await insforge.auth.refreshSession({
      refreshToken: storedRefreshToken,
    });
    if (error || !data?.user)
      return { error: error?.message ?? "Session refresh failed", accessToken: null };
    const newAccessToken = data.accessToken;
    const newRefreshToken = data.refreshToken ?? storedRefreshToken;
    await saveSession(
      { id: data.user.id, email: data.user.email, profile: data.user.profile },
      newAccessToken,
      newRefreshToken,
    );
    setAccessToken(newAccessToken);
    return { error: null, accessToken: newAccessToken };
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        signIn,
        signUp,
        verifyEmail,
        resendVerificationCode,
        signOut,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
