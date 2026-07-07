
-- Fix: Allow unsigned (anon) users to view active requests on mobile
-- The previous policy didn't explicitly allow anon users to select active requests
-- By adding explicit TO clause, we ensure anon users can access active requests

-- Drop the existing policy and recreate with explicit role grants
DROP POLICY IF EXISTS "Active requests public; hidden visible to author/admin/trusted" ON public.requests;

CREATE POLICY "Active requests public; hidden visible to author/admin/trusted"
  ON public.requests FOR SELECT
  TO public, anon, authenticated
  USING (
    status = 'active'
    OR auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_trusted(auth.uid())
  );
