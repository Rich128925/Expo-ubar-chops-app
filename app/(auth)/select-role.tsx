import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BrandColors, Spacing, BorderRadius, FontFamily } from '@/constants/theme';
import Button from '@/components/ui/Button';

type RoleOption = {
  label: string;
  userType: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const ROLES: RoleOption[] = [
  {
    label: 'User',
    userType: 'customer',
    description: 'Order food and track deliveries',
    icon: 'person-outline',
  },
  {
    label: 'Vendor',
    userType: 'vendor',
    description: 'Manage your restaurant or food business',
    icon: 'storefront-outline',
  },
  {
    label: 'Rider',
    userType: 'rider',
    description: 'Deliver orders and earn on your schedule',
    icon: 'bicycle-outline',
  },
];

export default function SelectRoleScreen() {
  const [selected, setSelected] = useState<string | null>(null);

  function handleContinue() {
    if (!selected) return;
    router.push({ pathname: '/(auth)/signup', params: { userType: selected } });
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

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconCircle}>
          <Ionicons name="people-outline" size={26} color={BrandColors.primary} />
        </View>

        <Text style={styles.title}>I am a...</Text>
        <Text style={styles.subtitle}>Choose your account type to get started</Text>

        {/* Role options */}
        <View style={styles.optionsContainer}>
          {ROLES.map((role) => {
            const isSelected = selected === role.userType;
            return (
              <TouchableOpacity
                key={role.userType}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => setSelected(role.userType)}
                activeOpacity={0.8}
              >
                <View style={[styles.optionIconWrap, isSelected && styles.optionIconWrapSelected]}>
                  <Ionicons
                    name={role.icon}
                    size={22}
                    color={isSelected ? BrandColors.primary : BrandColors.textSecondary}
                  />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    {role.label}
                  </Text>
                  <Text style={styles.optionDesc}>{role.description}</Text>
                </View>
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Button
          label="Continue"
          onPress={handleContinue}
          disabled={!selected}
          rightIcon={<Ionicons name="arrow-forward" size={17} color={BrandColors.white} />}
          style={styles.continueBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BrandColors.background,
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
  content: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
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
    fontSize: 26,
    color: BrandColors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: BrandColors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  optionsContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.cardBg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: BrandColors.divider,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  optionSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: BrandColors.iconCircleBg,
  },
  optionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BrandColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  optionIconWrapSelected: {
    backgroundColor: BrandColors.cardBg,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    color: BrandColors.textPrimary,
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: BrandColors.primary,
  },
  optionDesc: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: BrandColors.textSecondary,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: BrandColors.divider,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  radioSelected: {
    borderColor: BrandColors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BrandColors.primary,
  },
  continueBtn: {
    marginTop: 'auto',
    marginBottom: Spacing.md,
  },
});
