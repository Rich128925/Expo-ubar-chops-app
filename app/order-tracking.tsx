import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BrandColors, FontFamily, Spacing, BorderRadius } from '@/constants/theme';

const STATUS_STEPS = [
  {
    id: '1',
    icon: 'checkmark-circle' as const,
    title: 'Order Received & Preparing',
    subtitle: 'The kitchen is crafting your meal with care.',
    time: '12:45 PM',
    state: 'done',
  },
  {
    id: '2',
    icon: 'bicycle' as const,
    title: 'Out for Delivery',
    subtitle: 'Your courier is on the way to your location.',
    time: 'In Progress',
    state: 'active',
  },
  {
    id: '3',
    icon: 'location-outline' as const,
    title: 'Arrived',
    subtitle: 'Enjoy your Ubar Chops meal!',
    time: '',
    state: 'pending',
  },
];

export default function OrderTrackingScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={BrandColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ubar Chops</Text>
        <View style={styles.headerRight}>
          <Ionicons name="location-outline" size={22} color={BrandColors.primary} />
          <TouchableOpacity style={styles.cartIconBtn} activeOpacity={0.7}>
            <Ionicons name="basket-outline" size={22} color={BrandColors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Map placeholder */}
        <View style={styles.mapContainer}>
          {/* Map background */}
          <View style={styles.mapBg}>
            {/* Grid lines */}
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <View key={`h${i}`} style={[styles.mapGridH, { top: `${i * 20}%` }]} />
            ))}
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <View key={`v${i}`} style={[styles.mapGridV, { left: `${i * 20}%` }]} />
            ))}

            {/* Route line */}
            <View style={styles.routeLine} />

            {/* Home pin */}
            <View style={[styles.mapPin, styles.homePin]}>
              <View style={styles.homePinCircle}>
                <Ionicons name="home" size={16} color={BrandColors.white} />
              </View>
            </View>

            {/* Rider pin */}
            <View style={[styles.mapPin, styles.riderPin]}>
              <View style={styles.riderPinCircle}>
                <Ionicons name="bicycle" size={16} color={BrandColors.white} />
              </View>
            </View>
          </View>

          {/* Arrival badge */}
          <View style={styles.arrivalBadge}>
            <Ionicons name="time-outline" size={15} color={BrandColors.textPrimary} />
            <Text style={styles.arrivalText}>Arrival in 8-10 mins</Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Order status timeline */}
          <Text style={styles.sectionTitle}>Order Status</Text>
          <View style={styles.timeline}>
            {STATUS_STEPS.map((step, index) => {
              const isDone = step.state === 'done';
              const isActive = step.state === 'active';
              const isPending = step.state === 'pending';

              return (
                <View key={step.id} style={styles.timelineRow}>
                  {/* Icon + connector */}
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
                    {index < STATUS_STEPS.length - 1 && (
                      <View style={[
                        styles.connector,
                        isDone && styles.connectorDone,
                      ]} />
                    )}
                  </View>

                  {/* Text */}
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
                    {step.time ? (
                      <Text style={[
                        styles.stepTime,
                        isActive && styles.stepTimeActive,
                      ]}>
                        {step.time}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Rider card */}
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
                <Text style={styles.riderMetaText}>4.9 (2.4k orders) · Pedal Bike</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.contactBtn} activeOpacity={0.8}>
              <Text style={styles.contactBtnText}>Contact</Text>
            </TouchableOpacity>
          </View>

          {/* Order card */}
          <TouchableOpacity style={styles.orderCard} activeOpacity={0.7}>
            <View style={styles.orderCardIcon}>
              <Ionicons name="receipt-outline" size={22} color={BrandColors.textSecondary} />
            </View>
            <View style={styles.orderCardText}>
              <Text style={styles.orderCardId}>Order #UB-99a1</Text>
              <Text style={styles.orderCardMeta}>2 Items · Total $42.50</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={BrandColors.textMuted} />
          </TouchableOpacity>
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
  backBtn: { padding: Spacing.sm, marginLeft: -Spacing.sm },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FontFamily.extraBold,
    fontSize: 20,
    color: BrandColors.primary,
    letterSpacing: -0.3,
  },
  headerRight: { flexDirection: 'row', gap: 4 },
  cartIconBtn: { padding: 4 },
  // map
  mapContainer: {
    height: 240,
    position: 'relative',
    backgroundColor: '#E8EDF2',
  },
  mapBg: {
    flex: 1,
    backgroundColor: '#D8E4EC',
    overflow: 'hidden',
  },
  mapGridH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#C0CDD8',
  },
  mapGridV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#C0CDD8',
  },
  routeLine: {
    position: 'absolute',
    top: '45%',
    left: '25%',
    right: '35%',
    height: 3,
    backgroundColor: BrandColors.primary,
    borderRadius: 2,
    transform: [{ rotate: '-8deg' }],
  },
  mapPin: {
    position: 'absolute',
    alignItems: 'center',
  },
  homePin: { top: '30%', right: '25%' },
  riderPin: { top: '50%', left: '30%' },
  homePinCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BrandColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: BrandColors.white,
  },
  riderPinCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BrandColors.primary,
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
    fontSize: 14,
    color: BrandColors.textPrimary,
  },
  // content
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.lg },
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
    marginBottom: 3,
  },
  stepSubtitlePending: { color: BrandColors.textMuted },
  stepTime: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: BrandColors.textSecondary,
  },
  stepTimeActive: { color: BrandColors.primary, fontFamily: FontFamily.bold },
  // rider card
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.cardBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  riderAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
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
  contactBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: BrandColors.white,
  },
  // order card
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.cardBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderCardIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: BrandColors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderCardText: { flex: 1 },
  orderCardId: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: BrandColors.textPrimary,
    marginBottom: 2,
  },
  orderCardMeta: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: BrandColors.textSecondary,
  },
});
