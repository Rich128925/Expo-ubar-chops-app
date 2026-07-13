import { insforge } from "@/lib/insforge";
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
};

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  signUp: (params: SignUpParams) => Promise<AuthActionResult>;
  verifyEmail: (email: string, otp: string) => Promise<{ error: string | null }>;
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
  ): Promise<AuthActionResult> {
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
      };
    }

    const authUser: AuthUser = {
      id: data!.user.id,
      email: data!.user.email,
      profile: data!.user.profile,
    };

    const accessTokenValue = data!.accessToken;
    const refreshTokenValue = data!.refreshToken;
    if (!refreshTokenValue)
      return { error: "No refresh token returned. Check isServerMode." };
    await saveSession(authUser, accessTokenValue, refreshTokenValue);
    setUser(authUser);
    setAccessToken(accessTokenValue);
    return { error: null };
  }

  async function signUp(params: SignUpParams): Promise<AuthActionResult> {
    const { email, password, firstName, lastName, phone, userType } = params;
    const { data, error } = await insforge.auth.signUp({
      email,
      password,
      name: [firstName, lastName].filter(Boolean).join(" "),
    });
    if (error) return { error: error.message };
    if (data?.user) {
      try {
        await insforge.auth.setProfile({ firstName, lastName, phone, userType });
      } catch {
        // Ignore profile update failures and continue with verification flow.
      }
    }

    if (data?.requireEmailVerification || data?.user?.emailVerified === false) {
      await insforge.auth.resendVerificationEmail({ email });
      return { error: null, requiresVerification: true, email };
    }

    return { error: null };
  }

  async function verifyEmail(email: string, otp: string): Promise<{ error: string | null }> {
    const { data, error } = await insforge.auth.verifyEmail({ email, otp });
    if (error) return { error: error.message };
    if (!data?.user || !data?.accessToken) {
      return { error: "Verification could not be completed." };
    }

    const authUser: AuthUser = {
      id: data.user.id,
      email: data.user.email,
      profile: data.user.profile,
    };

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
    return { error: null };
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
