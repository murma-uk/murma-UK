
-- Create businesses table for OSM-sourced business listings
CREATE TABLE public.businesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  osm_id BIGINT UNIQUE,
  name TEXT NOT NULL,
  business_type TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  town TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Anyone can view businesses
CREATE POLICY "Businesses viewable by everyone"
ON public.businesses FOR SELECT
USING (true);

-- Authenticated users can insert businesses (when linking from a request)
CREATE POLICY "Authenticated users can add businesses"
ON public.businesses FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add optional business_id to requests
ALTER TABLE public.requests
ADD COLUMN business_id UUID REFERENCES public.businesses(id);

-- Index for spatial and lookup queries
CREATE INDEX idx_businesses_town ON public.businesses(town);
CREATE INDEX idx_businesses_osm_id ON public.businesses(osm_id);
CREATE INDEX idx_requests_business_id ON public.requests(business_id);
