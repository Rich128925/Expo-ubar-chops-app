-- Add 'rejected' to the order_status constraint.
ALTER TABLE public.orders DROP CONSTRAINT orders_order_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_order_status_check
  CHECK (order_status IN ('pending', 'accepted', 'rejected', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'));

-- SECURITY DEFINER: lets a vendor update order_status on orders that belong to
-- their restaurant. Restricts allowed transitions so vendors can't set arbitrary statuses.
CREATE OR REPLACE FUNCTION public.update_order_status_vendor(
  p_order_id UUID,
  p_status   TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_status NOT IN ('accepted', 'rejected', 'preparing', 'ready', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;

  UPDATE public.orders
  SET order_status = p_status
  WHERE id            = p_order_id
    AND restaurant_id IN (
      SELECT id FROM public.restaurants WHERE vendor_id = auth.uid()
    );

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_order_status_vendor(UUID, TEXT) TO authenticated;
