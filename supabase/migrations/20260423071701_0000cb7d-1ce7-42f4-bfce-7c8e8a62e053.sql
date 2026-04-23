-- Enable unaccent first so slugify can use it
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Slugify: lowercase, strip diacritics, non-alphanum -> '-', trim, clip 60 chars
CREATE OR REPLACE FUNCTION public.slugify(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, extensions
AS $$
  SELECT
    substring(
      trim(both '-' from
        regexp_replace(
          lower(public.unaccent(coalesce(input, ''))),
          '[^a-z0-9]+', '-', 'g'
        )
      )
    from 1 for 60);
$$;

-- Slug column
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS slug text;

-- Generated short id column (first 8 chars of UUID) + index
ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS id_short text
  GENERATED ALWAYS AS (substring(id::text, 1, 8)) STORED;

CREATE INDEX IF NOT EXISTS idx_requests_id_short ON public.requests (id_short);

-- Trigger to set slug on insert / when title or town changes
CREATE OR REPLACE FUNCTION public.requests_set_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL
     OR (TG_OP = 'UPDATE' AND (NEW.title IS DISTINCT FROM OLD.title OR NEW.town IS DISTINCT FROM OLD.town))
  THEN
    NEW.slug := public.slugify(NEW.title || '-' || COALESCE(NEW.town, ''));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_requests_set_slug ON public.requests;
CREATE TRIGGER trg_requests_set_slug
BEFORE INSERT OR UPDATE OF title, town ON public.requests
FOR EACH ROW
EXECUTE FUNCTION public.requests_set_slug();

-- Backfill
UPDATE public.requests
SET slug = public.slugify(title || '-' || COALESCE(town, ''))
WHERE slug IS NULL;