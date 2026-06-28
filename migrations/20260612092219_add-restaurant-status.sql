-- Add status column: pending (default) → accepted | rejected
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'accepted', 'rejected'));

-- Helper: check if the current authenticated user is an admin.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT COALESCE((profile->>'userType') = 'admin', false)
  FROM auth.users
  WHERE id = auth.uid()
$$;

-- Admins can update any restaurant row (needed to flip status).
DROP POLICY IF EXISTS admin_update_any ON public.restaurants;
CREATE POLICY admin_update_any ON public.restaurants
  FOR UPDATE
  USING  (public.is_admin())
  WITH CHECK (public.is_admin());

-- Trigger: block non-admin users from changing the status field.
CREATE OR REPLACE FUNCTION public.restrict_restaurant_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_admin() AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Only admins can change restaurant status';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_restaurant_status_change ON public.restaurants;
CREATE TRIGGER enforce_restaurant_status_change
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.restrict_restaurant_status_change();
