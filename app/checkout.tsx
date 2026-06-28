import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStripe } from '@stripe/stripe-react-native';
import { BrandColors, FontFamily, Spacing, BorderRadius } from '@/constants/theme';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useAddress } from '@/hooks/use-address';
import { insforge } from '@/lib/insforge';

const SERVICE_FEE = 1.50;

const DELIVERY_OPTIONS = [
  { id: 'standard', label: 'Standard', time: '30-45 mins', note: 'Free · Nearby deliveries first', fee: 0 },
  { id: 'priority', label: 'Priority', time: '15-25 mins', note: '+$2.49 · Direct to you', fee: 2.49 },
];

export default function CheckoutScreen() {
  const { items, restaurantId, subtotal, clearCart } = useCart();
  const { refreshAuth } = useAuth();
  const { address } = useAddress();
  const insets = useSafeAreaInsets();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [deliveryOption, setDeliveryOption] = useState('standard');
  const [loading, setLoading] = useState(false);

  const selectedDelivery = DELIVERY_OPTIONS.find((d) => d.id === deliveryOption)!;
  const total = subtotal + selectedDelivery.fee + SERVICE_FEE;

  async function handlePlaceOrder() {
    if (!restaurantId) {
      Alert.alert('Error', 'No restaurant selected.');
      return;
    }

    setLoading(true);
    try {
      // Re-arm the InsForge SDK session before calling functions.
      console.log('[checkout] Step 1: refreshing auth session');
      const { error: refreshError, accessToken } = await refreshAuth();
      if (refreshError || !accessToken) throw new Error('Session expired. Please log in again.');
      console.log('[checkout] Step 1 done: session refreshed');

      // 2. Create order (payment_status: 'unconfirmed') + Stripe PaymentIntent.
      console.log('[checkout] Step 2: creating order + PaymentIntent');
      const { data, error: fnError } = await insforge.functions.invoke('create-order-payment', {
        body: {
          restaurantId,
          items: items.map((i) => ({
            id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            image: i.image,
          })),
          subtotal,
          deliveryFee: selectedDelivery.fee,
          serviceFee: SERVICE_FEE,
          total,
          deliveryAddress: address ?? '',
        },
      });

      console.log('[checkout] Step 2 result:', { data, fnError });
      if (fnError || !data?.clientSecret) {
        throw new Error(fnError?.message ?? 'Failed to create order. Please try again.');
      }

      const { orderId, paymentIntentId, clientSecret } = data as {
        orderId: string;
        paymentIntentId: string;
        clientSecret: string;
      };

      console.log('[checkout] Step 3: orderId =', orderId, 'paymentIntentId =', paymentIntentId);

      // 3. Initialise the Stripe Payment Sheet.
      console.log('[checkout] Step 3: initialising payment sheet');
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Ubar Chops',
        returnURL: 'uberchops://stripe-redirect',
        style: 'automatic',
      });
      if (initError) throw new Error(initError.message);
      console.log('[checkout] Step 3 done: payment sheet initialised');

      // 4. Present the Payment Sheet to the user.
      console.log('[checkout] Step 4: presenting payment sheet');
      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        console.log('[checkout] Step 4 dismissed/error:', presentError.code, presentError.message);
        if (presentError.code === 'Canceled') return; // user dismissed — silent
        throw new Error(presentError.message);
      }
      console.log('[checkout] Step 4 done: payment sheet completed');

      // 5. Verify payment server-side and flip payment_status → 'successful'.
      console.log('[checkout] Step 5: confirming payment server-side');
      const { data: confirmData, error: confirmError } = await insforge.functions.invoke(
        'confirm-order-payment',
        { body: { orderId, paymentIntentId } }
      );
      console.log('[checkout] Step 5 result:', { confirmData, confirmError });

      if (confirmError || !confirmData?.success) {
        throw new Error(confirmError?.message ?? 'Payment confirmation failed. Contact support.');
      }

      // 6. All done — clear cart and navigate to the real order detail.
      console.log('[checkout] Step 6: payment confirmed, navigating to order detail');
      clearCart();
      router.replace(`/order/${orderId}`);
    } catch (e: any) {
      Alert.alert('Payment Error', e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={BrandColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <TouchableOpacity onPress={() => router.push('/cart')} style={styles.cartBtn} activeOpacity={0.7}>
          <Ionicons name="basket-outline" size={22} color={BrandColors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Delivery address */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Delivery details</Text>
          <TouchableOpacity onPress={() => router.push('/address-search')} activeOpacity={0.7}>
            <Text style={styles.editLink}>Edit</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          <View style={styles.addressCard}>
            <View style={styles.addressIconWrap}>
              <Ionicons name="location-outline" size={20} color={BrandColors.textSecondary} />
            </View>
            <View style={styles.addressCardText}>
              <Text style={styles.addressCardTitle}>Home</Text>
              <Text style={styles.addressCardValue}>{address ?? 'No address set'}</Text>
              <View style={styles.noteRow}>
                <Ionicons name="information-circle-outline" size={13} color={BrandColors.textMuted} />
                <Text style={styles.noteText}>Leave at the door</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Delivery time */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Delivery time</Text>
        <View style={styles.deliveryOptions}>
          {DELIVERY_OPTIONS.map((option) => {
            const isSelected = deliveryOption === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.deliveryOption, isSelected && styles.deliveryOptionSelected]}
                onPress={() => setDeliveryOption(option.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.deliveryLabel, isSelected && styles.deliveryLabelSelected]}>
                  {option.label}
                </Text>
                <Text style={styles.deliveryTime}>{option.time}</Text>
                <Text style={[styles.deliveryNote, isSelected && styles.deliveryNoteSelected]}>
                  {option.note}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Payment — Stripe handles method selection in the sheet */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Payment</Text>
        <View style={styles.card}>
          <View style={styles.stripeRow}>
            <View style={styles.stripeIconBox}>
              <Ionicons name="card-outline" size={20} color={BrandColors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stripeLabel}>Secure payment via Stripe</Text>
              <Text style={styles.stripeNote}>Card, Apple Pay, Google Pay &amp; more</Text>
            </View>
            <Ionicons name="shield-checkmark-outline" size={18} color={BrandColors.primary} />
          </View>
        </View>

        {/* Order summary */}
        <View style={[styles.card, { marginTop: Spacing.lg }]}>
          <Text style={styles.summaryTitle}>Order summary</Text>
          {items.map((item, index) => (
            <React.Fragment key={item.id}>
              <View style={styles.orderItem}>
                <Image source={{ uri: item.image }} style={styles.orderItemImage} contentFit="cover" />
                <View style={styles.orderItemInfo}>
                  <View style={styles.orderItemNameRow}>
                    <Text style={styles.orderItemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.orderItemTotal}>${(item.price * item.quantity).toFixed(2)}</Text>
                  </View>
                  {item.customization && (
                    <Text style={styles.orderItemCustom}>{item.customization}</Text>
                  )}
                  <Text style={styles.orderItemQty}>Qty: {item.quantity}</Text>
                </View>
              </View>
              {index < items.length - 1 && <View style={styles.itemDivider} />}
            </React.Fragment>
          ))}

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>
              {selectedDelivery.fee === 0 ? 'Free' : `$${selectedDelivery.fee.toFixed(2)}`}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service Fee</Text>
            <Text style={styles.summaryValue}>${SERVICE_FEE.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, { marginTop: Spacing.sm }]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>

          <Text style={styles.termsText}>
            By placing your order, you agree to our Terms of Service.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Place Order button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.placeOrderBtn, loading && styles.placeOrderBtnDisabled]}
          onPress={handlePlaceOrder}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={BrandColors.white} />
          ) : (
            <>
              <Text style={styles.placeOrderText}>Place Order</Text>
              <Text style={styles.placeOrderPrice}>${total.toFixed(2)}</Text>
            </>
          )}
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
    color: BrandColors.primary,
  },
  cartBtn: { padding: Spacing.sm },
  scroll: { paddingHorizontal: Spacing.md },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: 17,
    color: BrandColors.textPrimary,
    marginBottom: Spacing.sm,
  },
  editLink: { fontFamily: FontFamily.semiBold, fontSize: 14, color: BrandColors.primary },
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
  // delivery address
  addressCard: { flexDirection: 'row', gap: Spacing.md },
  addressIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BrandColors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressCardText: { flex: 1 },
  addressCardTitle: { fontFamily: FontFamily.bold, fontSize: 15, color: BrandColors.textPrimary, marginBottom: 2 },
  addressCardValue: { fontFamily: FontFamily.regular, fontSize: 13, color: BrandColors.textSecondary, marginBottom: 4 },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  noteText: { fontFamily: FontFamily.regular, fontSize: 12, color: BrandColors.textMuted },
  // delivery options
  deliveryOptions: { gap: Spacing.sm },
  deliveryOption: {
    backgroundColor: BrandColors.cardBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: BrandColors.divider,
  },
  deliveryOptionSelected: { borderColor: BrandColors.primary, backgroundColor: '#F0FAF4' },
  deliveryLabel: { fontFamily: FontFamily.bold, fontSize: 15, color: BrandColors.textPrimary, marginBottom: 2 },
  deliveryLabelSelected: { color: BrandColors.primary },
  deliveryTime: { fontFamily: FontFamily.semiBold, fontSize: 14, color: BrandColors.textPrimary, marginBottom: 2 },
  deliveryNote: { fontFamily: FontFamily.regular, fontSize: 12, color: BrandColors.textSecondary },
  deliveryNoteSelected: { color: BrandColors.primary },
  // stripe payment row
  stripeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  stripeIconBox: {
    width: 44,
    height: 30,
    backgroundColor: BrandColors.primary,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stripeLabel: { fontFamily: FontFamily.semiBold, fontSize: 15, color: BrandColors.textPrimary },
  stripeNote: { fontFamily: FontFamily.regular, fontSize: 12, color: BrandColors.textSecondary, marginTop: 2 },
  // order summary
  summaryTitle: { fontFamily: FontFamily.extraBold, fontSize: 17, color: BrandColors.textPrimary, marginBottom: Spacing.md },
  orderItem: { flexDirection: 'row', gap: Spacing.md, paddingVertical: Spacing.sm },
  orderItemImage: { width: 56, height: 56, borderRadius: BorderRadius.sm },
  orderItemInfo: { flex: 1 },
  orderItemNameRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  orderItemName: {
    flex: 1,
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: BrandColors.textPrimary,
    marginRight: Spacing.sm,
  },
  orderItemTotal: { fontFamily: FontFamily.bold, fontSize: 14, color: BrandColors.textPrimary },
  orderItemCustom: { fontFamily: FontFamily.regular, fontSize: 12, color: BrandColors.textSecondary, marginBottom: 2 },
  orderItemQty: { fontFamily: FontFamily.regular, fontSize: 12, color: BrandColors.primary },
  itemDivider: { height: 1, backgroundColor: BrandColors.background, marginVertical: 4 },
  summaryDivider: { height: 1, backgroundColor: BrandColors.background, marginVertical: Spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  summaryLabel: { fontFamily: FontFamily.regular, fontSize: 14, color: BrandColors.textSecondary },
  summaryValue: { fontFamily: FontFamily.medium, fontSize: 14, color: BrandColors.textPrimary },
  totalLabel: { fontFamily: FontFamily.extraBold, fontSize: 16, color: BrandColors.textPrimary },
  totalValue: { fontFamily: FontFamily.extraBold, fontSize: 16, color: BrandColors.primary },
  termsText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: BrandColors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  // footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: BrandColors.background,
    borderTopWidth: 1,
    borderTopColor: BrandColors.divider,
  },
  placeOrderBtn: {
    backgroundColor: BrandColors.primary,
    borderRadius: BorderRadius.md,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  placeOrderBtnDisabled: { opacity: 0.7 },
  placeOrderText: { fontFamily: FontFamily.bold, fontSize: 16, color: BrandColors.white },
  placeOrderPrice: { fontFamily: FontFamily.extraBold, fontSize: 16, color: BrandColors.white },
});
