
-- Secure function to auto-assign admin role on signup
-- Email is stored ONLY inside this SECURITY DEFINER function, not accessible from client
CREATE OR REPLACE FUNCTION public.handle_admin_role_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the new user's email matches the admin email
  IF NEW.email = 'heytor.gui300@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Revoke execute from public so nobody can call this function directly
REVOKE EXECUTE ON FUNCTION public.handle_admin_role_assignment() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_admin_role_assignment() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_admin_role_assignment() FROM authenticated;

CREATE TRIGGER on_auth_user_created_admin_check
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_admin_role_assignment();
