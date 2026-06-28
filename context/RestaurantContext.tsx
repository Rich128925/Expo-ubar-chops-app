import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { insforge } from '@/lib/insforge';

export interface Restaurant {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  image_key: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  opening_time: string | null;
  closing_time: string | null;
  is_open: boolean;
  status: 'pending' | 'accepted' | 'rejected';
}

interface RestaurantContextValue {
  restaurant: Restaurant | null;
  loading: boolean;
  toggleOpen: () => Promise<void>;
  refetch: () => Promise<void>;
}

const RestaurantContext = createContext<RestaurantContextValue | null>(null);

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRestaurant = useCallback(async () => {
    const userType = (user?.profile?.userType as string) ?? '';
    if (!user?.id || userType !== 'vendor') {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await insforge.database
      .from('restaurants')
      .select()
      .eq('vendor_id', user.id)
      .maybeSingle();
    setRestaurant((data as Restaurant) ?? null);
    setLoading(false);
  }, [user?.id, user?.profile?.userType]);

  useEffect(() => { fetchRestaurant(); }, [fetchRestaurant]);

  const toggleOpen = useCallback(async () => {
    if (!restaurant || !user?.id) return;
    const next = !restaurant.is_open;
    setRestaurant((prev) => (prev ? { ...prev, is_open: next } : null));
    await insforge.database
      .from('restaurants')
      .update({ is_open: next })
      .eq('vendor_id', user.id);
  }, [restaurant, user?.id]);

  return (
    <RestaurantContext.Provider value={{ restaurant, loading, toggleOpen, refetch: fetchRestaurant }}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const ctx = useContext(RestaurantContext);
  if (!ctx) throw new Error('useRestaurant must be used within RestaurantProvider');
  return ctx;
}
