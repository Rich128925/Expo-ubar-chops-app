import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/context/AuthContext';

const LOCATION_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export interface RiderRow {
  id: string;
  user_id: string;
  is_online: boolean;
  latitude: number | null;
  longitude: number | null;
  updated_at: string;
}

export function useRider() {
  const { user } = useAuth();
  const [rider, setRider] = useState<RiderRow | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Upsert the rider row and fetch current state.
  const upsertRider = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await insforge.database
      .from('riders')
      .upsert([{ user_id: user.id }], { onConflict: 'user_id' })
      .select()
      .single();
    if (!error && data) setRider(data as RiderRow);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    upsertRider();
  }, [upsertRider]);

  // Push current GPS position to the riders table.
  const pushLocation = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      await insforge.database
        .from('riders')
        .update({ latitude, longitude, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      setRider((prev) => prev ? { ...prev, latitude, longitude } : prev);
    } catch {
      // silent — location may be unavailable
    }
  }, [user?.id]);

  // Start 5-minute location interval once rider row exists.
  useEffect(() => {
    if (!rider) return;
    pushLocation(); // send immediately on mount
    intervalRef.current = setInterval(pushLocation, LOCATION_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [!!rider]); // eslint-disable-line react-hooks/exhaustive-deps

  const setOnline = useCallback(
    async (online: boolean) => {
      if (!user?.id) return;
      const { error } = await insforge.database
        .from('riders')
        .update({ is_online: online, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      if (!error) setRider((prev) => prev ? { ...prev, is_online: online } : prev);
    },
    [user?.id]
  );

  const toggleOnline = useCallback(() => {
    const next = !(rider?.is_online ?? false);
    setOnline(next);
  }, [rider?.is_online, setOnline]);

  return { rider, loading, isOnline: rider?.is_online ?? false, toggleOnline, setOnline, pushLocation };
}
