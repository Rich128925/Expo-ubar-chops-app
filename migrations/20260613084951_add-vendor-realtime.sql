-- ── 1. Per-restaurant realtime channel ───────────────────────────────────────
INSERT INTO realtime.channels (pattern, description, enabled)
VALUES ('vendor:%', 'New order notifications per restaurant', true)
ON CONFLICT (pattern) DO NOTHING;

-- ── 2. Publish to vendor channel when payment is confirmed ────────────────────
CREATE OR REPLACE FUNCTION public.notify_vendor_new_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.payment_status = 'successful'
     AND (OLD.payment_status IS DISTINCT FROM 'successful') THEN
    PERFORM realtime.publish(
      'vendor:' || NEW.restaurant_id::text,
      'new_order',
      jsonb_build_object(
        'id',               NEW.id,
        'total',            NEW.total,
        'order_status',     NEW.order_status,
        'items',            NEW.items,
        'delivery_address', NEW.delivery_address,
        'created_at',       NEW.created_at
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_vendor_new_order
  AFTER UPDATE OF payment_status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_vendor_new_order();
