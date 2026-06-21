
CREATE OR REPLACE FUNCTION public.protect_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.user_id = '6e816a7c-3012-4bbf-9fc5-cb85ea112e94' AND OLD.role = 'admin' THEN
    RAISE EXCEPTION 'Admin role is permanent and cannot be modified or deleted.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER protect_admin_role_trigger
BEFORE UPDATE OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.protect_admin_role();
