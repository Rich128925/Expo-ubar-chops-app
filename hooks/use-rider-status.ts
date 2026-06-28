import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '@/context/AuthContext';

export function useRiderStatus() {
  const { user } = useAuth();
  const [isOnline, setIsOnlineState] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    SecureStore.getItemAsync(`rider_status_${user.id}`)
      .then((val) => { if (val !== null) setIsOnlineState(val === 'true'); })
      .catch(() => {});
  }, [user?.id]);

  const toggleOnline = useCallback(async () => {
    const next = !isOnline;
    if (user?.id) {
      SecureStore.setItemAsync(`rider_status_${user.id}`, String(next)).catch(() => {});
    }
    setIsOnlineState(next);
  }, [user?.id, isOnline]);

  return { isOnline, toggleOnline };
}
