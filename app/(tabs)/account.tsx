import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { BrandColors, FontFamily, Spacing } from '@/constants/theme';

export default function AccountScreen() {
  const { user, signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
    router.replace('/login');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.center}>
        <Text style={styles.text}>Account</Text>
        <Text style={styles.sub}>{user?.email}</Text>
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  text: { fontFamily: FontFamily.extraBold, fontSize: 24, color: BrandColors.textPrimary, marginBottom: 6 },
  sub:  { fontFamily: FontFamily.regular, fontSize: 14, color: BrandColors.textSecondary, marginBottom: Spacing.xl },
  signOutBtn: {
    backgroundColor: BrandColors.black,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 2,
    borderRadius: 12,
  },
  signOutText: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: BrandColors.white,
  },
});
