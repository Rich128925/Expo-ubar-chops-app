-- Helper: check if the current authenticated user is a vendor.
-- SECURITY DEFINER so it can read auth.users without triggering RLS on that table.
CREATE OR REPLACE FUNCTION public.is_vendor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT COALESCE((profile->>'userType') = 'vendor', false)
  FROM auth.users
  WHERE id = auth.uid()
$$;

-- ── Restaurants RLS ───────────────────────────────────────────────────────────

-- Anyone (authenticated or not) can read restaurants.
DROP POLICY IF EXISTS vendor_select_own ON public.restaurants;
CREATE POLICY select_all ON public.restaurants
  FOR SELECT USING (true);

-- Only verified vendors can insert; they must own the row they create.
DROP POLICY IF EXISTS vendor_insert_own ON public.restaurants;
CREATE POLICY vendor_insert_own ON public.restaurants
  FOR INSERT
  WITH CHECK (vendor_id = auth.uid() AND public.is_vendor());

-- Vendors can only update their own restaurants.
DROP POLICY IF EXISTS vendor_update_own ON public.restaurants;
CREATE POLICY vendor_update_own ON public.restaurants
  FOR UPDATE
  USING  (vendor_id = auth.uid() AND public.is_vendor())
  WITH CHECK (vendor_id = auth.uid() AND public.is_vendor());

-- ── Storage: restaurant-images bucket ────────────────────────────────────────

-- Public read.
DROP POLICY IF EXISTS "restaurant_images_public_select" ON storage.objects;
CREATE POLICY "restaurant_images_public_select" ON storage.objects
  FOR SELECT USING (bucket = 'restaurant-images');

-- Only vendors can upload.
DROP POLICY IF EXISTS "restaurant_images_vendor_insert" ON storage.objects;
CREATE POLICY "restaurant_images_vendor_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket = 'restaurant-images'
    AND public.is_vendor()
  );

-- Vendors can replace or delete only their own uploads.
DROP POLICY IF EXISTS "restaurant_images_vendor_update" ON storage.objects;
CREATE POLICY "restaurant_images_vendor_update" ON storage.objects
  FOR UPDATE USING (
    bucket = 'restaurant-images'
    AND uploaded_by = auth.uid()::text
    AND public.is_vendor()
  );

DROP POLICY IF EXISTS "restaurant_images_vendor_delete" ON storage.objects;
CREATE POLICY "restaurant_images_vendor_delete" ON storage.objects
  FOR DELETE USING (
    bucket = 'restaurant-images'
    AND uploaded_by = auth.uid()::text
    AND public.is_vendor()
  );
