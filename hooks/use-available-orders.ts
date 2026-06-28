import { useCallback, useEffect, useRef, useState } from 'react';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/context/AuthContext';

export interface AvailableOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface AvailableOrder {
  id: string;
  restaurant_id: string;
  items: AvailableOrderItem[];
  total: number;
  delivery_address: string | null;
  order_status: string;
  rider_assigned: string | null;
  created_at: string;
  restaurant: {
    name: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    image_url: string | null;
  } | null;
}

export function useAvailableOrders(isOnline: boolean) {
  const { user } = useAuth();
  const [available, setAvailable] = useState<AvailableOrder[]>([]);
  const [activeOrder, setActiveOrder] = useState<AvailableOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const connectedRef = useRef(false);

  const fetchOrders = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    // Fetch available (unassigned, accepted) orders.
    const { data: avail } = await insforge.database
      .from('orders')
      .select('*, restaurant:restaurants(name, address, latitude, longitude, image_url)')
      .eq('payment_status', 'successful')
      .eq('order_status', 'accepted')
      .is('rider_assigned', null)
      .order('created_at', { ascending: false });

    if (avail) setAvailable(avail as AvailableOrder[]);

    // Fetch this rider's active delivery (assigned to them, in-flight).
    const { data: active } = await insforge.database
      .from('orders')
      .select('*, restaurant:restaurants(name, address, latitude, longitude, image_url)')
      .eq('rider_assigned', user.id)
      .eq('order_status', 'delivering')
      .limit(1)
      .single();

    setActiveOrder(active ? (active as AvailableOrder) : null);
    setLoading(false);
  }, [user?.id]);

  // Realtime: subscribe to rider:available-orders channel.
  useEffect(() => {
    if (!isOnline || connectedRef.current) return;

    let mounted = true;
    (async () => {
      try {
        await insforge.realtime.connect();
        const res = await insforge.realtime.subscribe('rider:available-orders');
        if (!res.ok || !mounted) return;
        connectedRef.current = true;

        insforge.realtime.on('order_available', (payload: AvailableOrder) => {
          if (!mounted) return;
          // Fetch full order with restaurant join, then prepend to list.
          insforge.database
            .from('orders')
            .select('*, restaurant:restaurants(name, address, latitude, longitude, image_url)')
            .eq('id', payload.id)
            .single()
            .then(({ data }) => {
              if (data && mounted) {
                setAvailable((prev) => {
                  const exists = prev.some((o) => o.id === data.id);
                  return exists ? prev : [data as AvailableOrder, ...prev];
                });
              }
            });
        });
      } catch {
        // realtime unavailable — fall back to polling
      }
    })();

    return () => {
      mounted = false;
      try { insforge.realtime.unsubscribe('rider:available-orders'); } catch { /* ignore */ }
      connectedRef.current = false;
    };
  }, [isOnline]);

  // Initial fetch whenever online state changes.
  useEffect(() => {
    if (isOnline) fetchOrders();
    else { setAvailable([]); setActiveOrder(null); }
  }, [isOnline, fetchOrders]);

  const acceptOrder = useCallback(
    async (orderId: string): Promise<{ error: string | null }> => {
      const { data: claimed, error } = await insforge.database.rpc('accept_delivery', {
        p_order_id: orderId,
      });
      if (error) return { error: error.message };
      if (!claimed) return { error: 'Order was already taken by another rider.' };

      // Remove from available list and set as active.
      setAvailable((prev) => prev.filter((o) => o.id !== orderId));

      // Re-fetch the full order to set as active.
      const { data: full } = await insforge.database
        .from('orders')
        .select('*, restaurant:restaurants(name, address, latitude, longitude, image_url)')
        .eq('id', orderId)
        .single();
      if (full) setActiveOrder(full as AvailableOrder);

      return { error: null };
    },
    []
  );

  return { available, activeOrder, loading, refetch: fetchOrders, acceptOrder };
}
