import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import { BorderRadius, BrandColors, FontFamily, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { getHomeRoute, normalizeUserType } from '@/lib/authRoutes';
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

export default function SignupScreen() {
  const { userType } = useLocalSearchParams<{ userType: string }>();
  const { signUp } = useAuth();
  const selectedUserType = normalizeUserType(userType) ?? 'customer';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.firstName = 'First name is required';
    if (!lastName.trim()) next.lastName = 'Last name is required';
    if (!email.trim()) next.email = 'Email is required';
    if (!password || password.length < 8) next.password = 'Password must be at least 8 characters';
    return next;
  }

  async function handleSignUp() {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    const { error, requiresVerification, userType: signedUpUserType } = await signUp({
      email: email.trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      userType: selectedUserType,
    });
    setLoading(false);
    if (error) {
      Alert.alert('Sign up failed', error);
      return;
    }
    if (requiresVerification) {
      router.replace({
        pathname: '/(auth)/verify-email',
        params: {
          email: email.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          userType: selectedUserType,
        },
      });
      return;
    }
    router.replace(getHomeRoute(signedUpUserType ?? selectedUserType));
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Nav header */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={BrandColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Ubar Chops</Text>
        <View style={styles.navRight} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            {/* Icon */}
            <View style={styles.iconCircle}>
              <Ionicons name="restaurant" size={26} color={BrandColors.primary} />
            </View>

            <Text style={styles.cardTitle}>Create your account</Text>
            <Text style={styles.cardSubtitle}>
              Join Ubar Chops for effortless culinary logistics.
            </Text>

            {/* Name row */}
            <View style={styles.nameRow}>
              <FormInput
                label="First name"
                placeholder="John"
                value={firstName}
                onChangeText={setFirstName}
                containerStyle={styles.nameInput}
                autoCapitalize="words"
                autoComplete="given-name"
                error={errors.firstName}
              />
              <FormInput
                label="Last name"
                placeholder="Doe"
                value={lastName}
                onChangeText={setLastName}
                containerStyle={styles.nameInput}
                autoCapitalize="words"
                autoComplete="family-name"
                error={errors.lastName}
              />
            </View>

            <FormInput
              label="Phone number"
              leftIcon="call-outline"
              placeholder="(555) 000-0000"
              keyboardType="phone-pad"
              autoComplete="tel"
              value={phone}
              onChangeText={setPhone}
            />
            <FormInput
              label="Email"
              leftIcon="mail-outline"
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
            />
            <FormInput
              label="Password"
              leftIcon="lock-closed-outline"
              placeholder="Min. 8 characters"
              isPassword
              autoComplete="new-password"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
            />

            <Text style={styles.terms}>
              {'By clicking "Create account", you agree to Ubar Chops\' '}
              <Text style={styles.termsLink}>Terms of Service</Text>
              {' and '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
              {'.'}
            </Text>

            <Button
              label="Create account"
              onPress={handleSignUp}
              loading={loading}
              rightIcon={
                !loading ? (
                  <Ionicons name="arrow-forward" size={17} color={BrandColors.white} />
                ) : undefined
              }
            />
          </View>

          <View style={styles.signinRow}>
            <Text style={styles.signinText}>Already have an account?</Text>
            <TouchableOpacity
              onPress={() => router.replace({ pathname: '/login', params: { userType: selectedUserType } })}
              activeOpacity={0.7}
            >
              <Text style={styles.signinLink}>  Sign in</Text>
            </TouchableOpacity>
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
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  navTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FontFamily.extraBold,
    fontSize: 20,
    color: BrandColors.primary,
    letterSpacing: -0.3,
  },
  navRight: {
    width: 38,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: Spacing.xl,
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
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: BrandColors.iconCircleBg,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: 24,
    color: BrandColors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: BrandColors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  nameRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  nameInput: {
    flex: 1,
  },
  terms: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: BrandColors.textSecondary,
    lineHeight: 17,
    marginBottom: 14,
  },
  termsLink: {
    textDecorationLine: 'underline',
    color: BrandColors.textPrimary,
    fontFamily: FontFamily.medium,
  },
  signinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  signinText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: BrandColors.textSecondary,
  },
  signinLink: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: BrandColors.primary,
  },
});
