import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BrandColors, FontFamily, Spacing, BorderRadius } from '@/constants/theme';
import VendorHeader from '@/components/ui/VendorHeader';

const ORDER_HISTORY = [
  {
    id: 'UB-94281',
    status: 'completed' as const,
    items: 'Double Beef Burger, Spicy Wings (x2), Large Fries',
    date: 'Oct 24, 2023 • 14:32 PM',
    priceLabel: 'TOTAL PRICE',
    amount: 42.50,
  },
  {
    id: 'UB-94275',
    status: 'cancelled' as const,
    items: 'Vegan Buddha Bowl, Fresh Orange Juice',
    date: 'Oct 24, 2023 • 12:15 PM',
    priceLabel: 'REFUNDED',
    amount: 18.20,
  },
  {
    id: 'UB-94262',
    status: 'completed' as const,
    items: 'Family Feast Bundle (12pc), Coleslaw, Soft Drinks (x4)',
    date: 'Oct 23, 2023 • 19:45 PM',
    priceLabel: 'TOTAL PRICE',
    amount: 89.99,
  },
  {
    id: 'UB-94250',
    status: 'completed' as const,
    items: 'California Roll (x2), Salmon Sashimi, Miso Soup',
    date: 'Oct 23, 2023 • 13:10 PM',
    priceLabel: 'TOTAL PRICE',
    amount: 35.00,
  },
];

export default function VendorHistoryScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = ORDER_HISTORY.filter(
    (o) =>
      searchQuery === '' ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <VendorHeader title="Orders" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>Order History</Text>

        {/* Filter actions */}
        <View style={styles.filterRow}>
          <TouchableOpacity style={styles.filterChip} activeOpacity={0.7}>
            <Ionicons name="calendar-outline" size={14} color={BrandColors.textSecondary} />
            <Text style={styles.filterChipText}>Date Range</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterChip} activeOpacity={0.7}>
            <Ionicons name="options-outline" size={14} color={BrandColors.textSecondary} />
            <Text style={styles.filterChipText}>Filters</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={BrandColors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Order ID or items..."
            placeholderTextColor={BrandColors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>

        {/* Order cards */}
        <View style={styles.orderList}>
          {filtered.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.cardTop}>
                <Text style={styles.orderId}>#{order.id}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    order.status === 'cancelled' ? styles.cancelledBadge : styles.completedBadge,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      order.status === 'cancelled' ? styles.cancelledDot : styles.completedDot,
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      order.status === 'cancelled' ? styles.cancelledText : styles.completedText,
                    ]}
                  >
                    {order.status === 'cancelled' ? 'Cancelled' : 'Completed'}
                  </Text>
                </View>
              </View>

              <Text style={styles.itemsSummary}>{order.items}</Text>
              <Text style={styles.orderDate}>{order.date}</Text>

              <View style={styles.cardDivider} />

              <View style={styles.cardBottom}>
                <View>
                  <Text style={styles.priceLabelText}>{order.priceLabel}</Text>
                  <Text style={styles.priceAmount}>${order.amount.toFixed(2)}</Text>
                </View>
                <TouchableOpacity style={styles.detailsBtn} activeOpacity={0.7}>
                  <Text style={styles.detailsBtnText}>Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {filtered.length > 0 && (
          <TouchableOpacity style={styles.showMoreRow} activeOpacity={0.7}>
            <Text style={styles.showMoreText}>Show more orders</Text>
            <Ionicons name="chevron-down" size={16} color={BrandColors.primary} />
          </TouchableOpacity>
        )}

        {filtered.length === 0 && (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>No orders match your search</Text>
          </View>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.background },
  scroll: { padding: Spacing.md },
  pageTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: 26,
    color: BrandColors.textPrimary,
    marginBottom: Spacing.md,
  },
  // filters
  filterRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: BrandColors.divider,
    borderRadius: BorderRadius.full,
    backgroundColor: BrandColors.cardBg,
  },
  filterChipText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: BrandColors.textSecondary,
  },
  // search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.cardBg,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1.5,
    borderColor: BrandColors.divider,
    marginBottom: Spacing.md,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: BrandColors.textPrimary,
    paddingVertical: 0,
  },
  // order cards
  orderList: { gap: Spacing.sm },
  orderCard: {
    backgroundColor: BrandColors.cardBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: BrandColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: BrandColors.textPrimary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  completedBadge: { backgroundColor: BrandColors.earningsBg },
  cancelledBadge: { backgroundColor: BrandColors.cancelledBg },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  completedDot: { backgroundColor: BrandColors.earningsText },
  cancelledDot: { backgroundColor: BrandColors.cancelledText },
  statusText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
  },
  completedText: { color: BrandColors.earningsText },
  cancelledText: { color: BrandColors.cancelledText },
  itemsSummary: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: BrandColors.textPrimary,
    marginBottom: 4,
    lineHeight: 20,
  },
  orderDate: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: BrandColors.textSecondary,
  },
  cardDivider: {
    height: 1,
    backgroundColor: BrandColors.background,
    marginVertical: 12,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabelText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    color: BrandColors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  priceAmount: {
    fontFamily: FontFamily.extraBold,
    fontSize: 18,
    color: BrandColors.primary,
  },
  detailsBtn: {
    backgroundColor: BrandColors.textPrimary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  detailsBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: BrandColors.white,
  },
  // show more
  showMoreRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.md,
  },
  showMoreText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: BrandColors.primary,
  },
  noResults: { paddingVertical: Spacing.xxl, alignItems: 'center' },
  noResultsText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: BrandColors.textSecondary,
  },
});
