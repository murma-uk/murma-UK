
REVOKE EXECUTE ON FUNCTION public.moderate_request(uuid, public.moderation_action, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.refresh_trusted_status(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_trusted(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.moderate_request(uuid, public.moderation_action, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_trusted(uuid) TO authenticated;
