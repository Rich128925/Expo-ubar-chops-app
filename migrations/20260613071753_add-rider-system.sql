-- ── 1. Riders table ──────────────────────────────────────────────────────────
CREATE TABLE public.riders (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  is_online  BOOLEAN     NOT NULL DEFAULT false,
  latitude   DOUBLE PRECISION,
  longitude  DOUBLE PRECISION,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;

-- Riders manage their own row only.
CREATE POLICY riders_self ON public.riders
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── 2. Add rider_assigned column to orders ───────────────────────────────────
ALTER TABLE public.orders
  ADD COLUMN rider_assigned UUID REFERENCES auth.users(id);

-- ── 3. Orders RLS: riders see accepted+unassigned orders or their own delivery ─
-- Available orders: accepted, unassigned, paid — visible to all authenticated users.
CREATE POLICY orders_rider_available ON public.orders
  FOR SELECT USING (
    payment_status = 'successful'
    AND order_status = 'accepted'
    AND rider_assigned IS NULL
  );

-- Assigned orders: a rider can always see an order assigned to them.
CREATE POLICY orders_rider_assigned ON public.orders
  FOR SELECT USING (
    rider_assigned = auth.uid()
  );

-- ── 4. SECURITY DEFINER: atomically claim an order ──────────────────────────
-- Sets rider_assigned + order_status = 'delivering' only if still unclaimed.
CREATE OR REPLACE FUNCTION public.accept_delivery(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders
  SET rider_assigned = auth.uid(),
      order_status   = 'delivering'
  WHERE id            = p_order_id
    AND rider_assigned IS NULL
    AND order_status   = 'accepted';
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_delivery(UUID) TO authenticated;

-- ── 5. Realtime channel for available orders ─────────────────────────────────
INSERT INTO realtime.channels (pattern, description, enabled)
VALUES ('rider:available-orders', 'Available orders broadcast to online riders', true)
ON CONFLICT (pattern) DO NOTHING;

-- ── 6. Trigger: broadcast when vendor accepts an order ────────────────────────
CREATE OR REPLACE FUNCTION public.notify_rider_available_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.order_status = 'accepted'
     AND NEW.rider_assigned IS NULL
     AND NEW.payment_status = 'successful'
  THEN
    PERFORM realtime.publish(
      'rider:available-orders',
      'order_available',
      jsonb_build_object(
        'id',               NEW.id,
        'restaurant_id',    NEW.restaurant_id,
        'total',            NEW.total,
        'items',            NEW.items,
        'delivery_address', NEW.delivery_address,
        'created_at',       NEW.created_at
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_rider_available_order
  AFTER UPDATE OF order_status ON public.orders
  FOR EACH ROW
  WHEN (OLD.order_status IS DISTINCT FROM NEW.order_status)
  EXECUTE FUNCTION public.notify_rider_available_order();
