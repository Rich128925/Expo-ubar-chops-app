import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrandColors, BorderRadius, FontFamily } from '@/constants/theme';

interface FormInputProps extends TextInputProps {
  label?: string;
  rightLabel?: string;
  onRightLabelPress?: () => void;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
  error?: string;
}

export default function FormInput({
  label,
  rightLabel,
  onRightLabelPress,
  leftIcon,
  isPassword,
  containerStyle,
  error,
  ...props
}: FormInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {(label || rightLabel) && (
        <View style={styles.labelRow}>
          {label ? <Text style={styles.label}>{label}</Text> : <View />}
          {rightLabel && (
            <TouchableOpacity onPress={onRightLabelPress} activeOpacity={0.7}>
              <Text style={styles.rightLabel}>{rightLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      <View style={[styles.inputContainer, !!error && styles.inputError]}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={18}
            color={BrandColors.iconColor}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          style={styles.input}
          placeholderTextColor={BrandColors.textMuted}
          secureTextEntry={isPassword && !showPassword}
          autoCorrect={false}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            style={styles.eyeButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={BrandColors.iconColor}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: BrandColors.textPrimary,
  },
  rightLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: BrandColors.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.inputBg,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: BrandColors.error,
  },
  leftIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: BrandColors.textPrimary,
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 4,
    marginLeft: 4,
  },
  errorText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: BrandColors.error,
    marginTop: 4,
  },
});
