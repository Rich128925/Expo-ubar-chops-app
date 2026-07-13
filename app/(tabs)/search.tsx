import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, FontFamily, Spacing } from '@/constants/theme';

export default function SearchScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.center}>
        <Text style={styles.text}>Search</Text>
        <Text style={styles.sub}>Coming soon</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: BrandColors.background 
  },

  center: {
     flex: 1, 
     justifyContent: 'center', 
     alignItems: 'center', 
     paddingHorizontal: Spacing.xl 
    },

  text: { 
    fontFamily: FontFamily.extraBold, 
    fontSize: 24, 
    color: BrandColors.textPrimary, 
    marginBottom: 6 
  },

  sub:  { 
    fontFamily: FontFamily.regular, 
    fontSize: 14, 
    color: BrandColors.textSecondary 
  },
});
