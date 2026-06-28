import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BrandColors, FontFamily, Spacing, BorderRadius } from '@/constants/theme';
import Button from '@/components/ui/Button';

const LANDMARKS = ['Business District', 'City Center Park', 'Airport', 'University'];

export default function LocationSetupScreen() {
  const ring1 = useRef(new Animated.Value(1)).current;
  const ring2 = useRef(new Animated.Value(1)).current;
  const ring1Opacity = useRef(new Animated.Value(0.4)).current;
  const ring2Opacity = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    const pulse = (scale: Animated.Value, opacity: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(scale, { toValue: 1.5, duration: 1200, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 1200, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: delay === 0 ? 0.4 : 0.2, duration: 0, useNativeDriver: true }),
          ]),
        ])
      );

    const a1 = pulse(ring1, ring1Opacity, 0);
    const a2 = pulse(ring2, ring2Opacity, 600);
    a1.start();
    a2.start();
    return () => { a1.stop(); a2.stop(); };
  }, [ring1, ring2, ring1Opacity, ring2Opacity]);

  function handleShareLocation() {
    Alert.alert('Location', 'GPS support coming soon. Please enter your address manually.');
  }

  function handleEnterManually() {
    router.push({ pathname: '/address-search', params: { from: 'setup' } });
  }

  function handleLandmark(name: string) {
    router.push({ pathname: '/address-search', params: { from: 'setup', prefill: name } });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>Ubar Chops</Text>
        <View style={styles.cartBtn}>
          <Ionicons name="basket-outline" size={24} color={BrandColors.primary} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Pulsing pin */}
        <View style={styles.pinContainer}>
          <Animated.View
            style={[
              styles.ring,
              styles.ring2,
              { transform: [{ scale: ring2 }], opacity: ring2Opacity },
            ]}
          />
          <Animated.View
            style={[
              styles.ring,
              styles.ring1,
              { transform: [{ scale: ring1 }], opacity: ring1Opacity },
            ]}
          />
          <View style={styles.pinCircle}>
            <Ionicons name="location" size={32} color={BrandColors.white} />
          </View>
        </View>

        {/* City image */}
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600&q=80' }}
          style={styles.cityImage}
          contentFit="cover"
        />

        {/* CTA text */}
        <Text style={styles.title}>Where are we delivering?</Text>
        <Text style={styles.subtitle}>
          Help our couriers find you faster with{'\n'}precise location data.
        </Text>

        {/* Buttons */}
        <View style={styles.buttons}>
          <Button
            label="Share Current Location"
            onPress={handleShareLocation}
            rightIcon={<Ionicons name="locate-outline" size={18} color={BrandColors.white} />}
          />
          <View style={styles.gap} />
          <Button
            label="Enter Address Manually"
            variant="inverted"
            onPress={handleEnterManually}
            rightIcon={<Ionicons name="map-outline" size={18} color={BrandColors.white} />}
          />
        </View>

        {/* Nearby landmarks */}
        <Text style={styles.landmarksLabel}>NEARBY LANDMARKS</Text>
        <View style={styles.landmarkRow}>
          {LANDMARKS.map((name) => (
            <TouchableOpacity
              key={name}
              style={styles.landmarkChip}
              onPress={() => handleLandmark(name)}
              activeOpacity={0.7}
            >
              <Ionicons name="business-outline" size={14} color={BrandColors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={styles.landmarkText}>{name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BrandColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  appName: {
    fontFamily: FontFamily.extraBold,
    fontSize: 22,
    color: BrandColors.primary,
    letterSpacing: -0.3,
  },
  cartBtn: {
    padding: Spacing.sm,
  },
  scroll: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  pinContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  ring: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: BrandColors.primary,
  },
  ring1: {
    width: 90,
    height: 90,
  },
  ring2: {
    width: 110,
    height: 110,
  },
  pinCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: BrandColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  cityImage: {
    width: '100%',
    height: 160,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  title: {
    fontFamily: FontFamily.extraBold,
    fontSize: 24,
    color: BrandColors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: BrandColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  buttons: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  gap: {
    height: Spacing.sm,
  },
  landmarksLabel: {
    alignSelf: 'flex-start',
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    color: BrandColors.textMuted,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  landmarkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    alignSelf: 'flex-start',
  },
  landmarkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: BrandColors.divider,
    backgroundColor: BrandColors.cardBg,
  },
  landmarkText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: BrandColors.textPrimary,
  },
});
