-- ── 1. Rider marks their delivery as complete ────────────────────────────────
CREATE OR REPLACE FUNCTION public.complete_delivery(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders
  SET order_status = 'delivered'
  WHERE id             = p_order_id
    AND rider_assigned = auth.uid()
    AND order_status   = 'delivering';
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_delivery(UUID) TO authenticated;

-- ── 2. Per-order realtime channel ────────────────────────────────────────────
INSERT INTO realtime.channels (pattern, description, enabled)
VALUES ('order:%', 'Per-order status events for customers', true)
ON CONFLICT (pattern) DO NOTHING;

-- ── 3. Publish order_status changes to the per-order channel ─────────────────
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM realtime.publish(
    'order:' || NEW.id::text,
    'order_status_changed',
    jsonb_build_object(
      'id',           NEW.id,
      'order_status', NEW.order_status,
      'rider_assigned', NEW.rider_assigned
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_order_status_realtime
  AFTER UPDATE OF order_status ON public.orders
  FOR EACH ROW
  WHEN (OLD.order_status IS DISTINCT FROM NEW.order_status)
  EXECUTE FUNCTION public.notify_order_status_change();
