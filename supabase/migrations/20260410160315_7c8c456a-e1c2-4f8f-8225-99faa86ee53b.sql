
CREATE TRIGGER protect_wallet_balance
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_wallet_balance();
