CREATE TABLE public.dishes (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID       NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  price        NUMERIC(10,2) NOT NULL DEFAULT 0,
  category     TEXT        NOT NULL DEFAULT 'main',
  description  TEXT,
  image_url    TEXT,
  image_key    TEXT,
  available    BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;

-- Customers and guests can browse all dishes.
CREATE POLICY dishes_select_all ON public.dishes
  FOR SELECT USING (true);

-- Vendors can insert dishes for their own restaurant.
CREATE POLICY dishes_vendor_insert ON public.dishes
  FOR INSERT
  WITH CHECK (
    public.is_vendor()
    AND restaurant_id IN (
      SELECT id FROM public.restaurants WHERE vendor_id = auth.uid()
    )
  );

-- Vendors can update only their own dishes.
CREATE POLICY dishes_vendor_update ON public.dishes
  FOR UPDATE
  USING (
    public.is_vendor()
    AND restaurant_id IN (
      SELECT id FROM public.restaurants WHERE vendor_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_vendor()
    AND restaurant_id IN (
      SELECT id FROM public.restaurants WHERE vendor_id = auth.uid()
    )
  );

-- Vendors can delete only their own dishes.
CREATE POLICY dishes_vendor_delete ON public.dishes
  FOR DELETE
  USING (
    public.is_vendor()
    AND restaurant_id IN (
      SELECT id FROM public.restaurants WHERE vendor_id = auth.uid()
    )
  );
