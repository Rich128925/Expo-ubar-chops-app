import React, { useState } from 'react';
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
import { router } from 'expo-router';
import { BrandColors, FontFamily, Spacing, BorderRadius } from '@/constants/theme';
import VendorHeader from '@/components/ui/VendorHeader';
import { useRestaurant } from '@/context/RestaurantContext';
import { useDishes } from '@/context/DishesContext';
import { useVendorOrders, VendorOrder } from '@/hooks/use-vendor-orders';

function timeAgo(isoDate: string): string {
  const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function shortId(id: string): string {
  return id.slice(-4).toUpperCase();
}

function OrderCard({ order, onAccept, onReject }: {
  order: VendorOrder;
  onAccept: () => void;
  onReject: () => void;
}) {
  const [acting, setActing] = useState(false);
  const isPending = order.order_status === 'pending';
  const isAccepted = order.order_status === 'accepted' || order.order_status === 'preparing';
  const isRejected = order.order_status === 'rejected';
  const isDelivering = order.order_status === 'delivering';
  const isDelivered = order.order_status === 'delivered';

  async function handleAccept() {
    setActing(true);
    await onAccept();
    setActing(false);
  }

  async function handleReject() {
    Alert.alert(
      'Reject Order',
      `Reject order #${shortId(order.id)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setActing(true);
            await onReject();
            setActing(false);
          },
        },
      ]
    );
  }

  return (
    <View style={[
      styles.card,
      isPending && styles.cardPending,
      isAccepted && styles.cardAccepted,
      isRejected && styles.cardRejected,
      (isDelivering || isDelivered) && styles.cardReady,
    ]}>
      {/* Header row */}
      <View style={styles.cardTop}>
        <View style={styles.cardTopLeft}>
          <Text style={styles.customerName}>Order #{shortId(order.id)}</Text>
          {isPending && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>New</Text>
            </View>
          )}
          {isAccepted && (
            <View style={styles.acceptedBadge}>
              <Text style={styles.acceptedBadgeText}>Accepted</Text>
            </View>
          )}
          {isRejected && (
            <View style={styles.rejectedBadge}>
              <Text style={styles.rejectedBadgeText}>Rejected</Text>
            </View>
          )}
          {isDelivering && (
            <View style={styles.deliveringBadge}>
              <Text style={styles.deliveringBadgeText}>Out for Delivery</Text>
            </View>
          )}
          {isDelivered && (
            <View style={styles.deliveredBadge}>
              <Text style={styles.deliveredBadgeText}>Delivered</Text>
            </View>
          )}
        </View>
        <Text style={styles.orderTotal}>${order.total.toFixed(2)}</Text>
      </View>

      <Text style={styles.orderMeta}>{timeAgo(order.created_at)}</Text>

      {order.delivery_address ? (
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={13} color={BrandColors.textMuted} />
          <Text style={styles.addressText} numberOfLines={1}>{order.delivery_address}</Text>
        </View>
      ) : null}

      <View style={styles.itemsDivider} />

      {order.items.map((item, i) => (
        <View key={i} style={styles.itemRow}>
          <View style={styles.itemAccent} />
          <Text style={styles.itemName}>{item.quantity}× {item.name}</Text>
          <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
        </View>
      ))}

      {/* Action buttons — only shown while pending */}
      {isPending && (
        <View style={styles.cardActions}>
          {acting ? (
            <View style={styles.actingRow}>
              <ActivityIndicator color={BrandColors.primary} />
            </View>
          ) : (
            <>
              <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept} activeOpacity={0.85}>
                <Text style={styles.acceptBtnText}>Accept Order</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectBtn} onPress={handleReject} activeOpacity={0.85}>
                <Text style={styles.rejectBtnText}>Reject</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const STATUS_TABS = [
  { key: 'new', label: 'New' },
  { key: 'inprogress', label: 'In Progress' },
  { key: 'ready', label: 'Ready' },
];

export default function VendorOrdersScreen() {
  const { restaurant, loading: restaurantLoading } = useRestaurant();
  const { dishes } = useDishes();
  const { orders, loading: ordersLoading, refetch, updateOrderStatus } = useVendorOrders();
  const [activeTab, setActiveTab] = useState('new');

  const newOrders = orders.filter((o) => o.order_status === 'pending');
  const inProgressOrders = orders.filter((o) =>
    o.order_status === 'accepted' || o.order_status === 'preparing'
  );
  const readyOrders = orders.filter((o) =>
    o.order_status === 'ready' || o.order_status === 'delivering' || o.order_status === 'delivered'
  );

  const tabCounts: Record<string, number> = {
    new: newOrders.length,
    inprogress: inProgressOrders.length,
    ready: readyOrders.length,
  };

  const tabOrders: Record<string, VendorOrder[]> = {
    new: newOrders,
    inprogress: inProgressOrders,
    ready: readyOrders,
  };

  if (restaurantLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <VendorHeader title="Orders" titleIcon="receipt-outline" showStatusToggle />
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={BrandColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!restaurant) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <VendorHeader title="Orders" titleIcon="receipt-outline" showStatusToggle />
        <View style={styles.emptyState}>
          <Ionicons name="storefront-outline" size={64} color={BrandColors.textMuted} />
          <Text style={styles.emptyTitle}>No restaurant yet</Text>
          <Text style={styles.emptySub}>
            Set up your restaurant to start receiving orders from customers.
          </Text>
          <TouchableOpacity style={styles.setupBtn} onPress={() => router.push('/vendor-setup')} activeOpacity={0.85}>
            <Text style={styles.setupBtnText}>Create your restaurant</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (restaurant.status === 'pending') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <VendorHeader title="Orders" titleIcon="receipt-outline" showStatusToggle />
        <View style={styles.emptyState}>
          <View style={styles.reviewIconWrap}>
            <Ionicons name="time-outline" size={36} color={BrandColors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Under Review</Text>
          <Text style={styles.emptySub}>
            Your restaurant request is in review. We'll notify you once it's been approved.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (restaurant.status === 'rejected') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <VendorHeader title="Orders" titleIcon="receipt-outline" showStatusToggle />
        <View style={styles.emptyState}>
          <View style={[styles.reviewIconWrap, styles.rejectedIconWrap]}>
            <Ionicons name="close-circle-outline" size={36} color={BrandColors.error} />
          </View>
          <Text style={styles.emptyTitle}>Request Rejected</Text>
          <Text style={styles.emptySub}>
            Your restaurant request was not approved. Please contact support for more information.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasMenu = dishes.length > 0;

  if (!hasMenu) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <VendorHeader title="Orders" titleIcon="receipt-outline" showStatusToggle />
        <View style={styles.emptyState}>
          <View style={styles.reviewIconWrap}>
            <Ionicons name="restaurant-outline" size={36} color={BrandColors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Restaurant Approved!</Text>
          <Text style={styles.emptySub}>
            Your restaurant has been approved. Create your menu so customers can start ordering.
          </Text>
          <TouchableOpacity style={styles.setupBtn} onPress={() => router.push('/vendor-add-dish')} activeOpacity={0.85}>
            <Text style={styles.setupBtnText}>Create menu</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const activeOrders = tabOrders[activeTab] ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <VendorHeader title="Orders" titleIcon="receipt-outline" showStatusToggle />

      {/* Status tabs */}
      <View style={styles.tabRow}>
        {STATUS_TABS.map((tab) => {
          const count = tabCounts[tab.key] ?? 0;
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}{count > 0 ? ` (${count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {ordersLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={BrandColors.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          onScrollBeginDrag={refetch}
        >
          {activeOrders.length === 0 ? (
            <View style={styles.emptyTab}>
              <Ionicons
                name={activeTab === 'new' ? 'receipt-outline' : activeTab === 'inprogress' ? 'flame-outline' : 'checkmark-circle-outline'}
                size={40}
                color={BrandColors.textMuted}
              />
              <Text style={styles.emptyTabText}>
                {activeTab === 'new'
                  ? 'No new orders right now'
                  : activeTab === 'inprogress'
                  ? 'No orders in progress'
                  : 'No orders ready for pickup'}
              </Text>
            </View>
          ) : (
            activeOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onAccept={async () => {
                  const { error } = await updateOrderStatus(order.id, 'accepted');
                  if (error) Alert.alert('Error', error.message ?? 'Could not accept order.');
                }}
                onReject={async () => {
                  const { error } = await updateOrderStatus(order.id, 'rejected');
                  if (error) Alert.alert('Error', error.message ?? 'Could not reject order.');
                }}
              />
            ))
          )}

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.background },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: BrandColors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.divider,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: BrandColors.primary },
  tabLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: BrandColors.textMuted,
  },
  tabLabelActive: {
    fontFamily: FontFamily.semiBold,
    color: BrandColors.primary,
  },
  loadingRow: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: { padding: Spacing.md, gap: Spacing.sm },
  // order card
  card: {
    backgroundColor: BrandColors.cardBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: BrandColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cardPending: {
    borderColor: BrandColors.primary + '40',
  },
  cardAccepted: {
    borderColor: BrandColors.primary + '80',
  },
  cardRejected: {
    borderColor: BrandColors.error + '40',
    opacity: 0.7,
  },
  cardReady: {
    borderColor: BrandColors.primary + '60',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  customerName: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    color: BrandColors.textPrimary,
  },
  newBadge: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  newBadgeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    color: BrandColors.white,
  },
  acceptedBadge: {
    backgroundColor: BrandColors.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  acceptedBadgeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    color: BrandColors.primary,
  },
  rejectedBadge: {
    backgroundColor: BrandColors.error + '15',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  rejectedBadgeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    color: BrandColors.error,
  },
  deliveringBadge: {
    backgroundColor: '#2563EB18',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  deliveringBadgeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    color: '#2563EB',
  },
  deliveredBadge: {
    backgroundColor: BrandColors.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  deliveredBadgeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    color: BrandColors.primary,
  },
  orderTotal: {
    fontFamily: FontFamily.extraBold,
    fontSize: 18,
    color: BrandColors.primary,
  },
  orderMeta: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: BrandColors.textSecondary,
    marginBottom: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  addressText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: BrandColors.textMuted,
    flex: 1,
  },
  itemsDivider: {
    height: 1,
    backgroundColor: BrandColors.background,
    marginVertical: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  itemAccent: {
    width: 3,
    height: 18,
    backgroundColor: BrandColors.primary,
    borderRadius: 2,
  },
  itemName: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: BrandColors.textPrimary,
  },
  itemPrice: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: BrandColors.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 14,
  },
  actingRow: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtn: {
    flex: 2,
    backgroundColor: BrandColors.primary,
    borderRadius: BorderRadius.md,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: BrandColors.white,
  },
  rejectBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: BrandColors.error,
    borderRadius: BorderRadius.md,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: BrandColors.error,
  },
  // empty states
  emptyTab: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    gap: 12,
  },
  emptyTabText: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: BrandColors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  reviewIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BrandColors.earningsBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  rejectedIconWrap: {
    backgroundColor: '#FEE2E2',
  },
  emptyTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: 22,
    color: BrandColors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: 8,
  },
  emptySub: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: BrandColors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  setupBtn: {
    backgroundColor: BrandColors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
  },
  setupBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: BrandColors.white,
  },
});
