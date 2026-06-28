import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BrandColors, FontFamily, Spacing, BorderRadius } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAddress } from '@/hooks/use-address';
import { useRider } from '@/hooks/use-rider';
import { useCustomerOrders } from '@/hooks/use-customer-orders';
import { insforge } from '@/lib/insforge';

// ─── rider previous orders ────────────────────────────────────────────────────

interface RiderDelivery {
  id: string;
  total: number;
  created_at: string;
  delivery_address: string | null;
  restaurant: { name: string } | null;
}

function useRiderDeliveries() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<RiderDelivery[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await insforge.database
      .from('orders')
      .select('id, total, created_at, delivery_address, restaurant:restaurants(name)')
      .eq('rider_assigned', user.id)
      .eq('order_status', 'delivered')
      .order('created_at', { ascending: false });
    if (data) setDeliveries(data as RiderDelivery[]);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetch(); }, [fetch]);
  return { deliveries, loading };
}

function RiderOrdersScreen() {
  const { address } = useAddress();
  const { isOnline, toggleOnline } = useRider();
  const { deliveries, loading } = useRiderDeliveries();

  const totalEarnings = deliveries.reduce((s, d) => s + Number(d.total), 0);

  return (
    <SafeAreaView style={rSt.safe} edges={['top']}>
      {/* Header */}
      <View style={rSt.header}>
        <TouchableOpacity
          style={rSt.locationBtn}
          onPress={() => router.push('/address-search')}
          activeOpacity={0.7}
        >
          <Ionicons name="location-sharp" size={18} color={BrandColors.primary} />
          <View style={rSt.locationTexts}>
            <Text style={rSt.locationLabel}>Current Location</Text>
            <Text style={rSt.locationValue} numberOfLines={1}>
              {address ?? 'Set your location'}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={16} color={BrandColors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[rSt.onlinePill, !isOnline && rSt.offlinePill]}
          onPress={toggleOnline}
          activeOpacity={0.8}
        >
          <Text style={[rSt.onlinePillText, !isOnline && rSt.offlinePillText]}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={rSt.scroll}>
        <Text style={rSt.pageTitle}>Previous Orders</Text>

        {/* Earnings summary */}
        <View style={rSt.earningsSummary}>
          <View style={rSt.earningsSummaryLeft}>
            <Text style={rSt.earningsSummaryLabel}>Total Earnings</Text>
            <Text style={rSt.earningsSummaryAmount}>${totalEarnings.toFixed(2)}</Text>
          </View>
          <View style={rSt.earningsSummarySep} />
          <View style={rSt.earningsSummaryRight}>
            <Text style={rSt.earningsSummaryLabel}>Deliveries</Text>
            <Text style={rSt.earningsSummaryOrders}>{deliveries.length} Orders</Text>
          </View>
        </View>

        {/* Order history */}
        {loading ? (
          <ActivityIndicator color={BrandColors.primary} style={{ marginTop: Spacing.xl }} />
        ) : deliveries.length === 0 ? (
          <View style={rSt.emptyState}>
            <Ionicons name="bicycle-outline" size={40} color={BrandColors.textMuted} />
            <Text style={rSt.emptyText}>No completed deliveries yet</Text>
          </View>
        ) : (
          <View style={rSt.orderList}>
            {deliveries.map((d) => (
              <View key={d.id} style={rSt.orderCard}>
                <View style={rSt.orderCardTop}>
                  <View style={rSt.orderDateRow}>
                    <Ionicons name="calendar-outline" size={13} color={BrandColors.textSecondary} />
                    <Text style={rSt.orderDate}>{formatDate(d.created_at)}</Text>
                  </View>
                  <View style={rSt.completedBadge}>
                    <Text style={rSt.completedBadgeText}>COMPLETED</Text>
                  </View>
                </View>
                <Text style={rSt.orderRestaurant} numberOfLines={1}>
                  {d.restaurant?.name ?? 'Restaurant'}
                </Text>
                {d.delivery_address ? (
                  <Text style={rSt.orderAddress} numberOfLines={1}>
                    📍 {d.delivery_address}
                  </Text>
                ) : null}
                <View style={rSt.orderCardBottom}>
                  <Text style={rSt.orderId}>ID: #{d.id.slice(-6).toUpperCase()}</Text>
                  <View style={rSt.orderEarned}>
                    <Text style={rSt.orderEarnedLabel}>Earned</Text>
                    <Text style={rSt.orderEarnedAmount}>${Number(d.total).toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  pending: 'Awaiting',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready',
  delivering: 'On the way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

const STATUS_COLOR: Record<string, string> = {
  pending: BrandColors.textSecondary,
  accepted: BrandColors.primary,
  preparing: BrandColors.primary,
  ready: BrandColors.primary,
  delivering: BrandColors.primary,
  delivered: BrandColors.primary,
  cancelled: BrandColors.error,
  rejected: BrandColors.error,
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  if (diff < 172800) return `Yesterday, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ─── customer orders screen ───────────────────────────────────────────────────

function CustomerOrdersScreen() {
  const { orders, loading } = useCustomerOrders();

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Your Orders</Text>
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={BrandColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (orders.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Your Orders</Text>
        </View>
        <View style={styles.center}>
          <Ionicons name="receipt-outline" size={64} color={BrandColors.textMuted} />
          <Text style={styles.placeholderTitle}>No orders yet</Text>
          <Text style={styles.placeholderSub}>Your order history will appear here.</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.replace('/(tabs)')} activeOpacity={0.85}>
            <Text style={styles.browseBtnText}>Browse restaurants</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Your Orders</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.orderList}>
          {orders.map((order) => {
            const statusLabel = STATUS_LABEL[order.order_status] ?? order.order_status;
            const statusColor = STATUS_COLOR[order.order_status] ?? BrandColors.textSecondary;
            const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
            const isActive = !['delivered', 'cancelled', 'rejected'].includes(order.order_status);

            return (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => router.push(`/order/${order.id}`)}
                activeOpacity={0.85}
              >
                {/* Restaurant image */}
                {order.restaurant?.image_url ? (
                  <Image
                    source={{ uri: order.restaurant.image_url }}
                    style={styles.restaurantImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.restaurantImage, styles.restaurantImagePlaceholder]}>
                    <Ionicons name="restaurant" size={24} color={BrandColors.textMuted} />
                  </View>
                )}

                <View style={styles.orderCardBody}>
                  <View style={styles.orderCardTop}>
                    <Text style={styles.restaurantName} numberOfLines={1}>
                      {order.restaurant?.name ?? 'Restaurant'}
                    </Text>
                    {isActive && <View style={styles.activeDot} />}
                  </View>

                  <Text style={styles.orderMeta}>
                    {itemCount} item{itemCount !== 1 ? 's' : ''} · ${Number(order.total).toFixed(2)}
                  </Text>

                  <View style={styles.orderCardBottom}>
                    <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
                      <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusLabel}</Text>
                    </View>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={18} color={BrandColors.textMuted} />
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── entry point ──────────────────────────────────────────────────────────────

export default function OrdersScreen() {
  const { user } = useAuth();
  const userType = (user?.profile?.userType as string) ?? 'customer';

  if (userType === 'rider') return <RiderOrdersScreen />;
  return <CustomerOrdersScreen />;
}

// ─── rider styles (separate to avoid collision with customer styles) ──────────

const rSt = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    flexShrink: 1,
  },
  locationTexts: { flexShrink: 1 },
  locationLabel: { fontFamily: FontFamily.regular, fontSize: 11, color: BrandColors.textSecondary },
  locationValue: { fontFamily: FontFamily.bold, fontSize: 14, color: BrandColors.textPrimary },
  onlinePill: { backgroundColor: BrandColors.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: BorderRadius.full },
  offlinePill: { backgroundColor: BrandColors.divider },
  onlinePillText: { fontFamily: FontFamily.bold, fontSize: 12, color: BrandColors.white, letterSpacing: 0.5 },
  offlinePillText: { color: BrandColors.textSecondary },
  scroll: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  pageTitle: { fontFamily: FontFamily.extraBold, fontSize: 24, color: BrandColors.textPrimary, marginBottom: Spacing.md },
  earningsSummary: {
    backgroundColor: BrandColors.cardBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: BrandColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: Spacing.lg,
  },
  earningsSummaryLeft: { flex: 1 },
  earningsSummarySep: { width: 1, height: 40, backgroundColor: BrandColors.divider, marginHorizontal: Spacing.md },
  earningsSummaryRight: { flex: 1, alignItems: 'flex-end' },
  earningsSummaryLabel: { fontFamily: FontFamily.regular, fontSize: 12, color: BrandColors.textSecondary, marginBottom: 4 },
  earningsSummaryAmount: { fontFamily: FontFamily.extraBold, fontSize: 28, color: BrandColors.textPrimary },
  earningsSummaryOrders: { fontFamily: FontFamily.extraBold, fontSize: 20, color: BrandColors.textPrimary },
  orderList: { gap: Spacing.sm },
  orderCard: {
    backgroundColor: BrandColors.cardBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: BrandColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  orderCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  orderDate: { fontFamily: FontFamily.regular, fontSize: 12, color: BrandColors.textSecondary },
  completedBadge: { backgroundColor: BrandColors.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  completedBadgeText: { fontFamily: FontFamily.bold, fontSize: 10, color: BrandColors.white, letterSpacing: 0.5 },
  orderRestaurant: { fontFamily: FontFamily.bold, fontSize: 16, color: BrandColors.textPrimary, marginBottom: 4 },
  orderAddress: { fontFamily: FontFamily.regular, fontSize: 12, color: BrandColors.textSecondary, marginBottom: Spacing.sm },
  orderCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  orderId: { fontFamily: FontFamily.regular, fontSize: 13, color: BrandColors.textSecondary },
  orderEarned: { alignItems: 'flex-end' },
  orderEarnedLabel: { fontFamily: FontFamily.regular, fontSize: 11, color: BrandColors.textSecondary },
  orderEarnedAmount: { fontFamily: FontFamily.extraBold, fontSize: 18, color: BrandColors.textPrimary },
  emptyState: { paddingVertical: Spacing.xxl, alignItems: 'center', gap: 8 },
  emptyText: { fontFamily: FontFamily.medium, fontSize: 14, color: BrandColors.textSecondary },
});

// ─── customer styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.background },
  scroll: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  // customer orders
  pageHeader: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  pageTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: 26,
    color: BrandColors.textPrimary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: 8,
  },
  placeholderTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: 22,
    color: BrandColors.textPrimary,
    marginTop: Spacing.sm,
  },
  placeholderSub: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: BrandColors.textSecondary,
    textAlign: 'center',
  },
  browseBtn: {
    marginTop: Spacing.md,
    backgroundColor: BrandColors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
  },
  browseBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: BrandColors.white,
  },
  orderList: { gap: Spacing.sm },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.cardBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    shadowColor: BrandColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  restaurantImage: {
    width: 58,
    height: 58,
    borderRadius: BorderRadius.md,
  },
  restaurantImagePlaceholder: {
    backgroundColor: BrandColors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderCardBody: { flex: 1 },
  orderCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  restaurantName: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: BrandColors.textPrimary,
    flex: 1,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BrandColors.primary,
  },
  orderMeta: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: BrandColors.textSecondary,
    marginBottom: 6,
  },
  orderCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderDate: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: BrandColors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  statusBadgeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
  },
});
