import {
  BorderRadius,
  BrandColors,
  FontFamily,
  Spacing,
} from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useAddress } from "@/hooks/use-address";
import { useRider } from "@/hooks/use-rider";
import { useAvailableOrders, AvailableOrder } from "@/hooks/use-available-orders";
import { useRestaurants } from "@/hooks/use-restaurants";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BurgerIcon from "@/assets/myimages/burger.svg";
import IceCreamIcon from "@/assets/myimages/icecream.svg";
import PizzaIcon from "@/assets/myimages/pizza.svg";
import SushiIcon from "@/assets/myimages/sushi.svg";

// ─── mock data ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "1", label: "Burgers", Icon: BurgerIcon },
  { id: "2", label: "Pizza", Icon: PizzaIcon },
  { id: "3", label: "Sushi", Icon: SushiIcon },
  { id: "4", label: "Desserts", Icon: IceCreamIcon },
];

const DEALS = [
  {
    id: "1",
    name: "The Burger Collective",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80",
    discount: "50% OFF",
    rating: "4.8",
    reviews: "500+",
    time: "15-25 min",
  },
  {
    id: "2",
    name: "Zen Ramen",
    image:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&q=80",
    discount: "20% OFF",
    rating: "4.6",
    reviews: "300+",
    time: "20-35 min",
  },
  {
    id: "3",
    name: "Taco Libre",
    image:
      "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&q=80",
    discount: "15% OFF",
    rating: "4.5",
    reviews: "200+",
    time: "10-20 min",
  },
];

const STORE_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80";

// ─── rider order card ─────────────────────────────────────────────────────────

function RiderOrderCard({ order, onAccept }: { order: AvailableOrder; onAccept: () => void }) {
  const [acting, setActing] = useState(false);
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

  async function handleAccept() {
    setActing(true);
    await onAccept();
    setActing(false);
  }

  return (
    <View style={riderSt.orderCard}>
      <View style={riderSt.orderCardTop}>
        <Text style={riderSt.orderRestaurant} numberOfLines={1}>
          {order.restaurant?.name ?? 'Restaurant'}
        </Text>
        <View style={riderSt.earningsBadge}>
          <Text style={riderSt.earningsBadgeText}>${Number(order.total).toFixed(2)}</Text>
        </View>
      </View>
      <Text style={riderSt.orderMeta}>
        Order #{order.id.slice(-6).toUpperCase()}
      </Text>
      {order.restaurant?.address ? (
        <Text style={riderSt.orderPickup} numberOfLines={1}>
          📍 {order.restaurant.address}
        </Text>
      ) : null}
      <View style={riderSt.orderStats}>
        <View style={riderSt.orderStatItem}>
          <Ionicons name="restaurant-outline" size={13} color={BrandColors.textSecondary} />
          <Text style={riderSt.orderStatText}>{itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
        </View>
        {order.delivery_address ? (
          <>
            <View style={riderSt.orderStatDot} />
            <View style={riderSt.orderStatItem}>
              <Ionicons name="location-outline" size={13} color={BrandColors.textSecondary} />
              <Text style={riderSt.orderStatText} numberOfLines={1}>
                {order.delivery_address.split(',')[0]}
              </Text>
            </View>
          </>
        ) : null}
      </View>
      <View style={riderSt.orderActions}>
        <TouchableOpacity
          style={[riderSt.acceptBtn, acting && { opacity: 0.6 }]}
          onPress={handleAccept}
          activeOpacity={0.85}
          disabled={acting}
        >
          {acting
            ? <ActivityIndicator color={BrandColors.white} />
            : <Text style={riderSt.acceptBtnText}>Accept Order</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={riderSt.rejectBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={20} color={BrandColors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── rider home ───────────────────────────────────────────────────────────────

function RiderHomeScreen() {
  const { address } = useAddress();
  const { isOnline, toggleOnline, pushLocation } = useRider();
  const { available, activeOrder, loading, acceptOrder } = useAvailableOrders(isOnline);

  async function handleAccept(order: AvailableOrder) {
    const { error } = await acceptOrder(order.id);
    if (error) Alert.alert('Order Unavailable', error);
    else router.push(`/rider-order/${order.id}`);
  }

  return (
    <SafeAreaView style={riderSt.safe} edges={["top"]}>
      {/* Header */}
      <View style={riderSt.header}>
        <TouchableOpacity
          style={riderSt.locationBtn}
          onPress={() => router.push("/address-search")}
          activeOpacity={0.7}
        >
          <Ionicons name="location-sharp" size={18} color={BrandColors.primary} />
          <View style={riderSt.locationTexts}>
            <Text style={riderSt.locationLabel}>Current Location</Text>
            <Text style={riderSt.locationValue} numberOfLines={1}>
              {address ?? "Set your location"}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={16} color={BrandColors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={riderSt.bellBtn} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={22} color={BrandColors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[riderSt.onlinePill, !isOnline && riderSt.offlinePill]}
          onPress={toggleOnline}
          activeOpacity={0.8}
        >
          <Text style={[riderSt.onlinePillText, !isOnline && riderSt.offlinePillText]}>
            {isOnline ? "ONLINE" : "OFFLINE"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Map placeholder */}
        <View style={riderSt.mapContainer}>
          <View style={riderSt.mapBg}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <View key={`h${i}`} style={[riderSt.mapGridH, { top: `${i * 20}%` }]} />
            ))}
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <View key={`v${i}`} style={[riderSt.mapGridV, { left: `${i * 20}%` }]} />
            ))}
          </View>
          <View style={riderSt.mapLocationOverlay}>
            <Text style={riderSt.mapLocationLabel}>Current Location</Text>
            <Text style={riderSt.mapLocationValue} numberOfLines={1}>
              {address ?? "Set your location"}
            </Text>
          </View>
          <TouchableOpacity style={riderSt.mapRecenterBtn} onPress={pushLocation} activeOpacity={0.7}>
            <Ionicons name="locate" size={20} color={BrandColors.primary} />
          </TouchableOpacity>
        </View>

        {/* Active delivery banner */}
        {activeOrder && (
          <TouchableOpacity
            style={riderSt.activeOrderBanner}
            onPress={() => router.push(`/rider-order/${activeOrder.id}`)}
            activeOpacity={0.85}
          >
            <View style={riderSt.activeOrderIcon}>
              <Ionicons name="bicycle" size={20} color={BrandColors.white} />
            </View>
            <View style={riderSt.activeOrderText}>
              <Text style={riderSt.activeOrderTitle}>Active Delivery</Text>
              <Text style={riderSt.activeOrderSub} numberOfLines={1}>
                {activeOrder.restaurant?.name ?? 'Restaurant'} → {activeOrder.delivery_address?.split(',')[0] ?? 'Drop-off'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={BrandColors.white} />
          </TouchableOpacity>
        )}

        {/* Offline state */}
        {!isOnline && (
          <View style={riderSt.offlineState}>
            <Ionicons name="power-outline" size={40} color={BrandColors.textMuted} />
            <Text style={riderSt.offlineStateTitle}>You're Offline</Text>
            <Text style={riderSt.offlineStateSub}>Go online to see available orders.</Text>
            <TouchableOpacity style={riderSt.goOnlineBtn} onPress={toggleOnline} activeOpacity={0.85}>
              <Text style={riderSt.goOnlineBtnText}>Go Online</Text>
            </TouchableOpacity>
          </View>
        )}

        {isOnline && (
          <>
            {/* Section header */}
            <View style={riderSt.sectionHeader}>
              <Text style={riderSt.sectionTitle}>Available Orders</Text>
              {loading ? (
                <ActivityIndicator size="small" color={BrandColors.primary} />
              ) : (
                <View style={riderSt.nearbyPill}>
                  <Text style={riderSt.nearbyText}>{available.length} Available</Text>
                </View>
              )}
            </View>

            {/* Order cards */}
            <View style={riderSt.ordersList}>
              {!loading && available.length === 0 && (
                <View style={riderSt.noOrdersState}>
                  <Ionicons name="receipt-outline" size={36} color={BrandColors.textMuted} />
                  <Text style={riderSt.noOrdersText}>No available orders right now</Text>
                  <Text style={riderSt.noOrdersSub}>New orders will appear here in real-time.</Text>
                </View>
              )}
              {available.map((order) => (
                <RiderOrderCard
                  key={order.id}
                  order={order}
                  onAccept={() => handleAccept(order)}
                />
              ))}
            </View>
          </>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── vendor/fallback placeholder ──────────────────────────────────────────────

function RolePlaceholder({ role }: { role: string }) {
  const { signOut } = useAuth();
  const label = role === "vendor" ? "Vendor" : "Rider";
  const icon: React.ComponentProps<typeof Ionicons>["name"] =
    role === "vendor" ? "storefront-outline" : "bicycle-outline";
  const color = role === "vendor" ? "#D97706" : "#2563EB";

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: BrandColors.background }}
      edges={["top", "bottom"]}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.sm,
        }}
      >
        <Text
          style={{
            fontFamily: FontFamily.extraBold,
            fontSize: 22,
            color: BrandColors.primary,
          }}
        >
          Ubar Chops
        </Text>
        <TouchableOpacity onPress={handleSignOut} activeOpacity={0.7}>
          <Ionicons
            name="log-out-outline"
            size={22}
            color={BrandColors.textSecondary}
          />
        </TouchableOpacity>
      </View>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: Spacing.md,
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: color + "18",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: Spacing.lg,
          }}
        >
          <Ionicons name={icon} size={40} color={color} />
        </View>
        <Text
          style={{
            fontFamily: FontFamily.extraBold,
            fontSize: 26,
            color: BrandColors.textPrimary,
            marginBottom: Spacing.sm,
          }}
        >
          {label} Dashboard
        </Text>
        <View
          style={{
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.xs,
            borderRadius: BorderRadius.full,
            backgroundColor: color + "18",
            borderWidth: 1,
            borderColor: color + "40",
          }}
        >
          <Text style={{ fontFamily: FontFamily.bold, fontSize: 15, color }}>
            {label}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { user } = useAuth();
  const { address, loading: addressLoading } = useAddress();
  const { itemCount } = useCart();
  const { restaurants, loading: storesLoading } = useRestaurants();
  const userType = (user?.profile?.userType as string) ?? "customer";

  // Redirect first-time customers to location setup; redirect vendors to their tab
  useEffect(() => {
    if (userType === "vendor") {
      router.replace("/(tabs)/vendor-orders");
      return;
    }
    if (userType !== "customer" || addressLoading) return;
    if (address === null) {
      router.replace("/location-setup");
    }
  }, [userType, address, addressLoading]);

  if (userType === "rider") return <RiderHomeScreen />;
  if (userType === "vendor") return null;
  if (userType !== "customer") return <RolePlaceholder role={userType} />;

  // Show nothing while checking address (avoid flash before redirect)
  if (addressLoading || address === null) return null;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* ── Top bar (outside ScrollView so flex row is never broken by sticky wrapper) ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.addressRow}
          onPress={() => router.push("/address-search")}
          activeOpacity={0.7}
        >
          <Ionicons
            name="location-sharp"
            size={18}
            color={BrandColors.primary}
          />
          <View style={styles.addressTexts}>
            <Text style={styles.addressLabel}>Deliver to</Text>
            <Text style={styles.addressValue} numberOfLines={1}>
              {address}
            </Text>
          </View>
          <Ionicons
            name="chevron-down"
            size={16}
            color={BrandColors.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cartBtn}
          onPress={() => router.push("/cart")}
          activeOpacity={0.7}
        >
          <Ionicons
            name="basket-outline"
            size={24}
            color={BrandColors.primary}
          />
          {itemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {itemCount > 9 ? "9+" : itemCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Search bar ── */}
        <TouchableOpacity style={styles.searchBar} activeOpacity={0.8}>
          <Ionicons
            name="search-outline"
            size={18}
            color={BrandColors.textMuted}
            style={styles.searchIcon}
          />
          <Text style={styles.searchPlaceholder}>
            Search for food or restaurants
          </Text>
        </TouchableOpacity>

        {/* ── Categories ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {CATEGORIES.map(({ id, label, Icon }) => (
            <TouchableOpacity
              key={id}
              style={styles.categoryItem}
              activeOpacity={0.7}
            >
              <View style={styles.categoryCircle}>
                <Icon width={26} height={26} />
              </View>
              <Text style={styles.categoryLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Deals Near You ── */}
        <Text style={[styles.sectionTitle, styles.sectionPad]}>
          Deals Near You
        </Text>
        <FlatList
          data={DEALS}
          keyExtractor={(d) => d.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dealsScroll}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.dealCard} activeOpacity={0.85}>
              <Image
                source={{ uri: item.image }}
                style={styles.dealImage}
                contentFit="cover"
              />
              <View style={styles.dealBadge}>
                <Text style={styles.dealBadgeText}>{item.discount}</Text>
              </View>
              <View style={styles.dealInfo}>
                <Text style={styles.dealName} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.dealMeta}>
                  <Ionicons name="star" size={12} color={BrandColors.primary} />
                  <Text style={styles.dealMetaText}>
                    {item.rating} ({item.reviews})
                  </Text>
                  <Text style={styles.dealDot}>·</Text>
                  <Text style={styles.dealMetaText}>{item.time}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />

        {/* ── All Stores ── */}
        <Text style={[styles.sectionTitle, styles.sectionPad]}>All Stores</Text>
        {storesLoading ? (
          <ActivityIndicator
            color={BrandColors.primary}
            style={{ marginVertical: Spacing.xl }}
          />
        ) : restaurants.length === 0 ? (
          <View style={[styles.storesList, { alignItems: "center", paddingVertical: Spacing.xl }]}>
            <Ionicons name="storefront-outline" size={40} color={BrandColors.textMuted} />
            <Text style={styles.emptyStoresText}>No restaurants available yet</Text>
          </View>
        ) : (
          <View style={styles.storesList}>
            {restaurants.map((restaurant) => (
              <TouchableOpacity
                key={restaurant.id}
                style={styles.storeCard}
                onPress={() => router.push(`/restaurant/${restaurant.id}`)}
                activeOpacity={0.85}
              >
                <Image
                  source={{ uri: restaurant.image_url ?? STORE_IMAGE_FALLBACK }}
                  style={styles.storeImage}
                  contentFit="cover"
                />
                <TouchableOpacity style={styles.favouriteBtn} activeOpacity={0.7}>
                  <Ionicons
                    name="heart-outline"
                    size={18}
                    color={BrandColors.textSecondary}
                  />
                </TouchableOpacity>
                <View style={styles.storeInfo}>
                  <View style={styles.storeNameRow}>
                    <Text style={styles.storeName} numberOfLines={1}>
                      {restaurant.name}
                    </Text>
                    <View style={styles.ratingPill}>
                      <Text style={styles.ratingText}>4.5</Text>
                      <Ionicons name="star" size={11} color={BrandColors.primary} />
                    </View>
                  </View>
                  <Text style={styles.storeCuisine} numberOfLines={1}>
                    {restaurant.description ?? restaurant.address}
                  </Text>
                  <View style={styles.storeMeta}>
                    <View style={styles.storeMetaItem}>
                      <Ionicons
                        name="time-outline"
                        size={13}
                        color={BrandColors.textSecondary}
                      />
                      <Text style={styles.storeMetaText}>30-45 min</Text>
                    </View>
                    <View style={styles.storeMetaItem}>
                      <Ionicons
                        name="bicycle-outline"
                        size={13}
                        color={BrandColors.textSecondary}
                      />
                      <Text style={styles.storeMetaText}>Free delivery</Text>
                    </View>
                    {restaurant.is_open && (
                      <View style={styles.storeMetaItem}>
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={13}
                          color={BrandColors.primary}
                        />
                        <Text style={[styles.storeMetaText, { color: BrandColors.primary }]}>
                          Open
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BrandColors.background,
  },
  // ── top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: BrandColors.background,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    flexShrink: 1,
  },
  addressTexts: { flexShrink: 1 },
  addressLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: BrandColors.textSecondary,
  },
  addressValue: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: BrandColors.textPrimary,
  },
  cartBtn: {
    padding: Spacing.sm,
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: BrandColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 9,
    color: BrandColors.white,
  },
  // ── search
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BrandColors.cardBg,
    borderRadius: BorderRadius.full,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    height: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchPlaceholder: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: BrandColors.textMuted,
  },
  // ── sections
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    color: BrandColors.textPrimary,
  },
  sectionPad: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  viewAll: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: BrandColors.primary,
  },
  // ── categories
  categoriesScroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  categoryItem: {
    alignItems: "center",
    gap: 6,
  },
  categoryCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: BrandColors.cardBg,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: BrandColors.textSecondary,
  },
  // ── deals
  dealsScroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  dealCard: {
    width: 200,
    backgroundColor: BrandColors.cardBg,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  dealImage: {
    width: "100%",
    height: 120,
  },
  dealBadge: {
    position: "absolute",
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  dealBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: BrandColors.white,
  },
  dealInfo: {
    padding: Spacing.sm,
  },
  dealName: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: BrandColors.textPrimary,
    marginBottom: 4,
  },
  dealMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dealMetaText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: BrandColors.textSecondary,
  },
  dealDot: {
    color: BrandColors.textMuted,
    fontSize: 12,
  },
  // ── stores
  storesList: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  storeCard: {
    backgroundColor: BrandColors.cardBg,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  storeImage: {
    width: "100%",
    height: 160,
  },
  favouriteBtn: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: BrandColors.cardBg,
    justifyContent: "center",
    alignItems: "center",
  },
  storeInfo: {
    padding: Spacing.md,
  },
  storeNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  storeName: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: BrandColors.textPrimary,
    marginRight: Spacing.sm,
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: BrandColors.textPrimary,
  },
  storeCuisine: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: BrandColors.textSecondary,
    marginBottom: Spacing.sm,
  },
  storeMeta: {
    flexDirection: "row",
    gap: Spacing.md,
    flexWrap: "wrap",
  },
  storeMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  storeMetaText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: BrandColors.textSecondary,
  },
  emptyStoresText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: BrandColors.textSecondary,
    marginTop: Spacing.sm,
  },
});

// ─── rider styles ─────────────────────────────────────────────────────────────

const riderSt = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    flexShrink: 1,
  },
  locationTexts: { flexShrink: 1 },
  locationLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: BrandColors.textSecondary,
  },
  locationValue: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: BrandColors.textPrimary,
  },
  bellBtn: { padding: Spacing.sm },
  onlinePill: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  offlinePill: { backgroundColor: BrandColors.divider },
  onlinePillText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: BrandColors.white,
    letterSpacing: 0.5,
  },
  offlinePillText: { color: BrandColors.textSecondary },
  // map
  mapContainer: {
    height: 200,
    position: "relative",
    marginBottom: Spacing.md,
  },
  mapBg: {
    flex: 1,
    backgroundColor: BrandColors.mapBg,
    overflow: "hidden",
  },
  mapGridH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: BrandColors.mapGrid,
  },
  mapGridV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: BrandColors.mapGrid,
  },
  mapLocationOverlay: {
    position: "absolute",
    bottom: Spacing.md,
    left: Spacing.md,
  },
  mapLocationLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: BrandColors.textSecondary,
    marginBottom: 2,
  },
  mapLocationValue: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: BrandColors.textPrimary,
  },
  mapRecenterBtn: {
    position: "absolute",
    bottom: Spacing.md,
    right: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BrandColors.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: BrandColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  // active order banner
  activeOrderBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BrandColors.riderBlue,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  activeOrderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  activeOrderText: { flex: 1 },
  activeOrderTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: BrandColors.white,
    marginBottom: 2,
  },
  activeOrderSub: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  // section header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: 20,
    color: BrandColors.textPrimary,
  },
  nearbyPill: {
    backgroundColor: BrandColors.cardBg,
    borderWidth: 1,
    borderColor: BrandColors.divider,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  nearbyText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: BrandColors.textSecondary,
  },
  // order list
  ordersList: { paddingHorizontal: Spacing.md, gap: Spacing.md },
  orderCard: {
    backgroundColor: BrandColors.cardBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: BrandColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  orderCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  orderRestaurant: {
    flex: 1,
    fontFamily: FontFamily.extraBold,
    fontSize: 18,
    color: BrandColors.textPrimary,
    marginRight: Spacing.sm,
  },
  earningsBadge: {
    backgroundColor: BrandColors.earningsBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.md,
  },
  earningsBadgeText: {
    fontFamily: FontFamily.extraBold,
    fontSize: 14,
    color: BrandColors.earningsText,
  },
  orderMeta: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: BrandColors.textSecondary,
    marginBottom: Spacing.sm,
  },
  orderStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  orderStatItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  orderStatText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: BrandColors.textSecondary,
  },
  orderStatDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: BrandColors.textMuted,
  },
  orderActions: { flexDirection: "row", gap: Spacing.sm },
  acceptBtn: {
    flex: 1,
    height: 48,
    backgroundColor: BrandColors.primary,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  acceptBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: BrandColors.white,
  },
  rejectBtn: {
    width: 48,
    height: 48,
    backgroundColor: BrandColors.cardBg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BrandColors.divider,
    justifyContent: "center",
    alignItems: "center",
  },
  // new styles for real rider data
  orderPickup: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: BrandColors.textSecondary,
    marginBottom: 6,
  },
  offlineState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    gap: 8,
  },
  offlineStateTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: 20,
    color: BrandColors.textPrimary,
    marginTop: 4,
  },
  offlineStateSub: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: BrandColors.textSecondary,
    textAlign: 'center',
  },
  goOnlineBtn: {
    marginTop: Spacing.md,
    backgroundColor: BrandColors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
  },
  goOnlineBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: BrandColors.white,
  },
  noOrdersState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: 6,
  },
  noOrdersText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 15,
    color: BrandColors.textSecondary,
  },
  noOrdersSub: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: BrandColors.textMuted,
    textAlign: 'center',
  },
});
