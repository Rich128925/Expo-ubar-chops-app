import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, Spacing, BorderRadius, FontFamily } from '@/constants/theme';
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import Divider from '@/components/ui/Divider';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      Alert.alert('Login failed', error);
      return;
    }
    router.replace('/(tabs)');
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
                onPress={() => router.push('/(auth)/select-role')}
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
