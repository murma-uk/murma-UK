-- Fix: Allow unsigned (anon) users to view active requests on mobile
-- Issue: Unsigned users couldn't see the murmas list due to overly restrictive RLS
-- Solution: Split into two policies - one for public access, one for authenticated users

-- Drop the previous restrictive policy
DROP POLICY IF EXISTS "Active requests public; hidden visible to author/admin/trusted" ON public.requests;

-- Policy 1: Allow anyone (including unsigned/anon users) to see active requests
-- This policy has no role restriction, making it accessible to all users
CREATE POLICY "active_requests_public"
  ON public.requests FOR SELECT
  USING (status = 'active');

-- Policy 2: Allow authenticated users full access (active + their own + hidden if trusted)
-- This policy only applies to logged-in users
CREATE POLICY "authenticated_full_access"
  ON public.requests FOR SELECT
  TO authenticated
  USING (
    status = 'active'
    OR auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_trusted(auth.uid())
  );
