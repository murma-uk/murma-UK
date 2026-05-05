DROP TABLE IF EXISTS public.comments CASCADE;

ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS share_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_request_view(_request_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.requests SET view_count = view_count + 1 WHERE id = _request_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_request_share(_request_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.requests SET share_count = share_count + 1 WHERE id = _request_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_request_view(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_request_share(uuid) TO anon, authenticated;