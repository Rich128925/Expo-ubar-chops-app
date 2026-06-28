import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '@/context/AuthContext';

export interface SavedAddress {
  text: string;
  latitude: number | null;
  longitude: number | null;
}

const addressKey = (uid: string) => `address_${uid}`;
const latKey = (uid: string) => `address_lat_${uid}`;
const lngKey = (uid: string) => `address_lng_${uid}`;

export function useAddress() {
  const { user } = useAuth();
  const [address, setAddress] = useState<string | null>(null);
  const [addressCoords, setAddressCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    Promise.all([
      SecureStore.getItemAsync(addressKey(user.id)),
      SecureStore.getItemAsync(latKey(user.id)),
      SecureStore.getItemAsync(lngKey(user.id)),
    ])
      .then(([addr, lat, lng]) => {
        setAddress(addr);
        if (lat && lng) setAddressCoords({ latitude: parseFloat(lat), longitude: parseFloat(lng) });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const saveAddress = useCallback(
    async (text: string, coords?: { latitude: number; longitude: number }) => {
      if (!user?.id) return;
      await SecureStore.setItemAsync(addressKey(user.id), text);
      setAddress(text);
      if (coords) {
        await Promise.all([
          SecureStore.setItemAsync(latKey(user.id), String(coords.latitude)),
          SecureStore.setItemAsync(lngKey(user.id), String(coords.longitude)),
        ]);
        setAddressCoords(coords);
      }
    },
    [user?.id]
  );

  return { address, addressCoords, loading, saveAddress };
}
