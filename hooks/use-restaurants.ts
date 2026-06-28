import { useCallback, useEffect, useState } from 'react';
import { insforge } from '@/lib/insforge';

export interface PublicRestaurant {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  address: string;
  opening_time: string | null;
  closing_time: string | null;
  is_open: boolean;
}

export function useRestaurants() {
  const [restaurants, setRestaurants] = useState<PublicRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await insforge.database
      .from('restaurants')
      .select()
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });
    if (!error && data) setRestaurants(data as PublicRestaurant[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { restaurants, loading, refetch: load };
}
