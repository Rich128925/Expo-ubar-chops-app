import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { BrandColors, BorderRadius, FontFamily } from '@/constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'inverted' | 'outlined';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: BrandColors.primary },
    text: { color: BrandColors.white },
  },
  secondary: {
    container: { backgroundColor: BrandColors.background },
    text: { color: BrandColors.black },
  },
  inverted: {
    container: { backgroundColor: BrandColors.black },
    text: { color: BrandColors.white },
  },
  outlined: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: BrandColors.black,
    },
    text: { color: BrandColors.black },
  },
};

export default function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  rightIcon,
  style,
  textStyle,
}: ButtonProps) {
  const vs = variantStyles[variant];

  return (
    <TouchableOpacity
      style={[styles.button, vs.container, (disabled || loading) && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outlined' || variant === 'secondary' ? BrandColors.black : BrandColors.white} />
      ) : (
        <View style={styles.content}>
          <Text style={[styles.label, vs.text, textStyle]}>{label}</Text>
          {rightIcon}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.md,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  disabled: {
    opacity: 0.45,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    letterSpacing: 0.1,
  },
});
