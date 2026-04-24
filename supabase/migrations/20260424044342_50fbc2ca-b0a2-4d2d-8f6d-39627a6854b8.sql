
-- 1) Move unaccent extension to the extensions schema.
-- slugify() already has search_path = public, extensions, so it keeps working.
-- Drop dependent SQL function first, recreate after extension move.
DROP FUNCTION IF EXISTS public.slugify(text);
DROP EXTENSION IF EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.slugify(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public', 'extensions'
AS $$
  SELECT
    substring(
      trim(both '-' from
        regexp_replace(
          lower(extensions.unaccent(coalesce(input, ''))),
          '[^a-z0-9]+', '-', 'g'
        )
      )
    from 1 for 60);
$$;

-- 2) Lock down businesses.INSERT — no client writes allowed.
-- A trusted edge function (service role) will upsert from OpenStreetMap.
DROP POLICY IF EXISTS "Authenticated users can add businesses" ON public.businesses;
