
-- Fix: Allow unsigned (anon) users to view active requests
-- Issue: Unsigned users on mobile couldn't see the murmas list
-- The previous policy restricted access without explicitly allowing anon role

-- Drop the existing restrictive policy that doesn't allow anon users
DROP POLICY IF EXISTS "Active requests public; hidden visible to author/admin/trusted" ON public.requests;

-- Create a new policy that explicitly allows anon users to see active requests
-- and allows authenticated users to see their own and hidden requests if trusted
CREATE POLICY "Requests viewable by everyone for active; author/admin/trusted can see all"
  ON public.requests FOR SELECT
  USING (
    -- Anyone (including anon) can see active requests
    status = 'active'
    -- Users can see their own requests
    OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    -- Admins and trusted users can see all
    OR (auth.uid() IS NOT NULL AND (public.has_role(auth.uid(), 'admin') OR public.is_trusted(auth.uid())))
  );
