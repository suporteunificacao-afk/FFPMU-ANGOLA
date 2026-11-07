-- Keep the one-time church bootstrap callable only by signed-in users.
-- The function itself verifies auth.uid() and refuses repeat initialization.
REVOKE EXECUTE ON FUNCTION public.bootstrap_church(text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_church(text, text, text, text) TO authenticated;

-- This function is invoked by the auth.users trigger, not through the Data API.
-- Trigger execution does not require callers to retain direct EXECUTE privileges.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
