-- Create request_categories table
CREATE TABLE public.request_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  icon_name text NOT NULL,
  color text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.request_categories ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Categories viewable by everyone"
  ON public.request_categories
  FOR SELECT
  USING (true);

-- Admin write
CREATE POLICY "Admins can insert categories"
  ON public.request_categories
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update categories"
  ON public.request_categories
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete categories"
  ON public.request_categories
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE TRIGGER trg_request_categories_updated_at
BEFORE UPDATE ON public.request_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed
INSERT INTO public.request_categories (slug, label, icon_name, color, sort_order) VALUES
  ('opening_hours',    'Opening Hours',       'Clock',         'hsl(210, 100%, 50%)', 10),
  ('new_branch',       'New Branch',          'MapPin',        'hsl(145, 65%, 42%)',  20),
  ('classes_sessions', 'Classes & Sessions',  'GraduationCap', 'hsl(280, 70%, 55%)',  30),
  ('artist_visit',     'Artist Visit',        'Palette',       'hsl(12, 90%, 60%)',   40),
  ('announcement',     'Announcement',        'Megaphone',     'hsl(38, 92%, 50%)',   50);