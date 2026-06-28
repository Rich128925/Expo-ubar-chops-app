import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BrandColors, FontFamily, Spacing, BorderRadius } from '@/constants/theme';
import VendorHeader from '@/components/ui/VendorHeader';
import { useDishes } from '@/context/DishesContext';

type Category = 'all' | 'main' | 'sides' | 'beverages' | 'desserts';

const CATEGORIES: Array<{ key: Category; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'main', label: 'Mains' },
  { key: 'sides', label: 'Sides' },
  { key: 'beverages', label: 'Beverages' },
  { key: 'desserts', label: 'Desserts' },
];

const DISH_COLORS: Record<string, { bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  main: { bg: '#FFF3E0', icon: 'fast-food-outline' },
  sides: { bg: '#F3E5F5', icon: 'leaf-outline' },
  beverages: { bg: '#E3F2FD', icon: 'cafe-outline' },
  desserts: { bg: '#FCE4EC', icon: 'ice-cream-outline' },
};

const DISH_COLOR_FALLBACK = { bg: '#F3F4F6', icon: 'restaurant-outline' as keyof typeof Ionicons.glyphMap };

export default function VendorDishesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const { dishes, toggleAvailability } = useDishes();

  const filtered = dishes.filter((d) => {
    const matchesCategory = activeCategory === 'all' || d.category === activeCategory;
    const matchesSearch =
      searchQuery === '' || d.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <VendorHeader title="Menu" />

      {/* Search + filter row */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={BrandColors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search dishes..."
            placeholderTextColor={BrandColors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7}>
          <Ionicons name="options-outline" size={20} color={BrandColors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Category tabs */}
      <View style={styles.tabBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={false}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.tabItem, activeCategory === cat.key && styles.tabItemActive]}
              onPress={() => setActiveCategory(cat.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabLabel, activeCategory === cat.key && styles.tabLabelActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Dish list */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {filtered.map((dish, index) => {
          const meta = DISH_COLORS[dish.category] ?? DISH_COLOR_FALLBACK;
          return (
            <View key={dish.id}>
              <View style={styles.dishRow}>
                {/* Thumbnail */}
                {dish.image_url ? (
                  <Image source={{ uri: dish.image_url }} style={styles.thumbnail} resizeMode="cover" />
                ) : (
                  <View style={[styles.thumbnail, { backgroundColor: meta.bg }]}>
                    <Ionicons name={meta.icon} size={28} color={BrandColors.primary} />
                  </View>
                )}

                {/* Info */}
                <View style={styles.dishInfo}>
                  <Text style={styles.dishName}>{dish.name}</Text>
                  <Text style={styles.dishPrice}>${dish.price.toFixed(2)}</Text>
                  <Text style={[styles.dishStatus, !dish.available && styles.dishStatusSoldOut]}>
                    {dish.available ? 'Available' : 'Sold Out'}
                  </Text>
                </View>

                {/* Toggle */}
                <Switch
                  value={dish.available}
                  onValueChange={() => toggleAvailability(dish.id)}
                  trackColor={{ false: BrandColors.divider, true: BrandColors.primary }}
                  thumbColor={BrandColors.white}
                  ios_backgroundColor={BrandColors.divider}
                />
              </View>
              {index < filtered.length - 1 && <View style={styles.rowDivider} />}
            </View>
          );
        })}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No dishes found</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/vendor-add-dish')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={BrandColors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.background },
  // search
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: BrandColors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.divider,
    gap: Spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: BrandColors.textPrimary,
    paddingVertical: 0,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: BrandColors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // category tabs
  tabBar: {
    backgroundColor: BrandColors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.divider,
  },
  tabItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemActive: {
    borderBottomColor: BrandColors.primary,
  },
  tabLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: BrandColors.textMuted,
  },
  tabLabelActive: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: BrandColors.primary,
  },
  // scroll + dish rows
  scroll: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: Spacing.md,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  dishInfo: { flex: 1 },
  dishName: {
    fontFamily: FontFamily.semiBold,
    fontSize: 15,
    color: BrandColors.textPrimary,
    marginBottom: 4,
  },
  dishPrice: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: BrandColors.textSecondary,
    marginBottom: 4,
  },
  dishStatus: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: BrandColors.primary,
  },
  dishStatusSoldOut: { color: BrandColors.error },
  rowDivider: {
    height: 1,
    backgroundColor: BrandColors.divider,
  },
  empty: { paddingVertical: Spacing.xxl, alignItems: 'center' },
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: BrandColors.textSecondary,
  },
  // FAB
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BrandColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BrandColors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
