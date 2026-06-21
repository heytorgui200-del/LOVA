
CREATE OR REPLACE FUNCTION public.trap_cheaters()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  IF current_setting('role') != 'service_role' THEN
    IF NEW.wallet_balance > OLD.wallet_balance THEN
      NEW.is_banned = true;
      NEW.wallet_balance = OLD.wallet_balance;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
