import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { BrandColors, FontFamily, Spacing, BorderRadius } from '@/constants/theme';
import { useCustomerOrder } from '@/hooks/use-customer-orders';
import { useAddress } from '@/hooks/use-address';
import { insforge } from '@/lib/insforge';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── order status → timeline ──────────────────────────────────────────────────

interface Step {
  icon: 'checkmark-circle' | 'bicycle' | 'location';
  title: string;
  subtitle: string;
  state: 'done' | 'active' | 'pending';
}

function buildTimeline(orderStatus: string): Step[] {
  // Level 0 = pending (waiting for vendor)
  // Level 1 = vendor accepted (accepted / preparing / ready)
  // Level 2 = rider accepted (delivering)
  // Level 3 = delivered
  const level: Record<string, number> = {
    pending:   0,
    accepted:  1,
    preparing: 1,
    ready:     1,
    delivering: 2,
    delivered:  3,
  };
  const l = level[orderStatus] ?? 0;

  return [
    {
      icon: 'checkmark-circle',
      title: 'Order Accepted & Preparing',
      subtitle: 'The restaurant accepted your order and is preparing it.',
      // pending  → pending (gray, not yet happened)
      // accepted → done (green checkmark)
      state: l >= 1 ? 'done' : 'pending',
    },
    {
      icon: 'bicycle',
      title: 'Out for Delivery',
      subtitle: 'Your rider has picked up the order and is on the way.',
      // accepted  → active (next step, awaiting rider)
      // delivering → done
      state: l >= 2 ? 'done' : l === 1 ? 'active' : 'pending',
    },
    {
      icon: 'location',
      title: 'Arrived',
      subtitle: 'Enjoy your Ubar Chops meal!',
      // delivering → active
      // delivered  → done
      state: l >= 3 ? 'done' : l === 2 ? 'active' : 'pending',
    },
  ];
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Awaiting acceptance',
  accepted: 'Order accepted',
  preparing: 'Preparing your order',
  ready: 'Ready for pickup',
  delivering: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Order cancelled',
  rejected: 'Order rejected',
};

// ─── map component ────────────────────────────────────────────────────────────

function OrderMap({
  restaurantLat,
  restaurantLng,
  customerLat,
  customerLng,
}: {
  restaurantLat: number;
  restaurantLng: number;
  customerLat: number | null;
  customerLng: number | null;
}) {
  const hasCustomer = customerLat != null && customerLng != null;

  const midLat = hasCustomer ? (restaurantLat + customerLat!) / 2 : restaurantLat;
  const midLng = hasCustomer ? (restaurantLng + customerLng!) / 2 : restaurantLng;

  const latDelta = hasCustomer ? Math.abs(restaurantLat - customerLat!) * 2.5 + 0.02 : 0.04;
  const lngDelta = hasCustomer ? Math.abs(restaurantLng - customerLng!) * 2.5 + 0.02 : 0.04;

  return (
    <MapView
      style={styles.map}
      provider={PROVIDER_DEFAULT}
      initialRegion={{ latitude: midLat, longitude: midLng, latitudeDelta: latDelta, longitudeDelta: lngDelta }}
      scrollEnabled={false}
      zoomEnabled={false}
    >
      {/* Restaurant pin */}
      <Marker coordinate={{ latitude: restaurantLat, longitude: restaurantLng }} title="Restaurant">
        <View style={styles.restaurantPin}>
          <Ionicons name="restaurant" size={14} color={BrandColors.white} />
        </View>
      </Marker>

      {/* Customer / delivery pin */}
      {hasCustomer && (
        <>
          <Marker coordinate={{ latitude: customerLat!, longitude: customerLng! }} title="Delivery">
            <View style={styles.homePin}>
              <Ionicons name="home" size={14} color={BrandColors.white} />
            </View>
          </Marker>
          <Polyline
            coordinates={[
              { latitude: restaurantLat, longitude: restaurantLng },
              { latitude: customerLat!, longitude: customerLng! },
            ]}
            strokeColor={BrandColors.primary}
            strokeWidth={3}
            lineDashPattern={[8, 4]}
          />
        </>
      )}
    </MapView>
  );
}

// ─── main screen ──────────────────────────────────────────────────────────────

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { order: fetchedOrder, loading } = useCustomerOrder(id);
  const { addressCoords } = useAddress();

  // Allow realtime updates to override the fetched order_status.
  const [liveStatus, setLiveStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const channel = `order:${id}`;

    (async () => {
      try {
        await insforge.realtime.connect();
        const res = await insforge.realtime.subscribe(channel);
        if (!res.ok || !mounted) return;
        insforge.realtime.on('order_status_changed', (payload: { order_status: string }) => {
          if (mounted) setLiveStatus(payload.order_status);
        });
      } catch {
        // realtime unavailable — fall back to polled data
      }
    })();

    return () => {
      mounted = false;
      try { insforge.realtime.unsubscribe(channel); } catch { /* ignore */ }
    };
  }, [id]);

  // Merge live status into order object so the rest of the screen just uses `order`.
  const order = fetchedOrder
    ? { ...fetchedOrder, order_status: liveStatus ?? fetchedOrder.order_status }
    : fetchedOrder;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={BrandColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={BrandColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={BrandColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.loadingCenter}>
          <Text style={styles.errorText}>Order not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isCancelledOrRejected = order.order_status === 'cancelled' || order.order_status === 'rejected';
  const isDelivered = order.order_status === 'delivered';
  const steps = isCancelledOrRejected ? [] : buildTimeline(order.order_status);
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
  const hasRestaurantCoords = order.restaurant?.latitude != null && order.restaurant?.longitude != null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={BrandColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{order.restaurant?.name ?? 'Order Details'}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Map */}
        {hasRestaurantCoords ? (
          <View style={styles.mapContainer}>
            <OrderMap
              restaurantLat={order.restaurant!.latitude!}
              restaurantLng={order.restaurant!.longitude!}
              customerLat={addressCoords?.latitude ?? null}
              customerLng={addressCoords?.longitude ?? null}
            />
            {/* Arrival badge */}
            <View style={styles.arrivalBadge}>
              <Ionicons name="time-outline" size={15} color={BrandColors.textPrimary} />
              <Text style={styles.arrivalText}>
                {order.order_status === 'delivered'
                  ? 'Order delivered'
                  : order.order_status === 'delivering'
                  ? 'Arrival in 8–10 mins'
                  : STATUS_LABEL[order.order_status] ?? order.order_status}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.mapFallback}>
            <Ionicons name="map-outline" size={32} color={BrandColors.textMuted} />
            <Text style={styles.mapFallbackText}>Map not available</Text>
          </View>
        )}

        <View style={styles.content}>
          {/* Delivered success banner */}
          {isDelivered && (
            <View style={styles.deliveredBanner}>
              <Ionicons name="checkmark-circle" size={20} color={BrandColors.primary} />
              <Text style={styles.deliveredText}>Order delivered! Enjoy your meal.</Text>
            </View>
          )}

          {/* Cancelled / rejected banner */}
          {isCancelledOrRejected && (
            <View style={styles.cancelledBanner}>
              <Ionicons name="close-circle" size={20} color={BrandColors.error} />
              <Text style={styles.cancelledText}>
                {order.order_status === 'rejected'
                  ? 'The restaurant rejected this order.'
                  : 'This order was cancelled.'}
              </Text>
            </View>
          )}

          {/* Order status timeline */}
          {steps.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Order Status</Text>
              <View style={styles.timeline}>
                {steps.map((step, index) => {
                  const isDone = step.state === 'done';
                  const isActive = step.state === 'active';
                  const isPending = step.state === 'pending';
                  return (
                    <View key={index} style={styles.timelineRow}>
                      <View style={styles.timelineLeft}>
                        <View style={[
                          styles.timelineIcon,
                          isDone && styles.timelineIconDone,
                          isActive && styles.timelineIconActive,
                          isPending && styles.timelineIconPending,
                        ]}>
                          <Ionicons
                            name={step.icon}
                            size={18}
                            color={isPending ? BrandColors.textMuted : BrandColors.white}
                          />
                        </View>
                        {index < steps.length - 1 && (
                          <View style={[styles.connector, isDone && styles.connectorDone]} />
                        )}
                      </View>
                      <View style={styles.timelineContent}>
                        <Text style={[
                          styles.stepTitle,
                          isActive && styles.stepTitleActive,
                          isPending && styles.stepTitlePending,
                        ]}>
                          {step.title}
                        </Text>
                        <Text style={[styles.stepSubtitle, isPending && styles.stepSubtitlePending]}>
                          {step.subtitle}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* Rider card (dummy) */}
          {!isCancelledOrRejected && (
            <View style={styles.riderCard}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80' }}
                style={styles.riderAvatar}
                contentFit="cover"
              />
              <View style={styles.riderInfo}>
                <Text style={styles.riderName}>Marcus Sterling</Text>
                <View style={styles.riderMeta}>
                  <Ionicons name="star" size={13} color={BrandColors.primary} />
                  <Text style={styles.riderMetaText}>4.9 · 2.4k orders · Pedal Bike</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.contactBtn} activeOpacity={0.8}>
                <Text style={styles.contactBtnText}>Contact</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Order info */}
          <Text style={styles.sectionTitle}>Order Info</Text>
          <View style={styles.infoCard}>
            {/* Items */}
            {order.items.map((item, i) => (
              <View key={i} style={styles.itemRow}>
                <View style={styles.itemQtyBadge}>
                  <Text style={styles.itemQtyText}>{item.quantity}×</Text>
                </View>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
              </View>
            ))}

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${Number(order.subtotal).toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>
                {Number(order.delivery_fee) === 0 ? 'Free' : `$${Number(order.delivery_fee).toFixed(2)}`}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service Fee</Text>
              <Text style={styles.summaryValue}>${Number(order.service_fee).toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryRow, { marginTop: Spacing.sm }]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${Number(order.total).toFixed(2)}</Text>
            </View>

            {order.delivery_address && (
              <>
                <View style={styles.summaryDivider} />
                <View style={styles.addressRow}>
                  <Ionicons name="location-outline" size={14} color={BrandColors.textMuted} />
                  <Text style={styles.addressText}>{order.delivery_address}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
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
  backBtn: { padding: Spacing.sm, marginLeft: -Spacing.sm, width: 38 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FontFamily.extraBold,
    fontSize: 18,
    color: BrandColors.primary,
  },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontFamily: FontFamily.regular, fontSize: 14, color: BrandColors.textSecondary },
  // map
  mapContainer: { height: 240, position: 'relative' },
  map: { flex: 1 },
  mapFallback: {
    height: 120,
    backgroundColor: '#E8EDF2',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  mapFallbackText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: BrandColors.textMuted,
  },
  restaurantPin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: BrandColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: BrandColors.white,
  },
  homePin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: BrandColors.white,
  },
  arrivalBadge: {
    position: 'absolute',
    bottom: Spacing.md,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BrandColors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  arrivalText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: BrandColors.textPrimary,
  },
  // content
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.lg },
  deliveredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BrandColors.primary + '15',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  deliveredText: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: BrandColors.primary,
    flex: 1,
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BrandColors.error + '15',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  cancelledText: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: BrandColors.error,
    flex: 1,
  },
  sectionTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: 20,
    color: BrandColors.textPrimary,
    marginBottom: Spacing.lg,
  },
  // timeline
  timeline: { marginBottom: Spacing.xl },
  timelineRow: { flexDirection: 'row', gap: Spacing.md },
  timelineLeft: { alignItems: 'center' },
  timelineIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineIconDone: { backgroundColor: BrandColors.primary },
  timelineIconActive: { backgroundColor: BrandColors.primary },
  timelineIconPending: {
    backgroundColor: BrandColors.background,
    borderWidth: 2,
    borderColor: BrandColors.divider,
  },
  connector: {
    width: 2,
    flex: 1,
    minHeight: 24,
    backgroundColor: BrandColors.divider,
    marginBottom: 4,
  },
  connectorDone: { backgroundColor: BrandColors.primary },
  timelineContent: { flex: 1, paddingBottom: Spacing.lg },
  stepTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: BrandColors.textPrimary,
    marginBottom: 2,
  },
  stepTitleActive: { color: BrandColors.primary },
  stepTitlePending: { color: BrandColors.textMuted },
  stepSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: BrandColors.textSecondary,
  },
  stepSubtitlePending: { color: BrandColors.textMuted },
  // rider card
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.cardBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  riderAvatar: { width: 50, height: 50, borderRadius: 25 },
  riderInfo: { flex: 1 },
  riderName: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: BrandColors.textPrimary,
    marginBottom: 3,
  },
  riderMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  riderMetaText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: BrandColors.textSecondary,
  },
  contactBtn: {
    backgroundColor: BrandColors.black,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  contactBtnText: { fontFamily: FontFamily.bold, fontSize: 13, color: BrandColors.white },
  // order info card
  infoCard: {
    backgroundColor: BrandColors.cardBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 10,
  },
  itemQtyBadge: {
    minWidth: 28,
    height: 22,
    borderRadius: 11,
    backgroundColor: BrandColors.primary + '18',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  itemQtyText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: BrandColors.primary,
  },
  itemName: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: BrandColors.textPrimary,
  },
  itemPrice: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: BrandColors.textPrimary,
  },
  summaryDivider: { height: 1, backgroundColor: BrandColors.background, marginVertical: Spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryLabel: { fontFamily: FontFamily.regular, fontSize: 14, color: BrandColors.textSecondary },
  summaryValue: { fontFamily: FontFamily.medium, fontSize: 14, color: BrandColors.textPrimary },
  totalLabel: { fontFamily: FontFamily.extraBold, fontSize: 16, color: BrandColors.textPrimary },
  totalValue: { fontFamily: FontFamily.extraBold, fontSize: 16, color: BrandColors.primary },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 4 },
  addressText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: BrandColors.textMuted,
    lineHeight: 18,
  },
});
