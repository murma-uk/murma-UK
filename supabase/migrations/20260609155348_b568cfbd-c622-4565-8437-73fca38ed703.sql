
-- Trigram extension for fuzzy title matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS requests_title_trgm_idx ON public.requests USING gin (title gin_trgm_ops);

-- Cosigner count column on requests
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS cosigner_count integer NOT NULL DEFAULT 0;

-- =====================================================================
-- request_comments
-- =====================================================================
CREATE TABLE public.request_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 1000),
  kind text NOT NULL DEFAULT 'comment' CHECK (kind IN ('angle','comment')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX request_comments_request_idx ON public.request_comments(request_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.request_comments TO authenticated;
GRANT SELECT ON public.request_comments TO anon;
GRANT ALL ON public.request_comments TO service_role;

ALTER TABLE public.request_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments readable by all"
  ON public.request_comments FOR SELECT USING (true);
CREATE POLICY "Users insert own comments"
  ON public.request_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own comments"
  ON public.request_comments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own comments"
  ON public.request_comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER request_comments_updated_at
  BEFORE UPDATE ON public.request_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================================
-- request_cosigners
-- =====================================================================
CREATE TABLE public.request_cosigners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note text CHECK (note IS NULL OR length(note) BETWEEN 1 AND 200),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, user_id)
);
CREATE INDEX request_cosigners_request_idx ON public.request_cosigners(request_id);

GRANT SELECT, INSERT, DELETE ON public.request_cosigners TO authenticated;
GRANT SELECT ON public.request_cosigners TO anon;
GRANT ALL ON public.request_cosigners TO service_role;

ALTER TABLE public.request_cosigners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cosigners readable by all"
  ON public.request_cosigners FOR SELECT USING (true);
CREATE POLICY "Users add own cosign"
  ON public.request_cosigners FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove own cosign"
  ON public.request_cosigners FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Maintain cosigner_count
CREATE OR REPLACE FUNCTION public.increment_cosigner_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.requests SET cosigner_count = cosigner_count + 1 WHERE id = NEW.request_id;
  RETURN NEW;
END;
$$;
CREATE OR REPLACE FUNCTION public.decrement_cosigner_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.requests SET cosigner_count = greatest(cosigner_count - 1, 0) WHERE id = OLD.request_id;
  RETURN OLD;
END;
$$;
CREATE TRIGGER request_cosigners_inc
  AFTER INSERT ON public.request_cosigners
  FOR EACH ROW EXECUTE FUNCTION public.increment_cosigner_count();
CREATE TRIGGER request_cosigners_dec
  AFTER DELETE ON public.request_cosigners
  FOR EACH ROW EXECUTE FUNCTION public.decrement_cosigner_count();

-- =====================================================================
-- merge_suggestions
-- =====================================================================
CREATE TABLE public.merge_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  suggester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proposed_title text NOT NULL,
  proposed_body text,
  proposed_category public.request_category NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','cancelled')),
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX merge_suggestions_target_idx ON public.merge_suggestions(target_request_id, status);
CREATE INDEX merge_suggestions_suggester_idx ON public.merge_suggestions(suggester_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.merge_suggestions TO authenticated;
GRANT ALL ON public.merge_suggestions TO service_role;

ALTER TABLE public.merge_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suggester or target owner can read"
  ON public.merge_suggestions FOR SELECT TO authenticated
  USING (
    auth.uid() = suggester_id
    OR auth.uid() = (SELECT user_id FROM public.requests WHERE id = target_request_id)
  );
CREATE POLICY "Suggester inserts own"
  ON public.merge_suggestions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = suggester_id);
CREATE POLICY "Suggester can cancel own"
  ON public.merge_suggestions FOR UPDATE TO authenticated
  USING (auth.uid() = suggester_id AND status = 'pending')
  WITH CHECK (status IN ('pending','cancelled'));
CREATE POLICY "Target owner can decide"
  ON public.merge_suggestions FOR UPDATE TO authenticated
  USING (
    status = 'pending'
    AND auth.uid() = (SELECT user_id FROM public.requests WHERE id = target_request_id)
  )
  WITH CHECK (status IN ('accepted','rejected'));

-- =====================================================================
-- find_similar_requests (RPC)
-- Returns ranked nearby requests likely to be duplicates.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.find_similar_requests(
  _text text,
  _category public.request_category,
  _lat double precision,
  _lng double precision,
  _limit int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  description text,
  category public.request_category,
  town text,
  lat double precision,
  lng double precision,
  upvote_count int,
  cosigner_count int,
  distance_km double precision,
  trgm_score real,
  score real
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH base AS (
    SELECT
      r.id, r.slug, r.title, r.description, r.category, r.town, r.lat, r.lng,
      r.upvote_count, r.cosigner_count,
      -- haversine km
      (
        6371.0 * 2 * asin(
          sqrt(
            power(sin(radians((r.lat - _lat)/2)), 2)
            + cos(radians(_lat)) * cos(radians(r.lat))
              * power(sin(radians((r.lng - _lng)/2)), 2)
          )
        )
      ) AS distance_km,
      similarity(r.title, _text) AS trgm_score
    FROM public.requests r
    WHERE r.status = 'active'
      AND (_category IS NULL OR r.category = _category)
  )
  SELECT
    id, slug, title, description, category, town, lat, lng, upvote_count, cosigner_count,
    distance_km,
    trgm_score,
    (
      0.6 * trgm_score
      + 0.4 * GREATEST(0, 1 - (distance_km / 5.0))
    )::real AS score
  FROM base
  WHERE distance_km <= 5
    AND trgm_score >= 0.15
  ORDER BY score DESC
  LIMIT _limit;
$$;

GRANT EXECUTE ON FUNCTION public.find_similar_requests(text, public.request_category, double precision, double precision, int) TO anon, authenticated;

-- =====================================================================
-- accept_merge_suggestion (RPC)
-- Owner accepts: adds suggester as cosigner + posts their note as an angle comment.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.accept_merge_suggestion(_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_target uuid;
  v_suggester uuid;
  v_body text;
  v_owner uuid;
BEGIN
  SELECT target_request_id, suggester_id, proposed_body
    INTO v_target, v_suggester, v_body
    FROM public.merge_suggestions
    WHERE id = _id AND status = 'pending'
    FOR UPDATE;

  IF v_target IS NULL THEN
    RAISE EXCEPTION 'Suggestion not found or already decided';
  END IF;

  SELECT user_id INTO v_owner FROM public.requests WHERE id = v_target;
  IF v_owner IS NULL OR v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Only the request owner can accept this suggestion';
  END IF;

  INSERT INTO public.request_cosigners (request_id, user_id, note)
  VALUES (v_target, v_suggester, NULLIF(left(coalesce(v_body,''), 200), ''))
  ON CONFLICT (request_id, user_id) DO NOTHING;

  IF v_body IS NOT NULL AND length(trim(v_body)) > 0 THEN
    INSERT INTO public.request_comments (request_id, user_id, body, kind)
    VALUES (v_target, v_suggester, v_body, 'angle');
  END IF;

  UPDATE public.merge_suggestions
    SET status = 'accepted', decided_at = now()
    WHERE id = _id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_merge_suggestion(uuid) TO authenticated;
