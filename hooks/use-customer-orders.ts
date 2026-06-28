import { useCallback, useEffect, useState } from 'react';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/context/AuthContext';

export interface CustomerOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface CustomerOrder {
  id: string;
  restaurant_id: string;
  items: CustomerOrderItem[];
  subtotal: number;
  delivery_fee: number;
  service_fee: number;
  total: number;
  order_status: string;
  payment_status: string;
  delivery_address: string | null;
  created_at: string;
  restaurant: {
    name: string;
    image_url: string | null;
    address: string;
    latitude: number | null;
    longitude: number | null;
  } | null;
}

export function useCustomerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await insforge.database
      .from('orders')
      .select('*, restaurant:restaurants(name, image_url, address, latitude, longitude)')
      .eq('customer_id', user.id)
      .eq('payment_status', 'successful')
      .order('created_at', { ascending: false });

    if (!error && data) setOrders(data as CustomerOrder[]);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, refetch: fetchOrders };
}

export function useCustomerOrder(orderId: string) {
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    const { data, error } = await insforge.database
      .from('orders')
      .select('*, restaurant:restaurants(name, image_url, address, latitude, longitude)')
      .eq('id', orderId)
      .single();

    if (!error && data) setOrder(data as CustomerOrder);
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return { order, loading, refetch: fetchOrder };
}
