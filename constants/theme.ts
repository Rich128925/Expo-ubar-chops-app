import { Platform } from 'react-native';

export const BrandColors = {
  primary: '#006D37',
  background: '#F6F6F6',
  cardBg: '#FFFFFF',
  inputBg: '#F6F6F6',
  textPrimary: '#000000',
  textSecondary: '#545454',
  textMuted: '#AAAAAA',
  iconColor: '#545454',
  white: '#FFFFFF',
  black: '#000000',
  neutral: '#545454',
  divider: '#E0E0E0',
  error: '#E53935',
  iconCircleBg: '#E8FFF3',
  riderBlue: '#2563EB',
  earningsBg: '#DCFCE7',
  earningsText: '#166534',
  mapBg: '#D8E4EC',
  mapGrid: '#C0CDD8',
  cancelledBg: '#FEE2E2',
  cancelledText: '#DC2626',
};

export const FontFamily = {
  regular: 'HankenGrotesk_400Regular',
  medium: 'HankenGrotesk_500Medium',
  semiBold: 'HankenGrotesk_600SemiBold',
  bold: 'HankenGrotesk_700Bold',
  extraBold: 'HankenGrotesk_800ExtraBold',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

// Legacy Colors kept for existing screens
const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
