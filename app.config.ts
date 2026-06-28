import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const googleMapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_APIKEY ?? '';

  return {
    ...config,
    name: config.name ?? 'uber-chops',
    slug: config.slug ?? 'uber-chops',
    android: {
      ...config.android,
      config: {
        googleMaps: { apiKey: googleMapsKey },
      },
    },
    plugins: [
      ...(Array.isArray(config.plugins) ? config.plugins : []),
      ['expo-image-picker', { photosPermission: 'Allow $(PRODUCT_NAME) to access your photos to upload restaurant images.' }],
    ],
  };
};
