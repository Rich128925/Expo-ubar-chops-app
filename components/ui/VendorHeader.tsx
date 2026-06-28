import React from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrandColors, FontFamily, Spacing, BorderRadius } from '@/constants/theme';
import { useRestaurant } from '@/context/RestaurantContext';

interface VendorHeaderProps {
  title: string;
  titleIcon?: keyof typeof Ionicons.glyphMap;
  showStatusToggle?: boolean;
}

export default function VendorHeader({ title, titleIcon, showStatusToggle = false }: VendorHeaderProps) {
  const { restaurant, toggleOpen } = useRestaurant();
  const isOpen = restaurant?.is_open ?? true;

  return (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        {titleIcon && (
          <Ionicons name={titleIcon} size={22} color={BrandColors.primary} style={styles.titleIcon} />
        )}
        <Text style={styles.title}>{title}</Text>
      </View>

      {showStatusToggle ? (
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status</Text>
          <Switch
            value={isOpen}
            onValueChange={toggleOpen}
            trackColor={{ false: BrandColors.divider, true: BrandColors.primary }}
            thumbColor={BrandColors.white}
            ios_backgroundColor={BrandColors.divider}
          />
          <Text style={[styles.statusText, !isOpen && styles.statusTextOff]}>
            {isOpen ? 'Open' : 'Closed'}
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.openBadge, !isOpen && styles.closedBadge]}
          onPress={toggleOpen}
          activeOpacity={0.8}
        >
          <Text style={[styles.openBadgeText, !isOpen && styles.closedBadgeText]}>
            {isOpen ? 'Open' : 'Closed'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: BrandColors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.divider,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  titleIcon: { marginRight: 8 },
  title: {
    fontFamily: FontFamily.extraBold,
    fontSize: 22,
    color: BrandColors.primary,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: BrandColors.textSecondary,
  },
  statusText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: BrandColors.primary,
  },
  statusTextOff: { color: BrandColors.textSecondary },
  openBadge: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  closedBadge: { backgroundColor: BrandColors.divider },
  openBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: BrandColors.white,
  },
  closedBadgeText: { color: BrandColors.textSecondary },
});
