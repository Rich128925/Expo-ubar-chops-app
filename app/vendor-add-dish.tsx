import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { BrandColors, FontFamily, Spacing, BorderRadius } from '@/constants/theme';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';
import { useDishes } from '@/context/DishesContext';
import { useAuth } from '@/context/AuthContext';
import { uploadImageFromUri } from '@/lib/uploadImage';

const CATEGORIES = ['Mains', 'Sides', 'Beverages', 'Desserts'] as const;
type DishCategory = typeof CATEGORIES[number];

const CATEGORY_MAP: Record<DishCategory, string> = {
  'Mains': 'main',
  'Sides': 'sides',
  'Beverages': 'beverages',
  'Desserts': 'desserts',
};

export default function VendorAddDishScreen() {
  const insets = useSafeAreaInsets();
  const { refreshAuth } = useAuth();
  const { addDish } = useDishes();

  const [dishName, setDishName] = useState('');
  const [price, setPrice] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DishCategory | null>(null);
  const [description, setDescription] = useState('');
  const [imageAsset, setImageAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos to upload a dish image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as ImagePicker.MediaType,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) setImageAsset(result.assets[0]);
  };

  const handleSave = async () => {
    if (!dishName.trim()) {
      Alert.alert('Required', 'Please enter a dish name.');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Required', 'Please select a category.');
      return;
    }

    setSaving(true);
    try {
      const { error: refreshError, accessToken: freshToken } = await refreshAuth();
      console.log('[add-dish] session refresh:', refreshError ?? 'ok');
      if (refreshError || !freshToken) throw new Error(refreshError ?? 'No access token');

      let imageUrl: string | null = null;
      let imageKey: string | null = null;

      if (imageAsset) {
        const fileName = imageAsset.fileName ?? `dish-${Date.now()}.jpg`;
        const mimeType = imageAsset.mimeType ?? 'image/jpeg';
        console.log('[add-dish] uploading image:', fileName, mimeType, imageAsset.fileSize);
        const { url, key } = await uploadImageFromUri(
          imageAsset.uri,
          fileName,
          mimeType,
          imageAsset.fileSize,
          freshToken,
          'restaurant-images',
        );
        console.log('[add-dish] upload result: url=', url, 'key=', key);
        imageUrl = url;
        imageKey = key;
      }

      const dish = {
        name: dishName.trim(),
        price: parseFloat(price) || 0,
        available: true,
        category: CATEGORY_MAP[selectedCategory],
        description: description.trim() || null,
        image_url: imageUrl,
        image_key: imageKey,
      };
      console.log('[add-dish] saving dish:', JSON.stringify(dish));
      await addDish(dish);
      console.log('[add-dish] dish saved successfully');

      router.back();
    } catch (e: any) {
      console.error('[add-dish] error:', e?.message ?? e);
      Alert.alert('Error', e?.message ?? 'Failed to save dish. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={BrandColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Dish</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo upload */}
        <Text style={styles.fieldLabel}>Dish Photo</Text>
        <TouchableOpacity style={styles.photoUpload} onPress={pickImage} activeOpacity={0.8}>
          {imageAsset ? (
            <Image source={{ uri: imageAsset.uri }} style={styles.photoPreview} resizeMode="cover" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={36} color={BrandColors.primary} />
              <Text style={styles.photoUploadTitle}>Upload high-quality image</Text>
              <Text style={styles.photoUploadSub}>Recommended: 4:3 ratio, JPG/PNG</Text>
            </>
          )}
          {imageAsset && (
            <View style={styles.photoEditOverlay}>
              <Ionicons name="pencil" size={16} color={BrandColors.white} />
            </View>
          )}
        </TouchableOpacity>

        {/* Dish Name */}
        <FormInput
          label="Dish Name"
          placeholder="e.g., Truffle Mushroom Risotto"
          value={dishName}
          onChangeText={setDishName}
          autoCapitalize="words"
          returnKeyType="next"
        />

        {/* Price */}
        <View style={styles.priceWrapper}>
          <Text style={styles.fieldLabel}>Price</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="0.00"
              placeholderTextColor={BrandColors.textMuted}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              returnKeyType="next"
            />
          </View>
        </View>

        {/* Category */}
        <Text style={styles.fieldLabel}>Category</Text>
        <View style={styles.categoryRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === cat && styles.categoryChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Description */}
        <View style={styles.descWrapper}>
          <Text style={styles.fieldLabel}>Description</Text>
          <View style={styles.descContainer}>
            <TextInput
              style={styles.descInput}
              placeholder="Describe the flavors and ingredients..."
              placeholderTextColor={BrandColors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save button footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          label="Save Dish"
          loading={saving}
          rightIcon={<Ionicons name="save-outline" size={18} color={BrandColors.white} />}
          onPress={handleSave}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.background },
  // header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: BrandColors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.divider,
  },
  backBtn: { padding: Spacing.xs, marginRight: 8 },
  headerTitle: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: BrandColors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: { width: 38 },
  // scroll
  scroll: { padding: Spacing.md },
  fieldLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: BrandColors.textPrimary,
    marginBottom: 8,
  },
  // photo upload
  photoUpload: {
    height: 160,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: BrandColors.divider,
    borderStyle: 'dashed',
    backgroundColor: BrandColors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoEditOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoUploadTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: BrandColors.textPrimary,
  },
  photoUploadSub: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: BrandColors.textMuted,
  },
  // price
  priceWrapper: { marginBottom: 14 },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.inputBg,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  currencySymbol: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    color: BrandColors.textSecondary,
    marginRight: 6,
  },
  priceInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: BrandColors.textPrimary,
    paddingVertical: 0,
  },
  // categories
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: 14,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: BrandColors.inputBg,
    borderWidth: 1.5,
    borderColor: BrandColors.divider,
  },
  categoryChipActive: {
    backgroundColor: BrandColors.earningsBg,
    borderColor: BrandColors.primary,
  },
  categoryChipText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: BrandColors.textSecondary,
  },
  categoryChipTextActive: {
    color: BrandColors.primary,
    fontFamily: FontFamily.semiBold,
  },
  // description
  descWrapper: { marginBottom: 14 },
  descContainer: {
    backgroundColor: BrandColors.inputBg,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    minHeight: 110,
  },
  descInput: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: BrandColors.textPrimary,
    minHeight: 90,
  },
  // footer
  footer: {
    backgroundColor: BrandColors.cardBg,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: BrandColors.divider,
  },
});
