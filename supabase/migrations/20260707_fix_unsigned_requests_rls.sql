
-- Fix: Allow unsigned (anon) users to view active requests on mobile
-- The previous policy didn't explicitly allow anon users to select active requests
-- Create separate policies to ensure full access

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Active requests public; hidden visible to author/admin/trusted" ON public.requests;

-- Policy for anonymous users: can see only active requests
CREATE POLICY "Active requests public to anon"
  ON public.requests FOR SELECT
  TO anon
  USING (status = 'active');

-- Policy for authenticated users: can see active requests plus their own and hidden if trusted
CREATE POLICY "Active requests visible to authenticated"
  ON public.requests FOR SELECT
  TO authenticated
  USING (
    status = 'active'
    OR auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_trusted(auth.uid())
  );
