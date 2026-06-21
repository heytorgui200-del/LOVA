
DROP TRIGGER IF EXISTS on_auth_user_created_admin_check ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
DROP FUNCTION IF EXISTS public.handle_admin_role_assignment() CASCADE;
