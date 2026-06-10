
-- Enums
CREATE TYPE public.flag_reason AS ENUM ('spam','off_topic','hateful','duplicate','illegal','other');
CREATE TYPE public.moderation_action AS ENUM ('hide','restore','remove');

-- profiles.is_trusted
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_trusted boolean NOT NULL DEFAULT false;

-- request_flags
CREATE TABLE public.request_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reason public.flag_reason NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.request_flags TO authenticated;
GRANT ALL ON public.request_flags TO service_role;
ALTER TABLE public.request_flags ENABLE ROW LEVEL SECURITY;

-- request_moderation audit
CREATE TABLE public.request_moderation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  actor_id uuid,
  action public.moderation_action NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.request_moderation TO authenticated;
GRANT ALL ON public.request_moderation TO service_role;
ALTER TABLE public.request_moderation ENABLE ROW LEVEL SECURITY;

-- is_trusted function (live computation)
CREATE OR REPLACE FUNCTION public.is_trusted(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = _user_id
      AND u.created_at <= now() - interval '14 days'
      AND (SELECT count(*) FROM public.requests r WHERE r.user_id = _user_id AND r.status = 'active') >= 10
      AND (SELECT coalesce(sum(upvote_count),0) FROM public.requests r WHERE r.user_id = _user_id) >= 20
      AND NOT EXISTS (SELECT 1 FROM public.requests r WHERE r.user_id = _user_id AND r.status IN ('hidden','removed'))
  );
$$;

CREATE OR REPLACE FUNCTION public.refresh_trusted_status(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _user_id IS NULL THEN RETURN; END IF;
  UPDATE public.profiles
    SET is_trusted = public.is_trusted(_user_id)
    WHERE user_id = _user_id;
END;
$$;

-- Auto-hide trigger after 3 flags
CREATE OR REPLACE FUNCTION public.handle_request_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
  v_status text;
  v_owner uuid;
BEGIN
  SELECT status, user_id INTO v_status, v_owner FROM public.requests WHERE id = NEW.request_id;
  SELECT count(*) INTO v_count FROM public.request_flags WHERE request_id = NEW.request_id;
  IF v_count >= 3 AND v_status = 'active' THEN
    UPDATE public.requests SET status = 'hidden' WHERE id = NEW.request_id;
    INSERT INTO public.request_moderation (request_id, actor_id, action, note)
      VALUES (NEW.request_id, NULL, 'hide', 'auto-hidden after 3 flags');
    PERFORM public.refresh_trusted_status(v_owner);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER request_flags_autohide
AFTER INSERT ON public.request_flags
FOR EACH ROW EXECUTE FUNCTION public.handle_request_flag();

-- Refresh trusted status on relevant events
CREATE OR REPLACE FUNCTION public.trg_refresh_trusted_from_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.refresh_trusted_status(COALESCE(NEW.user_id, OLD.user_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;
CREATE TRIGGER requests_refresh_trusted
AFTER INSERT OR UPDATE OF status, upvote_count OR DELETE ON public.requests
FOR EACH ROW EXECUTE FUNCTION public.trg_refresh_trusted_from_request();

-- Moderation RPC
CREATE OR REPLACE FUNCTION public.moderate_request(_request_id uuid, _action public.moderation_action, _note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT (public.has_role(v_caller, 'admin') OR public.is_trusted(v_caller)) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT user_id INTO v_owner FROM public.requests WHERE id = _request_id;
  IF v_owner IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;

  IF _action = 'restore' THEN
    DELETE FROM public.request_flags WHERE request_id = _request_id;
    UPDATE public.requests SET status = 'active' WHERE id = _request_id;
  ELSIF _action = 'remove' THEN
    UPDATE public.requests SET status = 'removed' WHERE id = _request_id;
  ELSIF _action = 'hide' THEN
    UPDATE public.requests SET status = 'hidden' WHERE id = _request_id;
  END IF;

  INSERT INTO public.request_moderation (request_id, actor_id, action, note)
    VALUES (_request_id, v_caller, _action, _note);

  PERFORM public.refresh_trusted_status(v_owner);
END;
$$;

-- RLS: request_flags
CREATE POLICY "Users insert own flags" ON public.request_flags
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own flags" ON public.request_flags
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Flags visible to self, admin, trusted" ON public.request_flags
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_trusted(auth.uid())
  );

-- RLS: request_moderation
CREATE POLICY "Moderation log visible to author, admin, trusted" ON public.request_moderation
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin')
    OR public.is_trusted(auth.uid())
    OR EXISTS (SELECT 1 FROM public.requests r WHERE r.id = request_id AND r.user_id = auth.uid())
  );

-- Tighten requests SELECT: hide hidden/removed from non-privileged
DROP POLICY IF EXISTS "Requests viewable by everyone" ON public.requests;
CREATE POLICY "Active requests public; hidden visible to author/admin/trusted"
  ON public.requests FOR SELECT
  USING (
    status = 'active'
    OR auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_trusted(auth.uid())
  );
