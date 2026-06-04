
-- 1) user_roles: lock down writes to admins only
CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2) upvotes: restrict SELECT to authenticated users
DROP POLICY IF EXISTS "Upvotes viewable by everyone" ON public.upvotes;
CREATE POLICY "Upvotes viewable by authenticated"
  ON public.upvotes FOR SELECT
  TO authenticated
  USING (true);

-- 3) requests: prevent owners from editing tallies via column-level grants
REVOKE UPDATE ON public.requests FROM authenticated;
GRANT UPDATE (
  title, description, category, town, lat, lng, slug, business_id,
  business_kind, business_type_slug, brand_name, brand_website,
  radius_m, status, field_values, updated_at, id_short
) ON public.requests TO authenticated;

-- 4) Lock down SECURITY DEFINER functions from being exposed via PostgREST
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.increment_upvote_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_upvote_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
