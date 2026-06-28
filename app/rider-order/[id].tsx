import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { BrandColors, FontFamily, Spacing, BorderRadius } from '@/constants/theme';
import { insforge } from '@/lib/insforge';
import { useRider } from '@/hooks/use-rider';
import { AvailableOrder } from '@/hooks/use-available-orders';

export default function RiderOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isOnline } = useRider();

  const [order, setOrder] = useState<AvailableOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [delivered, setDelivered] = useState(false);

  useEffect(() => {
    if (!id) return;
    insforge.database
      .from('orders')
      .select('*, restaurant:restaurants(name, address, latitude, longitude, image_url)')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setOrder(data as AvailableOrder);
        setLoading(false);
      });
  }, [id]);

  async function handleDelivered() {
    if (!id || completing || delivered) return;
    setCompleting(true);
    const { data, error } = await insforge.database.rpc('complete_delivery', { p_order_id: id });
    if (error || !data) {
      Alert.alert('Error', 'Could not mark order as delivered. Please try again.');
      setCompleting(false);
      return;
    }
    setDelivered(true);
    setCompleting(false);
    setTimeout(() => router.replace('/(tabs)'), 800);
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.headerSafe} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={22} color={BrandColors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Loading…</Text>
            <View style={{ width: 60 }} />
          </View>
        </SafeAreaView>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={BrandColors.primary} />
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.headerSafe} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={22} color={BrandColors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Order not found</Text>
            <View style={{ width: 60 }} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
  const shortId = order.id.slice(-6).toUpperCase();

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView style={styles.headerSafe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={BrandColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order #{shortId}</Text>
          <View style={[styles.onlinePill, !isOnline && styles.offlinePill]}>
            <Text style={[styles.onlinePillText, !isOnline && styles.offlinePillText]}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Map placeholder */}
        <View style={styles.mapContainer}>
          <View style={styles.mapBg}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View key={`h${i}`} style={[styles.mapGridH, { top: `${i * 25}%` }]} />
            ))}
            {[0, 1, 2, 3, 4].map((i) => (
              <View key={`v${i}`} style={[styles.mapGridV, { left: `${i * 25}%` }]} />
            ))}
          </View>
          <TouchableOpacity style={styles.mapRecenterBtn} activeOpacity={0.7}>
            <Ionicons name="locate" size={20} color={BrandColors.primary} />
          </TouchableOpacity>
        </View>

        {/* Status */}
        <View style={styles.statusSection}>
          <View style={styles.pullRow}>
            <View style={styles.pullPill} />
          </View>
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <Text style={styles.statusTitle}>Picking up order</Text>
              <Text style={styles.statusSub}>
                {order.order_status === 'delivering' ? 'Out for delivery' : 'Head to restaurant'}
              </Text>
            </View>
            <View style={styles.earnBadge}>
              <Text style={styles.earnBadgeText}>${Number(order.total).toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Pickup card */}
        <View style={styles.cardsSection}>
          <View style={styles.locationCard}>
            <View style={[styles.locationIconBox, styles.pickupIconBox]}>
              <Ionicons name="restaurant" size={20} color={BrandColors.white} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationTypeLabel}>PICKUP</Text>
              <Text style={styles.locationName}>{order.restaurant?.name ?? 'Restaurant'}</Text>
              <Text style={styles.locationAddress}>{order.restaurant?.address ?? '—'}</Text>
              <TouchableOpacity style={styles.contactAction} activeOpacity={0.7}>
                <Ionicons name="call-outline" size={14} color={BrandColors.primary} />
                <Text style={styles.contactText}>Contact Merchant</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Drop-off card */}
          <View style={styles.locationCard}>
            <View style={[styles.locationIconBox, styles.dropoffIconBox]}>
              <Ionicons name="home" size={20} color={BrandColors.white} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationTypeLabel}>DROP-OFF</Text>
              <Text style={styles.locationName}>Customer</Text>
              <Text style={styles.locationAddress}>{order.delivery_address ?? 'No address provided'}</Text>
              <View style={styles.contactRow}>
                <TouchableOpacity style={styles.contactAction} activeOpacity={0.7}>
                  <Ionicons name="chatbubble-outline" size={14} color={BrandColors.primary} />
                  <Text style={styles.contactText}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.contactAction} activeOpacity={0.7}>
                  <Ionicons name="call-outline" size={14} color={BrandColors.primary} />
                  <Text style={styles.contactText}>Call</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Order details */}
        <View style={styles.orderSection}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderHeaderTitle}>ORDER DETAILS ({itemCount} ITEMS)</Text>
          </View>
          {order.items.map((item, index) => (
            <View key={index}>
              <View style={styles.orderItem}>
                <Text style={styles.orderItemName}>{item.quantity}× {item.name}</Text>
                <Text style={styles.orderItemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
              </View>
              {index < order.items.length - 1 && <View style={styles.itemDivider} />}
            </View>
          ))}
          <View style={styles.orderTotalRow}>
            <Text style={styles.orderTotalLabel}>Total</Text>
            <Text style={styles.orderTotalValue}>${Number(order.total).toFixed(2)}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Confirm Delivery button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.deliverBtn, (completing || delivered) && styles.deliverBtnDisabled]}
          onPress={handleDelivered}
          activeOpacity={0.85}
          disabled={completing || delivered}
        >
          {completing ? (
            <ActivityIndicator color={BrandColors.white} />
          ) : (
            <>
              <Ionicons
                name={delivered ? 'checkmark-circle' : 'checkmark-done'}
                size={20}
                color={BrandColors.white}
              />
              <Text style={styles.deliverBtnText}>
                {delivered ? 'Delivered!' : 'Mark as Delivered'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background },
  headerSafe: {
    backgroundColor: BrandColors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.divider,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: { padding: Spacing.sm, marginLeft: -Spacing.sm },
  headerTitle: {
    flex: 1,
    fontFamily: FontFamily.extraBold,
    fontSize: 18,
    color: BrandColors.primary,
    marginLeft: 4,
  },
  onlinePill: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  offlinePill: { backgroundColor: BrandColors.divider },
  onlinePillText: { fontFamily: FontFamily.bold, fontSize: 11, color: BrandColors.white, letterSpacing: 0.5 },
  offlinePillText: { color: BrandColors.textSecondary },
  mapContainer: { height: 140, position: 'relative' },
  mapBg: { flex: 1, backgroundColor: '#D8E4EC', overflow: 'hidden' },
  mapGridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#C0CDD8' },
  mapGridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: '#C0CDD8' },
  mapRecenterBtn: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BrandColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BrandColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  statusSection: { backgroundColor: BrandColors.cardBg },
  pullRow: { alignItems: 'center', paddingTop: Spacing.sm },
  pullPill: { width: 40, height: 4, borderRadius: 2, backgroundColor: BrandColors.divider },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  statusLeft: { flex: 1 },
  statusTitle: { fontFamily: FontFamily.extraBold, fontSize: 20, color: BrandColors.textPrimary, marginBottom: 4 },
  statusSub: { fontFamily: FontFamily.regular, fontSize: 14, color: BrandColors.textSecondary },
  earnBadge: {
    backgroundColor: BrandColors.riderBlue ?? BrandColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  earnBadgeText: { fontFamily: FontFamily.bold, fontSize: 14, color: BrandColors.white },
  cardsSection: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, gap: Spacing.sm },
  locationCard: {
    backgroundColor: BrandColors.cardBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.md,
    shadowColor: BrandColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  locationIconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  pickupIconBox: { backgroundColor: BrandColors.textPrimary },
  dropoffIconBox: { backgroundColor: BrandColors.primary },
  locationInfo: { flex: 1 },
  locationTypeLabel: { fontFamily: FontFamily.semiBold, fontSize: 11, color: BrandColors.textMuted, letterSpacing: 0.8, marginBottom: 4 },
  locationName: { fontFamily: FontFamily.bold, fontSize: 16, color: BrandColors.textPrimary, marginBottom: 4 },
  locationAddress: { fontFamily: FontFamily.regular, fontSize: 13, color: BrandColors.textSecondary, marginBottom: 8, lineHeight: 18 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  contactAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  contactText: { fontFamily: FontFamily.semiBold, fontSize: 13, color: BrandColors.primary },
  orderSection: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    backgroundColor: BrandColors.cardBg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: BrandColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.background,
  },
  orderHeaderTitle: { fontFamily: FontFamily.semiBold, fontSize: 12, color: BrandColors.textSecondary, letterSpacing: 0.5 },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  orderItemName: { fontFamily: FontFamily.medium, fontSize: 14, color: BrandColors.textPrimary, flex: 1 },
  orderItemPrice: { fontFamily: FontFamily.semiBold, fontSize: 14, color: BrandColors.textPrimary },
  itemDivider: { height: 1, backgroundColor: BrandColors.background, marginHorizontal: Spacing.md },
  orderTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: BrandColors.background,
  },
  orderTotalLabel: { fontFamily: FontFamily.bold, fontSize: 15, color: BrandColors.textPrimary },
  orderTotalValue: { fontFamily: FontFamily.extraBold, fontSize: 15, color: BrandColors.primary },
  footer: {
    backgroundColor: BrandColors.background,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: BrandColors.divider,
  },
  deliverBtn: {
    height: 56,
    borderRadius: BorderRadius.xl,
    backgroundColor: BrandColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deliverBtnDisabled: { opacity: 0.6 },
  deliverBtnText: { fontFamily: FontFamily.bold, fontSize: 16, color: BrandColors.white },
});
