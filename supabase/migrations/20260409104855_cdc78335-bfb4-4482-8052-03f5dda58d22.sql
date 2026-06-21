
CREATE OR REPLACE FUNCTION public.protect_wallet_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.wallet_balance IS DISTINCT FROM OLD.wallet_balance THEN
    IF current_setting('role') != 'service_role' THEN
      NEW.wallet_balance := OLD.wallet_balance;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_wallet_balance_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_wallet_balance();
