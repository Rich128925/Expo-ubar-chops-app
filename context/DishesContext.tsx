import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRestaurant } from './RestaurantContext';
import { insforge } from '@/lib/insforge';

export interface Dish {
  id: string;
  restaurant_id: string;
  name: string;
  price: number;
  available: boolean;
  category: string;
  description: string | null;
  image_url: string | null;
  image_key: string | null;
}

interface DishesContextValue {
  dishes: Dish[];
  loading: boolean;
  addDish: (dish: Omit<Dish, 'id' | 'restaurant_id'>) => Promise<void>;
  toggleAvailability: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

const DishesContext = createContext<DishesContextValue | null>(null);

export function DishesProvider({ children }: { children: ReactNode }) {
  const { restaurant } = useRestaurant();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDishes = useCallback(async () => {
    if (!restaurant?.id) {
      setDishes([]);
      return;
    }
    setLoading(true);
    const { data, error } = await insforge.database
      .from('dishes')
      .select()
      .eq('restaurant_id', restaurant.id)
      .order('created_at', { ascending: true });
    if (!error && data) setDishes(data as Dish[]);
    setLoading(false);
  }, [restaurant?.id]);

  useEffect(() => { fetchDishes(); }, [fetchDishes]);

  const addDish = useCallback(async (dish: Omit<Dish, 'id' | 'restaurant_id'>) => {
    if (!restaurant?.id) throw new Error('No restaurant found');
    const { data, error } = await insforge.database
      .from('dishes')
      .insert([{ ...dish, restaurant_id: restaurant.id }]);
    if (error) throw error;
    console.log('[dishes] insert result:', JSON.stringify({ data, error: null }));
    await fetchDishes();
  }, [restaurant?.id, fetchDishes]);

  const toggleAvailability = useCallback(async (id: string) => {
    const dish = dishes.find((d) => d.id === id);
    if (!dish) return;
    const next = !dish.available;
    setDishes((prev) => prev.map((d) => (d.id === id ? { ...d, available: next } : d)));
    const { error } = await insforge.database
      .from('dishes')
      .update({ available: next })
      .eq('id', id);
    if (error) {
      console.error('[dishes] toggleAvailability error:', error.message);
      setDishes((prev) => prev.map((d) => (d.id === id ? { ...d, available: !next } : d)));
    }
  }, [dishes]);

  return (
    <DishesContext.Provider value={{ dishes, loading, addDish, toggleAvailability, refetch: fetchDishes }}>
      {children}
    </DishesContext.Provider>
  );
}

export function useDishes() {
  const ctx = useContext(DishesContext);
  if (!ctx) throw new Error('useDishes must be used within DishesProvider');
  return ctx;
}
