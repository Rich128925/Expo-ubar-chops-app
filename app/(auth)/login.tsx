import Button from '@/components/ui/Button';
import Divider from '@/components/ui/Divider';
import FormInput from '@/components/ui/FormInput';
import { BorderRadius, BrandColors, FontFamily, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { AppUserType, getHomeRoute, normalizeUserType } from '@/lib/authRoutes';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ROLE_OPTIONS: { label: string; userType: AppUserType; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Customer', userType: 'customer', icon: 'person-outline' },
  { label: 'Vendor', userType: 'vendor', icon: 'storefront-outline' },
  { label: 'Rider', userType: 'rider', icon: 'bicycle-outline' },
];

export default function LoginScreen() {
  const params = useLocalSearchParams<{ userType?: string }>();
  const { signIn } = useAuth();
  const initialRole = normalizeUserType(params.userType) ?? 'customer';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppUserType>(initialRole);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = 'Email is required';
    if (!password) next.password = 'Password is required';
    return next;
  }

  async function handleLogin() {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    const {
      error,
      requiresVerification,
      email: verifiedEmail,
      userType: signedInUserType,
    } = await signIn(
      email.trim(),
      password,
      selectedRole,
    );
    setLoading(false);
    if (requiresVerification) {
      router.replace({
        pathname: '/(auth)/verify-email',
        params: {
          email: verifiedEmail ?? email.trim(),
          password,
          userType: selectedRole,
        },
      });
      return;
    }
    if (error) {
      Alert.alert('Login failed', error);
      return;
    }
    router.replace(getHomeRoute(signedInUserType));
  }

  function handleForgotPassword() {
    // TODO: navigate to forgot password screen
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Ubar Chops</Text>
            <Text style={styles.subtitle}>Enter your email and password</Text>
          </View>

          <View style={styles.roleCard}>
            <Text style={styles.roleTitle}>Sign in as</Text>
            <View style={styles.roleRow}>
              {ROLE_OPTIONS.map((role) => {
                const isActive = selectedRole === role.userType;
                return (
                  <TouchableOpacity
                    key={role.userType}
                    style={[styles.roleChip, isActive && styles.roleChipActive]}
                    onPress={() => setSelectedRole(role.userType)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={role.icon}
                      size={16}
                      color={isActive ? BrandColors.primary : BrandColors.textSecondary}
                    />
                    <Text style={[styles.roleChipText, isActive && styles.roleChipTextActive]}>
                      {role.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Form card */}
          <View style={styles.card}>
            <FormInput
              label="Email Address"
              leftIcon="mail-outline"
              placeholder="name@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
            />
            <FormInput
              label="Password"
              rightLabel="Forgot password?"
              onRightLabelPress={handleForgotPassword}
              leftIcon="lock-closed-outline"
              placeholder="·······"
              isPassword
              value={password}
              onChangeText={setPassword}
              error={errors.password}
            />

            <Button label="Login" onPress={handleLogin} loading={loading} style={styles.loginBtn} />

            <Divider label="OR" />

            <View style={styles.signupRow}>
              <Text style={styles.signupText}>New to Ubar Chops?</Text>
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/(auth)/signup', params: { userType: selectedRole } })}
                activeOpacity={0.7}
              >
                <Text style={styles.signupLink}>  Create account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BrandColors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontFamily: FontFamily.extraBold,
    fontSize: 34,
    color: BrandColors.primary,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: BrandColors.textSecondary,
  },
  roleCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: BrandColors.cardBg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  roleTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: BrandColors.textSecondary,
    marginBottom: Spacing.sm,
  },
  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: BrandColors.divider,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    backgroundColor: BrandColors.background,
  },
  roleChipActive: {
    borderColor: BrandColors.primary,
    backgroundColor: BrandColors.iconCircleBg,
  },
  roleChipText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: BrandColors.textSecondary,
  },
  roleChipTextActive: {
    color: BrandColors.primary,
  },
  card: {
    marginHorizontal: Spacing.md,
    backgroundColor: BrandColors.cardBg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  loginBtn: {
    marginTop: 4,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 4,
  },
  signupText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: BrandColors.textSecondary,
  },
  signupLink: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: BrandColors.primary,
  },
});
