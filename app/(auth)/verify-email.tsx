import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import { BorderRadius, BrandColors, FontFamily, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { getHomeRoute, normalizeUserType } from '@/lib/authRoutes';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<{
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    userType?: string;
  }>();
  const { verifyEmail, resendVerificationCode } = useAuth();

  const email = typeof params.email === 'string' ? params.email : '';
  const selectedUserType = normalizeUserType(params.userType);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!email) {
      router.replace({
        pathname: '/(auth)/login',
        params: selectedUserType ? { userType: selectedUserType } : {},
      });
    }
  }, [email, selectedUserType]);

  async function handleVerify() {
    if (!email.trim() || otp.trim().length !== 6) {
      Alert.alert('Verification needed', 'Enter the 6-digit code sent to your email.');
      return;
    }

    setLoading(true);
    const { error, userType } = await verifyEmail(email.trim(), otp.trim(), {
      firstName: typeof params.firstName === 'string' ? params.firstName : undefined,
      lastName: typeof params.lastName === 'string' ? params.lastName : undefined,
      phone: typeof params.phone === 'string' ? params.phone : undefined,
      userType: selectedUserType ?? undefined,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Verification failed', error);
      return;
    }

    router.replace(getHomeRoute(userType ?? selectedUserType));
  }

  async function handleResend() {
    if (!email.trim()) return;
    setResending(true);
    const { error } = await resendVerificationCode(email.trim());
    setResending(false);
    if (error) {
      Alert.alert('Could not resend code', error);
      return;
    }
    Alert.alert('Code sent', 'A new verification code has been sent to your email.');
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
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Ionicons name="mail-open-outline" size={26} color={BrandColors.primary} />
            </View>

            <Text style={styles.title}>Verify your email</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code we sent to {email || 'your email'}.
            </Text>

            <FormInput
              label="Verification code"
              placeholder="123456"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              autoCapitalize="none"
            />

            <Button label="Confirm code" onPress={handleVerify} loading={loading} />

            <TouchableOpacity onPress={handleResend} style={styles.resendBtn} activeOpacity={0.7}>
              <Text style={styles.resendText}>{resending ? 'Sending…' : 'Resend code'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                router.replace({
                  pathname: '/(auth)/login',
                  params: selectedUserType ? { userType: selectedUserType } : {},
                })
              }
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.backText}>Back to sign in</Text>
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
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.md,
  },
  card: {
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
  title: {
    fontFamily: FontFamily.extraBold,
    fontSize: 24,
    color: BrandColors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: BrandColors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  resendBtn: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  resendText: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: BrandColors.primary,
  },
  backBtn: {
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  backText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: BrandColors.textSecondary,
  },
});
