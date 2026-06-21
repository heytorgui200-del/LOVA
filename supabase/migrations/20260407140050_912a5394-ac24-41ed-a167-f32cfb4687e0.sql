-- Revoke direct RPC access to has_role from anon and authenticated roles.
-- RLS policies that reference has_role() still work because they execute
-- in the context of the policy owner, not the calling role.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated;
