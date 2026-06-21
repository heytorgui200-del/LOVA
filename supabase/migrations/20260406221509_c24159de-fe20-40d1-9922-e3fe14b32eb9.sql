
-- Add wallet balance to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wallet_balance numeric NOT NULL DEFAULT 0;

-- Add order_type to orders (credit_purchase or wallet_topup)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_type text NOT NULL DEFAULT 'credit_purchase';

-- Wallet transactions table
CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('credit', 'debit')),
  amount numeric NOT NULL,
  description text NOT NULL DEFAULT '',
  order_id uuid REFERENCES public.orders(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own wallet transactions"
ON public.wallet_transactions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins read all wallet transactions"
ON public.wallet_transactions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages wallet transactions"
ON public.wallet_transactions FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Atomic debit_wallet function
CREATE OR REPLACE FUNCTION public.debit_wallet(
  _user_id uuid,
  _amount numeric,
  _description text,
  _order_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atomic: only succeeds if balance >= amount
  UPDATE profiles
  SET wallet_balance = wallet_balance - _amount
  WHERE id = _user_id AND wallet_balance >= _amount;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  INSERT INTO wallet_transactions (user_id, type, amount, description, order_id)
  VALUES (_user_id, 'debit', _amount, _description, _order_id);

  RETURN true;
END;
$$;

-- Credit wallet function (for top-ups)
CREATE OR REPLACE FUNCTION public.credit_wallet(
  _user_id uuid,
  _amount numeric,
  _description text,
  _order_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET wallet_balance = wallet_balance + _amount
  WHERE id = _user_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  INSERT INTO wallet_transactions (user_id, type, amount, description, order_id)
  VALUES (_user_id, 'credit', _amount, _description, _order_id);

  RETURN true;
END;
$$;
