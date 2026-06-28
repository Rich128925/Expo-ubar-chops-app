import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BrandColors, FontFamily } from '@/constants/theme';

interface DividerProps {
  label?: string;
}

export default function Divider({ label }: DividerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: BrandColors.divider,
  },
  label: {
    fontFamily: FontFamily.medium,
    marginHorizontal: 14,
    fontSize: 12,
    color: BrandColors.textMuted,
    letterSpacing: 0.5,
  },
});
