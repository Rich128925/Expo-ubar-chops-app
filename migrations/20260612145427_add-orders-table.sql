CREATE TABLE public.orders (
  id                       UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id              UUID          NOT NULL REFERENCES auth.users(id),
  restaurant_id            UUID          NOT NULL REFERENCES public.restaurants(id),
  items                    JSONB         NOT NULL DEFAULT '[]',
  subtotal                 NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee             NUMERIC(10,2) NOT NULL DEFAULT 0,
  service_fee              NUMERIC(10,2) NOT NULL DEFAULT 0,
  total                    NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_status           TEXT          NOT NULL DEFAULT 'unconfirmed'
                             CHECK (payment_status IN ('unconfirmed', 'successful', 'failed')),
  order_status             TEXT          NOT NULL DEFAULT 'pending'
                             CHECK (order_status IN ('pending', 'accepted', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled')),
  stripe_payment_intent_id TEXT,
  delivery_address         TEXT,
  created_at               TIMESTAMPTZ   NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Customers can view and insert their own orders.
CREATE POLICY orders_customer_select ON public.orders
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY orders_customer_insert ON public.orders
  FOR INSERT WITH CHECK (customer_id = auth.uid());

-- Vendors can view orders placed at their restaurant.
CREATE POLICY orders_vendor_select ON public.orders
  FOR SELECT USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE vendor_id = auth.uid()
    )
  );

-- SECURITY DEFINER: updates payment_status to 'successful' only after verifying
-- the caller owns the order and the payment_intent_id matches what was recorded
-- during order creation. auth.uid() still resolves to the calling user despite
-- SECURITY DEFINER because it reads from the session JWT, not the role.
CREATE OR REPLACE FUNCTION public.confirm_order_payment(
  p_order_id          UUID,
  p_payment_intent_id TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders
  SET payment_status = 'successful'
  WHERE id                       = p_order_id
    AND stripe_payment_intent_id = p_payment_intent_id
    AND customer_id              = auth.uid()
    AND payment_status           = 'unconfirmed';
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_order_payment(UUID, TEXT) TO authenticated;