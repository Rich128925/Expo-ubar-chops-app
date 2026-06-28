import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandColors, FontFamily } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const userType = (user?.profile?.userType as string) ?? 'customer';
  const isRider = userType === 'rider';
  const isVendor = userType === 'vendor';
  const tabBarHeight = 56 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BrandColors.primary,
        tabBarInactiveTintColor: BrandColors.textMuted,
        tabBarLabelStyle: {
          fontFamily: FontFamily.medium,
          fontSize: 11,
        },
        tabBarStyle: {
          backgroundColor: BrandColors.cardBg,
          borderTopColor: BrandColors.divider,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: insets.bottom + 4,
          paddingTop: 6,
        },
      }}
    >
      {/* ── Customer / Rider tabs ─────────────────────────────────────────── */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          href: isVendor ? null : undefined,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          href: isRider || isVendor ? null : undefined,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          href: isVendor ? null : undefined,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={24} color={color} />
          ),
        }}
      />

      {/* ── Vendor tabs ───────────────────────────────────────────────────── */}
      <Tabs.Screen
        name="vendor-orders"
        options={{
          title: 'Orders',
          href: !isVendor ? null : undefined,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'list' : 'list-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vendor-history"
        options={{
          title: 'History',
          href: !isVendor ? null : undefined,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'time' : 'time-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vendor-dishes"
        options={{
          title: 'Dishes',
          href: !isVendor ? null : undefined,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'restaurant' : 'restaurant-outline'} size={24} color={color} />
          ),
        }}
      />

      {/* ── Shared tab ────────────────────────────────────────────────────── */}
      <Tabs.Screen
        name="account"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
