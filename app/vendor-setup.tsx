import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import { BrandColors, FontFamily, Spacing, BorderRadius } from '@/constants/theme';
import VendorHeader from '@/components/ui/VendorHeader';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useRestaurant } from '@/context/RestaurantContext';
import { insforge } from '@/lib/insforge';
import { uploadImageFromUri } from '@/lib/uploadImage';

const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_APIKEY ?? '';

interface PlaceSuggestion {
  place_id: string;
  description: string;
}

interface SelectedLocation {
  lat: number;
  lng: number;
  address: string;
}

export default function VendorSetupScreen() {
  const insets = useSafeAreaInsets();
  const { user, refreshAuth } = useAuth();
  const { refetch } = useRestaurant();

  const [restaurantName, setRestaurantName] = useState('');
  const [description, setDescription] = useState('');
  const [imageAsset, setImageAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [locationSearch, setLocationSearch] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [location, setLocation] = useState<SelectedLocation | null>(null);
  const [openingTime, setOpeningTime] = useState('');
  const [closingTime, setClosingTime] = useState('');
  const [applyAllDays, setApplyAllDays] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Image picker ──────────────────────────────────────────────────────────────

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos to upload a restaurant image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as ImagePicker.MediaType,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled) setImageAsset(result.assets[0]);
  };

  // ── Places autocomplete ───────────────────────────────────────────────────────

  const searchPlaces = useCallback(async (query: string) => {
    if (!query.trim()) { setSuggestions([]); return; }
    setSearchLoading(true);
    try {
      const url =
        `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
        `?input=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_KEY}&types=address`;
      const res = await fetch(url);
      const json = await res.json();
      setSuggestions(json.predictions ?? []);
    } catch {
      setSuggestions([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleLocationInput = (text: string) => {
    setLocationSearch(text);
    if (location) setLocation(null);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchPlaces(text), 400);
  };

  const selectSuggestion = async (suggestion: PlaceSuggestion) => {
    setLocationSearch(suggestion.description);
    setSuggestions([]);
    try {
      const url =
        `https://maps.googleapis.com/maps/api/place/details/json` +
        `?place_id=${suggestion.place_id}&fields=geometry&key=${GOOGLE_MAPS_KEY}`;
      const res = await fetch(url);
      const json = await res.json();
      const geo = json.result?.geometry?.location;
      if (geo) {
        setLocation({ lat: geo.lat, lng: geo.lng, address: suggestion.description });
      }
    } catch {
      setLocation(null);
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!restaurantName.trim()) {
      Alert.alert('Required', 'Please enter your restaurant name.');
      return;
    }
    if (!location) {
      Alert.alert('Required', 'Please search for and select your restaurant location.');
      return;
    }

    setSaving(true);
    try {
      const { error: refreshError, accessToken: freshToken } = await refreshAuth();
      if (refreshError || !freshToken) throw new Error(refreshError ?? 'No access token');

      let imageUrl: string | null = null;
      let imageKey: string | null = null;

      if (imageAsset) {
        const fileName = imageAsset.fileName ?? `restaurant-${Date.now()}.jpg`;
        const mimeType = imageAsset.mimeType ?? 'image/jpeg';
        const { url, key } = await uploadImageFromUri(
          imageAsset.uri,
          fileName,
          mimeType,
          imageAsset.fileSize,
          freshToken,
          'restaurant-images',
        );
        imageUrl = url;
        imageKey = key;
      }

      const { error } = await insforge.database.from('restaurants').insert([
        {
          vendor_id: user!.id,
          name: restaurantName.trim(),
          description: description.trim() || null,
          image_url: imageUrl,
          image_key: imageKey,
          address: location.address,
          latitude: location.lat,
          longitude: location.lng,
          opening_time: openingTime.trim() || null,
          closing_time: closingTime.trim() || null,
          is_open: true,
        },
      ]);

      if (error) throw error;

      await refetch();
      router.replace('/(tabs)/vendor-orders');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to create restaurant. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <VendorHeader title="Vendor" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.pageTitle}>Setup your restaurant</Text>
        <Text style={styles.pageSubtitle}>
          Let's get your kitchen ready for the urban professional market.
        </Text>

        {/* ── Hero image ─────────────────────────────────────────────────────── */}
        <Text style={styles.fieldLabel}>Storefront Hero Image</Text>
        <TouchableOpacity style={styles.heroUpload} onPress={pickImage} activeOpacity={0.8}>
          {imageAsset ? (
            <Image source={{ uri: imageAsset.uri }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="camera-outline" size={32} color={BrandColors.primary} />
              <Text style={styles.heroUploadTitle}>Click to upload or drag and drop</Text>
              <Text style={styles.heroUploadSub}>Recommended: 1600×900px (Max 5MB)</Text>
            </View>
          )}
          {imageAsset && (
            <View style={styles.heroEditOverlay}>
              <Ionicons name="pencil" size={18} color={BrandColors.white} />
            </View>
          )}
        </TouchableOpacity>

        {/* ── Restaurant name ────────────────────────────────────────────────── */}
        <FormInput
          label="Restaurant Name"
          placeholder="e.g. The Green Bistro"
          value={restaurantName}
          onChangeText={setRestaurantName}
          autoCapitalize="words"
          returnKeyType="next"
        />

        {/* ── Description ───────────────────────────────────────────────────── */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabel}>Description</Text>
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              placeholder="Tell us about your cuisine and story..."
              placeholderTextColor={BrandColors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* ── Location ──────────────────────────────────────────────────────── */}
        <Text style={styles.fieldLabel}>Restaurant Location</Text>
        <View style={styles.locationSearchContainer}>
          <Ionicons name="location-outline" size={18} color={BrandColors.textMuted} style={styles.locationIcon} />
          <TextInput
            style={styles.locationInput}
            placeholder="Search for your address"
            placeholderTextColor={BrandColors.textMuted}
            value={locationSearch}
            onChangeText={handleLocationInput}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchLoading && (
            <ActivityIndicator size="small" color={BrandColors.primary} style={{ marginLeft: 8 }} />
          )}
        </View>

        {/* Autocomplete dropdown */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsBox}>
            {suggestions.map((s, i) => (
              <TouchableOpacity
                key={s.place_id}
                style={[styles.suggestionRow, i < suggestions.length - 1 && styles.suggestionRowBorder]}
                onPress={() => selectSuggestion(s)}
                activeOpacity={0.7}
              >
                <Ionicons name="location-outline" size={16} color={BrandColors.primary} />
                <Text style={styles.suggestionText} numberOfLines={2}>{s.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Map */}
        <MapView
          style={styles.map}
          region={
            location
              ? { latitude: location.lat, longitude: location.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }
              : { latitude: 40.7128, longitude: -74.006, latitudeDelta: 0.1, longitudeDelta: 0.1 }
          }
          scrollEnabled={false}
          zoomEnabled={false}
        >
          {location && (
            <Marker coordinate={{ latitude: location.lat, longitude: location.lng }} />
          )}
        </MapView>

        {/* ── Operating hours ────────────────────────────────────────────────── */}
        <View style={styles.hoursHeader}>
          <Ionicons name="time-outline" size={18} color={BrandColors.primary} />
          <Text style={styles.hoursTitle}>Operating Hours</Text>
        </View>

        <View style={styles.timeRow}>
          <View style={styles.timeField}>
            <Text style={styles.timeLabel}>Opening Time</Text>
            <TextInput
              style={styles.timeInput}
              placeholder="e.g. 09:00 AM"
              placeholderTextColor={BrandColors.textMuted}
              value={openingTime}
              onChangeText={setOpeningTime}
            />
          </View>
          <View style={styles.timeField}>
            <Text style={styles.timeLabel}>Closing Time</Text>
            <TextInput
              style={styles.timeInput}
              placeholder="e.g. 10:00 PM"
              placeholderTextColor={BrandColors.textMuted}
              value={closingTime}
              onChangeText={setClosingTime}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setApplyAllDays((v) => !v)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, applyAllDays && styles.checkboxChecked]}>
            {applyAllDays && <Ionicons name="checkmark" size={12} color={BrandColors.white} />}
          </View>
          <Text style={styles.checkboxLabel}>Apply to all weekdays</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xl }} />

        {/* ── Save button ────────────────────────────────────────────────────── */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Button label="Save & Continue" loading={saving} onPress={handleSave} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.background },
  scroll: { padding: Spacing.md },
  pageTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: 28,
    color: BrandColors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: 8,
  },
  pageSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: BrandColors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: BrandColors.textPrimary,
    marginBottom: 8,
  },
  // hero image
  heroUpload: {
    height: 160,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: BrandColors.divider,
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: 14,
  },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BrandColors.background,
  },
  heroUploadTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: BrandColors.primary,
  },
  heroUploadSub: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: BrandColors.textMuted,
  },
  heroEditOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // description
  fieldWrapper: { marginBottom: 14 },
  textAreaContainer: {
    backgroundColor: BrandColors.inputBg,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    minHeight: 110,
  },
  textArea: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: BrandColors.textPrimary,
    minHeight: 90,
  },
  // location search
  locationSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.inputBg,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1.5,
    borderColor: 'transparent',
    marginBottom: 4,
  },
  locationIcon: { marginRight: 10 },
  locationInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: BrandColors.textPrimary,
    paddingVertical: 0,
  },
  // autocomplete dropdown
  suggestionsBox: {
    backgroundColor: BrandColors.cardBg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BrandColors.divider,
    marginBottom: 8,
    shadowColor: BrandColors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  suggestionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.divider,
  },
  suggestionText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: BrandColors.textPrimary,
    lineHeight: 20,
  },
  // map
  map: {
    height: 180,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  // operating hours
  hoursHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  hoursTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: BrandColors.textPrimary,
  },
  timeRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.sm },
  timeField: { flex: 1 },
  timeLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: BrandColors.textSecondary,
    marginBottom: 6,
  },
  timeInput: {
    backgroundColor: BrandColors.inputBg,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    height: 48,
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: BrandColors.textPrimary,
    borderWidth: 1.5,
    borderColor: BrandColors.divider,
  },
  // checkbox
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.lg,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: BrandColors.divider,
    backgroundColor: BrandColors.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  checkboxLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: BrandColors.textPrimary,
  },
  footer: { gap: Spacing.sm },
});
