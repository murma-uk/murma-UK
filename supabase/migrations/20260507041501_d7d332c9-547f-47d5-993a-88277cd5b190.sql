ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS business_kind text,
  ADD COLUMN IF NOT EXISTS business_type_slug text,
  ADD COLUMN IF NOT EXISTS brand_name text,
  ADD COLUMN IF NOT EXISTS brand_website text,
  ADD COLUMN IF NOT EXISTS radius_m integer;

ALTER TABLE public.requests
  DROP CONSTRAINT IF EXISTS requests_business_kind_check;

ALTER TABLE public.requests
  ADD CONSTRAINT requests_business_kind_check
  CHECK (business_kind IS NULL OR business_kind IN ('type','brand'));