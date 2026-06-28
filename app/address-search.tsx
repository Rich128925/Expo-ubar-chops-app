import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { BrandColors, FontFamily, Spacing, BorderRadius } from '@/constants/theme';
import Button from '@/components/ui/Button';
import { useAddress } from '@/hooks/use-address';

const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_APIKEY!;

interface Prediction {
  place_id: string;
  description: string;
  structured_formatting: { main_text: string; secondary_text: string };
}

export default function AddressSearchScreen() {
  const { saveAddress } = useAddress();
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selected, setSelected] = useState<{ text: string; latitude: number; longitude: number } | null>(null);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 3) { setPredictions([]); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOOGLE_KEY}&types=geocode`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.status === 'OK') setPredictions(json.predictions ?? []);
        else setPredictions([]);
      } catch {
        setPredictions([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [query]);

  async function handleSelectPrediction(prediction: Prediction) {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&key=${GOOGLE_KEY}&fields=geometry,formatted_address`;
    try {
      const res = await fetch(url);
      const json = await res.json();
      if (json.status === 'OK') {
        const loc = json.result.geometry.location;
        const text = json.result.formatted_address ?? prediction.description;
        setSelected({ text, latitude: loc.lat, longitude: loc.lng });
        setQuery(text);
        setPredictions([]);
      }
    } catch {
      setSelected({ text: prediction.description, latitude: 0, longitude: 0 });
      setQuery(prediction.description);
      setPredictions([]);
    }
  }

  async function handleCurrentLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;

      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_KEY}`;
      const res = await fetch(url);
      const json = await res.json();
      const addr = json.results?.[0]?.formatted_address ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

      setSelected({ text: addr, latitude, longitude });
      setQuery(addr);
      setPredictions([]);
    } catch {
      // silently fail
    } finally {
      setLocating(false);
    }
  }

  async function handleContinue() {
    const text = query.trim();
    if (!text) return;
    setSaving(true);
    await saveAddress(text, selected ? { latitude: selected.latitude, longitude: selected.longitude } : undefined);
    setSaving(false);
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={24} color={BrandColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Enter Address</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        {/* Search input */}
        <View style={styles.searchBox}>
          <Ionicons name="location-outline" size={18} color={BrandColors.primary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for your address"
            placeholderTextColor={BrandColors.textMuted}
            value={query}
            onChangeText={(t) => { setQuery(t); setSelected(null); }}
            autoFocus
            returnKeyType="search"
          />
          {searching ? (
            <ActivityIndicator size="small" color={BrandColors.primary} />
          ) : query.length > 0 ? (
            <TouchableOpacity onPress={() => { setQuery(''); setPredictions([]); setSelected(null); }} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={18} color={BrandColors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Use current location */}
        <TouchableOpacity style={styles.currentLocation} onPress={handleCurrentLocation} activeOpacity={0.7} disabled={locating}>
          {locating ? (
            <ActivityIndicator size="small" color={BrandColors.primary} style={{ marginRight: Spacing.sm }} />
          ) : (
            <Ionicons name="navigate" size={16} color={BrandColors.primary} style={{ marginRight: Spacing.sm }} />
          )}
          <Text style={styles.currentLocationText}>
            {locating ? 'Getting your location…' : 'Use my current location'}
          </Text>
        </TouchableOpacity>

        {/* Autocomplete predictions */}
        {predictions.length > 0 && (
          <FlatList
            data={predictions}
            keyExtractor={(item) => item.place_id}
            keyboardShouldPersistTaps="handled"
            style={styles.predictionsList}
            ItemSeparatorComponent={() => <View style={styles.predDivider} />}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.predictionItem}
                onPress={() => handleSelectPrediction(item)}
                activeOpacity={0.7}
              >
                <View style={styles.predIconWrap}>
                  <Ionicons name="location-outline" size={16} color={BrandColors.primary} />
                </View>
                <View style={styles.predText}>
                  <Text style={styles.predMain} numberOfLines={1}>
                    {item.structured_formatting?.main_text ?? item.description}
                  </Text>
                  <Text style={styles.predSecondary} numberOfLines={1}>
                    {item.structured_formatting?.secondary_text ?? ''}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Empty state when no predictions and no query */}
        {predictions.length === 0 && query.length === 0 && (
          <View style={styles.emptyHint}>
            <Ionicons name="search-outline" size={40} color={BrandColors.textMuted} />
            <Text style={styles.emptyHintText}>Start typing to search for an address</Text>
          </View>
        )}

        {/* Spacer */}
        <View style={styles.flex} />

        {/* Continue button */}
        <View style={styles.footer}>
          <Button
            label="Confirm Address"
            onPress={handleContinue}
            loading={saving}
            disabled={!query.trim()}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  closeBtn: { padding: Spacing.sm, marginLeft: -Spacing.sm },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FontFamily.extraBold,
    fontSize: 20,
    color: BrandColors.primary,
    letterSpacing: -0.3,
  },
  headerRight: { width: 38 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.cardBg,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: BrandColors.primary,
    paddingHorizontal: Spacing.md,
    height: 52,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: BrandColors.textPrimary,
    paddingVertical: 0,
  },
  currentLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.iconCircleBg ?? BrandColors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  currentLocationText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: BrandColors.primary,
  },
  predictionsList: {
    backgroundColor: BrandColors.cardBg,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    maxHeight: 320,
    overflow: 'hidden',
  },
  predDivider: {
    height: 1,
    backgroundColor: BrandColors.background,
    marginLeft: Spacing.md + 36 + Spacing.sm,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  predIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BrandColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  predText: { flex: 1 },
  predMain: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: BrandColors.textPrimary,
    marginBottom: 2,
  },
  predSecondary: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: BrandColors.textSecondary,
  },
  emptyHint: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    gap: 12,
    paddingHorizontal: Spacing.xl,
  },
  emptyHintText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: BrandColors.textMuted,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    backgroundColor: BrandColors.background,
    borderTopWidth: 1,
    borderTopColor: BrandColors.divider,
  },
});
