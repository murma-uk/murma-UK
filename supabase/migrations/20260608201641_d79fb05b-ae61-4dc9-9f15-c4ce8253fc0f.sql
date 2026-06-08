
-- Add new enum values
ALTER TYPE public.request_category ADD VALUE IF NOT EXISTS 'nature_outdoors';
ALTER TYPE public.request_category ADD VALUE IF NOT EXISTS 'culture_art';
ALTER TYPE public.request_category ADD VALUE IF NOT EXISTS 'community_service';
ALTER TYPE public.request_category ADD VALUE IF NOT EXISTS 'wild_idea';
