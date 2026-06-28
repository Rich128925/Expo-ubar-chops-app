import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { BrandColors, FontFamily, Spacing, BorderRadius } from '@/constants/theme';
import { useCart } from '@/context/CartContext';
import { insforge } from '@/lib/insforge';

interface DbRestaurant {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  address: string;
  opening_time: string | null;
  closing_time: string | null;
  is_open: boolean;
}

interface DishItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string | null;
  image_url: string | null;
  available: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  main: 'Mains',
  sides: 'Sides',
  beverages: 'Beverages',
  desserts: 'Desserts',
};

function CartBadge() {
  const { itemCount } = useCart();
  if (!itemCount) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{itemCount > 9 ? '9+' : itemCount}</Text>
    </View>
  );
}

function MenuItemRow({ item, restaurantId }: { item: DishItem; restaurantId: string }) {
  const { addItem, items } = useCart();
  const qty = items.find((i) => i.id === item.id)?.quantity ?? 0;

  return (
    <View style={styles.menuItem}>
      <View style={styles.menuItemInfo}>
        <Text style={styles.menuItemName}>{item.name}</Text>
        {item.description ? (
          <Text style={styles.menuItemDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}
        <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>
      </View>
      <View style={styles.menuItemRight}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.menuItemImage} contentFit="cover" />
        ) : (
          <View style={[styles.menuItemImage, styles.menuItemPlaceholder]}>
            <Ionicons name="restaurant-outline" size={24} color={BrandColors.textMuted} />
          </View>
        )}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() =>
            addItem({
              id: item.id,
              name: item.name,
              price: item.price,
              image: item.image_url ?? '',
              restaurantId,
            })
          }
          activeOpacity={0.8}
        >
          {qty > 0 ? (
            <Text style={styles.addBtnQty}>{qty}</Text>
          ) : (
            <Ionicons name="add" size={20} color={BrandColors.white} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { itemCount } = useCart();

  const [restaurant, setRestaurant] = useState<DbRestaurant | null>(null);
  const [dishes, setDishes] = useState<DishItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');

  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Record<string, number>>({});
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      insforge.database.from('restaurants').select().eq('id', id),
      insforge.database
        .from('dishes')
        .select()
        .eq('restaurant_id', id)
        .eq('available', true)
        .order('created_at', { ascending: true }),
    ]).then(([restRes, dishRes]) => {
      if (!restRes.error && restRes.data?.[0]) {
        setRestaurant(restRes.data[0] as DbRestaurant);
      }
      if (!dishRes.error && dishRes.data) {
        setDishes(dishRes.data as DishItem[]);
      }
      setLoading(false);
    });
  }, [id]);

  // Derive ordered unique category labels from the actual dishes
  const categories = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    dishes.forEach((d) => {
      const label = CATEGORY_LABELS[d.category] ?? d.category;
      if (!seen.has(label)) {
        seen.add(label);
        result.push(label);
      }
    });
    return result;
  }, [dishes]);

  // Set first tab once categories are known
  useEffect(() => {
    if (categories.length > 0 && !activeTab) {
      setActiveTab(categories[0]);
    }
  }, [categories, activeTab]);

  const menuByCategory = useMemo(
    () =>
      categories.map((cat) => ({
        category: cat,
        items: dishes.filter(
          (d) => (CATEGORY_LABELS[d.category] ?? d.category) === cat
        ),
      })),
    [categories, dishes]
  );

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  function scrollToSection(category: string) {
    setActiveTab(category);
    const offset = sectionOffsets.current[category];
    if (offset !== undefined && scrollRef.current) {
      scrollRef.current.scrollTo({ y: offset - 110, animated: true });
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={BrandColors.primary} />
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.notFoundText}>Restaurant not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: Spacing.md }}>
          <Text style={styles.notFoundBack}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const shortName = restaurant.name.split(' ').slice(0, 2).join(' ');
  const hours =
    restaurant.opening_time && restaurant.closing_time
      ? `${restaurant.opening_time} – ${restaurant.closing_time}`
      : 'Open';

  return (
    <View style={styles.container}>
      {/* Animated solid header (shows on scroll) */}
      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={22} color={BrandColors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{shortName}</Text>
            <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/cart')} activeOpacity={0.7}>
              <Ionicons name="basket-outline" size={22} color={BrandColors.primary} />
              <CartBadge />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Transparent header (always visible) */}
      <View style={styles.transparentHeader}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={[styles.headerBtn, styles.headerBtnWhite]} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={22} color={BrandColors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitleGreen}>{shortName}</Text>
            <TouchableOpacity style={[styles.headerBtn, styles.headerBtnWhite]} onPress={() => router.push('/cart')} activeOpacity={0.7}>
              <Ionicons name="basket-outline" size={22} color={BrandColors.primary} />
              <CartBadge />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* Hero */}
        <View style={styles.heroWrap}>
          <Image
            source={{ uri: restaurant.image_url ?? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80' }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <View style={styles.heroOverlay}>
            <Text style={styles.heroName}>{restaurant.name}</Text>
            <View style={styles.heroMeta}>
              <View style={styles.ratingPill}>
                <Ionicons name="star" size={11} color={BrandColors.primary} />
                <Text style={styles.ratingText}>4.5 (100+)</Text>
              </View>
              {restaurant.description ? (
                <>
                  <Text style={styles.heroDot}>·</Text>
                  <Text style={styles.heroSubText} numberOfLines={1}>{restaurant.description}</Text>
                </>
              ) : null}
            </View>
          </View>
        </View>

        {/* Info bar */}
        <View style={styles.infoBar}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Delivery</Text>
            <Text style={styles.infoValue}>Free</Text>
          </View>
          <View style={styles.infoSep} />
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Est. Time</Text>
            <Text style={styles.infoValue}>30-45 min</Text>
          </View>
          <View style={styles.infoSep} />
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Hours</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{hours}</Text>
          </View>
        </View>

        {/* Category tabs — only shown if there are dishes */}
        {categories.length > 0 && (
          <View style={styles.tabsBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsScroll}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.tab, activeTab === cat && styles.tabActive]}
                  onPress={() => scrollToSection(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabText, activeTab === cat && styles.tabTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Menu sections */}
        {menuByCategory.length > 0 ? (
          <View style={styles.menuSections}>
            {menuByCategory.map(({ category, items }) => (
              <View
                key={category}
                onLayout={(e) => {
                  sectionOffsets.current[category] = e.nativeEvent.layout.y;
                }}
              >
                <Text style={styles.sectionHeader}>{category}</Text>
                <View style={styles.sectionCard}>
                  {items.map((item, index) => (
                    <React.Fragment key={item.id}>
                      <MenuItemRow item={item} restaurantId={restaurant.id} />
                      {index < items.length - 1 && <View style={styles.itemDivider} />}
                    </React.Fragment>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyMenu}>
            <Ionicons name="restaurant-outline" size={40} color={BrandColors.textMuted} />
            <Text style={styles.emptyMenuText}>No menu items yet</Text>
          </View>
        )}

        <View style={{ height: Spacing.xxl * 2 }} />
      </Animated.ScrollView>

      {/* Sticky cart button */}
      {itemCount > 0 && (
        <View style={styles.cartBar}>
          <TouchableOpacity
            style={styles.cartBarBtn}
            onPress={() => router.push('/cart')}
            activeOpacity={0.85}
          >
            <View style={styles.cartBarCount}>
              <Text style={styles.cartBarCountText}>{itemCount}</Text>
            </View>
            <Text style={styles.cartBarLabel}>View Cart</Text>
            <Ionicons name="basket-outline" size={20} color={BrandColors.white} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  notFoundText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    color: BrandColors.textSecondary,
  },
  notFoundBack: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: BrandColors.primary,
  },
  // ── headers
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: BrandColors.background,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.divider,
  },
  transparentHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  headerBtn: { padding: Spacing.sm },
  headerBtnWhite: {
    backgroundColor: BrandColors.white,
    borderRadius: 20,
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  headerTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: 18,
    color: BrandColors.textPrimary,
    letterSpacing: -0.3,
  },
  headerTitleGreen: {
    fontFamily: FontFamily.extraBold,
    fontSize: 18,
    color: BrandColors.primary,
    letterSpacing: -0.3,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: BrandColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { fontFamily: FontFamily.bold, fontSize: 9, color: BrandColors.white },
  // ── hero
  heroWrap: { position: 'relative' },
  heroImage: { width: '100%', height: 260 },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: Spacing.md,
  },
  heroName: {
    fontFamily: FontFamily.extraBold,
    fontSize: 20,
    color: BrandColors.white,
    marginBottom: 4,
  },
  heroMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: BrandColors.white,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  ratingText: { fontFamily: FontFamily.bold, fontSize: 11, color: BrandColors.textPrimary },
  heroDot: { color: BrandColors.white, fontSize: 12 },
  heroSubText: { fontFamily: FontFamily.regular, fontSize: 12, color: BrandColors.white, flex: 1 },
  // ── info bar
  infoBar: {
    flexDirection: 'row',
    backgroundColor: BrandColors.cardBg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.divider,
  },
  infoItem: { flex: 1, alignItems: 'center' },
  infoLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: BrandColors.textSecondary,
    marginBottom: 2,
  },
  infoValue: { fontFamily: FontFamily.bold, fontSize: 14, color: BrandColors.textPrimary },
  infoSep: { width: 1, backgroundColor: BrandColors.divider, marginVertical: 2 },
  // ── tabs
  tabsBar: {
    backgroundColor: BrandColors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.divider,
  },
  tabsScroll: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: BrandColors.divider,
    backgroundColor: BrandColors.cardBg,
  },
  tabActive: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  tabText: { fontFamily: FontFamily.semiBold, fontSize: 14, color: BrandColors.textSecondary },
  tabTextActive: { color: BrandColors.white },
  // ── menu
  menuSections: { paddingHorizontal: Spacing.md, paddingTop: Spacing.lg },
  sectionHeader: {
    fontFamily: FontFamily.extraBold,
    fontSize: 20,
    color: BrandColors.textPrimary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  sectionCard: {
    backgroundColor: BrandColors.cardBg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: { flexDirection: 'row', padding: Spacing.md, gap: Spacing.md },
  menuItemInfo: { flex: 1 },
  menuItemName: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: BrandColors.textPrimary,
    marginBottom: 4,
  },
  menuItemDesc: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: BrandColors.textSecondary,
    lineHeight: 17,
    marginBottom: 6,
  },
  menuItemPrice: { fontFamily: FontFamily.bold, fontSize: 15, color: BrandColors.primary },
  menuItemRight: { alignItems: 'flex-end', gap: Spacing.sm },
  menuItemImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
  },
  menuItemPlaceholder: {
    backgroundColor: BrandColors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BrandColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnQty: { fontFamily: FontFamily.bold, fontSize: 13, color: BrandColors.white },
  itemDivider: {
    height: 1,
    backgroundColor: BrandColors.background,
    marginHorizontal: Spacing.md,
  },
  // ── empty menu
  emptyMenu: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyMenuText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: BrandColors.textSecondary,
  },
  // ── cart bar
  cartBar: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.md,
    right: Spacing.md,
  },
  cartBarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  cartBarCount: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  cartBarCountText: { fontFamily: FontFamily.bold, fontSize: 13, color: BrandColors.white },
  cartBarLabel: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: BrandColors.white,
    textAlign: 'center',
  },
});
