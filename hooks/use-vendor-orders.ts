import { useCallback, useEffect, useRef, useState } from 'react';
import { insforge } from '@/lib/insforge';
import { useRestaurant } from '@/context/RestaurantContext';

export interface VendorOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface VendorOrder {
  id: string;
  customer_id: string;
  items: VendorOrderItem[];
  subtotal: number;
  delivery_fee: number;
  service_fee: number;
  total: number;
  order_status: string;
  payment_status: string;
  delivery_address: string | null;
  created_at: string;
}

export function useVendorOrders() {
  const { restaurant } = useRestaurant();
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const connectedRef = useRef(false);

  const fetchOrders = useCallback(async () => {
    if (!restaurant?.id) return;
    setLoading(true);
    const { data, error } = await insforge.database
      .from('orders')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('payment_status', 'successful')
      .order('created_at', { ascending: false });

    if (!error && data) setOrders(data as VendorOrder[]);
    setLoading(false);
  }, [restaurant?.id]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Realtime: subscribe to new orders for this restaurant.
  useEffect(() => {
    if (!restaurant?.id || connectedRef.current) return;

    let mounted = true;
    const channel = `vendor:${restaurant.id}`;

    (async () => {
      try {
        await insforge.realtime.connect();
        const res = await insforge.realtime.subscribe(channel);
        if (!res.ok || !mounted) return;
        connectedRef.current = true;

        insforge.realtime.on('new_order', (payload: { id: string }) => {
          if (!mounted) return;
          insforge.database
            .from('orders')
            .select('*')
            .eq('id', payload.id)
            .single()
            .then(({ data }) => {
              if (data && mounted) {
                setOrders((prev) => {
                  const exists = prev.some((o) => o.id === data.id);
                  return exists ? prev : [data as VendorOrder, ...prev];
                });
              }
            });
        });
      } catch {
        // realtime unavailable — fall back to pull-to-refresh
      }
    })();

    return () => {
      mounted = false;
      try { insforge.realtime.unsubscribe(channel); } catch { /* ignore */ }
      connectedRef.current = false;
    };
  }, [restaurant?.id]);

  const updateOrderStatus = useCallback(
    async (orderId: string, status: 'accepted' | 'rejected') => {
      const { error } = await insforge.database.rpc('update_order_status_vendor', {
        p_order_id: orderId,
        p_status: status,
      });
      if (!error) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, order_status: status } : o))
        );
      }
      return { error };
    },
    []
  );

  return { orders, loading, refetch: fetchOrders, updateOrderStatus };
}
