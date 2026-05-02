
-- 1. Custom fields per category
CREATE TABLE public.request_category_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.request_categories(id) ON DELETE CASCADE,
  key text NOT NULL,
  label text NOT NULL,
  field_type text NOT NULL,
  options jsonb,
  placeholder text,
  help_text text,
  required boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, key)
);

ALTER TABLE public.request_category_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fields viewable by everyone"
  ON public.request_category_fields FOR SELECT USING (true);

CREATE POLICY "Admins can insert fields"
  ON public.request_category_fields FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update fields"
  ON public.request_category_fields FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete fields"
  ON public.request_category_fields FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Validation trigger on field shape
CREATE OR REPLACE FUNCTION public.validate_request_category_field()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.field_type NOT IN ('text','textarea','number','date','time','select','multiselect','days') THEN
    RAISE EXCEPTION 'Invalid field_type: %', NEW.field_type;
  END IF;
  IF NEW.field_type IN ('select','multiselect') THEN
    IF NEW.options IS NULL OR jsonb_typeof(NEW.options) <> 'array' THEN
      RAISE EXCEPTION 'options must be a JSON array for select/multiselect';
    END IF;
  END IF;
  IF NEW.key !~ '^[a-z][a-z0-9_]*$' THEN
    RAISE EXCEPTION 'key must be snake_case (lowercase letters, digits, underscores; starts with a letter)';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_request_category_field
  BEFORE INSERT OR UPDATE ON public.request_category_fields
  FOR EACH ROW EXECUTE FUNCTION public.validate_request_category_field();

CREATE TRIGGER trg_request_category_fields_updated_at
  BEFORE UPDATE ON public.request_category_fields
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Structured answers on requests
ALTER TABLE public.requests
  ADD COLUMN field_values jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 4. Seed existing field definitions (mirroring the current hardcoded blocks)
INSERT INTO public.request_category_fields (category_id, key, label, field_type, options, placeholder, sort_order, required)
SELECT c.id, x.key, x.label, x.field_type, x.options, x.placeholder, x.sort_order, x.required
FROM public.request_categories c
JOIN (
  VALUES
    ('opening_hours', 'open_time',   'Open from',   'time', NULL::jsonb, NULL, 10, false),
    ('opening_hours', 'close_time',  'Open until',  'time', NULL::jsonb, NULL, 20, false),
    ('opening_hours', 'days',        'Days',        'days', NULL::jsonb, NULL, 30, false),
    ('classes_sessions', 'class_type',  'Class or session type', 'text', NULL::jsonb, 'e.g. Yoga, Pottery, Coding', 10, false),
    ('classes_sessions', 'skill_level', 'Skill level',           'select',
      '[{"value":"beginner","label":"Beginner"},{"value":"intermediate","label":"Intermediate"},{"value":"advanced","label":"Advanced"},{"value":"all","label":"All levels"}]'::jsonb,
      'Any level', 20, false),
    ('artist_visit', 'artist_name',  'Artist or performer', 'text',   NULL::jsonb, 'Who would you like to see?', 10, false),
    ('artist_visit', 'event_date',   'Preferred date',      'date',   NULL::jsonb, NULL, 20, false),
    ('artist_visit', 'audience_size','Audience size',       'number', NULL::jsonb, 'e.g. 50', 30, false)
) AS x(slug, key, label, field_type, options, placeholder, sort_order, required)
ON c.slug = x.slug;
