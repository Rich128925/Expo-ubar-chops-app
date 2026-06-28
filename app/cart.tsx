import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BrandColors, FontFamily, Spacing, BorderRadius } from '@/constants/theme';
import { useCart } from '@/context/CartContext';
import { RESTAURANTS } from '@/data/restaurants';

const DELIVERY_FEE = 2.99;
const SERVICE_FEE = 1.50;

const SUGGESTED = [
  { id: 'sug1', name: 'Sweet Potato Fries', price: 4.50, image: 'https://images.unsplash.com/photo-1576777647209-e8733d7b851d?w=300&q=80' },
  { id: 'sug2', name: 'Citrus Mint Lemonade', price: 3.00, image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=300&q=80' },
  { id: 'sug3', name: 'Onion Rings', price: 4.95, image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=300&q=80' },
];

export default function CartScreen() {
  const { items, restaurantId, updateQuantity, addItem, subtotal } = useCart();
  const [promoCode, setPromoCode] = useState('');
  const insets = useSafeAreaInsets();
  const total = subtotal + DELIVERY_FEE + SERVICE_FEE;

  const restaurant = restaurantId ? RESTAURANTS.find((r) => r.id === restaurantId) : null;

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={BrandColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Cart</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="basket-outline" size={56} color={BrandColors.textMuted} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add items from a restaurant to get started</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.replace('/(tabs)')} activeOpacity={0.8}>
            <Text style={styles.emptyBtnText}>Browse Restaurants</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={BrandColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Cart</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Cart items */}
        <Text style={styles.sectionTitle}>Cart Items</Text>
        <View style={styles.card}>
          {items.map((item, index) => (
            <React.Fragment key={item.id}>
              <View style={styles.cartItem}>
                <Image source={{ uri: item.image }} style={styles.cartItemImage} contentFit="cover" />
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName}>{item.name}</Text>
                  {item.customization && (
                    <Text style={styles.cartItemCustom}>{item.customization}</Text>
                  )}
                  <Text style={styles.cartItemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
                </View>
                <View style={styles.qtyControls}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="remove" size={16} color={BrandColors.textPrimary} />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={[styles.qtyBtn, styles.qtyBtnAdd]}
                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={16} color={BrandColors.white} />
                  </TouchableOpacity>
                </View>
              </View>
              {index < items.length - 1 && <View style={styles.itemDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* People also ordered */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>People also ordered</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestedScroll}>
          {SUGGESTED.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={styles.suggestedCard}
              onPress={() => {
                if (restaurantId) {
                  addItem({ id: s.id, name: s.name, price: s.price, image: s.image, restaurantId });
                }
              }}
              activeOpacity={0.85}
            >
              <Image source={{ uri: s.image }} style={styles.suggestedImage} contentFit="cover" />
              <View style={styles.suggestedAddBtn}>
                <Ionicons name="add" size={18} color={BrandColors.white} />
              </View>
              <Text style={styles.suggestedName} numberOfLines={2}>{s.name}</Text>
              <Text style={styles.suggestedPrice}>${s.price.toFixed(2)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Order summary */}
        <View style={[styles.card, { marginTop: Spacing.lg }]}>
          <Text style={styles.summaryTitle}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>${DELIVERY_FEE.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service Fee</Text>
            <Text style={styles.summaryValue}>${SERVICE_FEE.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>

          {/* Promo code */}
          <Text style={styles.promoLabel}>Promo Code</Text>
          <View style={styles.promoRow}>
            <TextInput
              style={styles.promoInput}
              placeholder="Enter code"
              placeholderTextColor={BrandColors.textMuted}
              value={promoCode}
              onChangeText={setPromoCode}
            />
            <TouchableOpacity style={styles.promoBtn} activeOpacity={0.8}>
              <Text style={styles.promoBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={() => router.push('/checkout')}
            activeOpacity={0.85}
          >
            <Text style={styles.checkoutBtnText}>Go to Checkout →</Text>
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By placing your order, you agree to our Terms and Conditions.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.bottomBarLeft}>
          <Text style={styles.bottomBarLabel}>Total (incl. fees)</Text>
          <Text style={styles.bottomBarTotal}>${total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={styles.bottomBarBtn}
          onPress={() => router.push('/checkout')}
          activeOpacity={0.85}
        >
          <Text style={styles.bottomBarBtnText}>Go to Checkout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.background },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: { padding: Spacing.sm, marginLeft: -Spacing.sm },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FontFamily.extraBold,
    fontSize: 20,
    color: BrandColors.textPrimary,
  },
  scroll: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  sectionTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: 18,
    color: BrandColors.textPrimary,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: BrandColors.cardBg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    padding: Spacing.md,
  },
  // cart items
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  cartItemImage: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
  },
  cartItemInfo: { flex: 1 },
  cartItemName: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: BrandColors.textPrimary,
    marginBottom: 2,
  },
  cartItemCustom: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: BrandColors.textSecondary,
    marginBottom: 2,
  },
  cartItemPrice: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: BrandColors.primary,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: BrandColors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnAdd: { backgroundColor: BrandColors.primary },
  qtyText: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: BrandColors.textPrimary,
    minWidth: 20,
    textAlign: 'center',
  },
  itemDivider: {
    height: 1,
    backgroundColor: BrandColors.background,
    marginVertical: 2,
  },
  // suggested
  suggestedScroll: { gap: Spacing.sm, paddingBottom: Spacing.sm },
  suggestedCard: {
    width: 140,
    backgroundColor: BrandColors.cardBg,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    paddingBottom: Spacing.sm,
  },
  suggestedImage: { width: '100%', height: 100, position: 'relative' },
  suggestedAddBtn: {
    position: 'absolute',
    bottom: 42,
    right: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BrandColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestedName: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: BrandColors.textPrimary,
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.xs,
    marginBottom: 2,
  },
  suggestedPrice: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: BrandColors.textSecondary,
    paddingHorizontal: Spacing.sm,
  },
  // order summary
  summaryTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: 18,
    color: BrandColors.textPrimary,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: BrandColors.textSecondary,
  },
  summaryValue: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: BrandColors.textPrimary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: BrandColors.divider,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  totalLabel: {
    fontFamily: FontFamily.extraBold,
    fontSize: 16,
    color: BrandColors.textPrimary,
  },
  totalValue: {
    fontFamily: FontFamily.extraBold,
    fontSize: 16,
    color: BrandColors.primary,
  },
  promoLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: BrandColors.textSecondary,
    marginBottom: 6,
  },
  promoRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  promoInput: {
    flex: 1,
    backgroundColor: BrandColors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: BrandColors.textPrimary,
  },
  promoBtn: {
    backgroundColor: BrandColors.textSecondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  promoBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: BrandColors.white,
  },
  checkoutBtn: {
    backgroundColor: BrandColors.primary,
    borderRadius: BorderRadius.md,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  checkoutBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: BrandColors.white,
  },
  termsText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: BrandColors.textMuted,
    textAlign: 'center',
  },
  // bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.cardBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: BrandColors.divider,
    gap: Spacing.md,
  },
  bottomBarLeft: { flex: 1 },
  bottomBarLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: BrandColors.textSecondary,
  },
  bottomBarTotal: {
    fontFamily: FontFamily.extraBold,
    fontSize: 17,
    color: BrandColors.textPrimary,
  },
  bottomBarBtn: {
    backgroundColor: BrandColors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
  },
  bottomBarBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: BrandColors.white,
  },
  // empty state
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: 22,
    color: BrandColors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: BrandColors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  emptyBtn: {
    backgroundColor: BrandColors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
  },
  emptyBtnText: { fontFamily: FontFamily.bold, fontSize: 15, color: BrandColors.white },
});
