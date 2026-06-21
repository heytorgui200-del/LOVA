
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.payments ALTER COLUMN user_id DROP NOT NULL;

-- Allow anonymous inserts into orders
DROP POLICY IF EXISTS "Users insert own orders" ON public.orders;
CREATE POLICY "Anyone can insert orders"
  ON public.orders FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow anonymous inserts into payments
DROP POLICY IF EXISTS "Users insert own payments" ON public.payments;
CREATE POLICY "Anyone can insert payments"
  ON public.payments FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow anonymous reads for own orders (by matching user_id when logged in, or allow service role)
DROP POLICY IF EXISTS "Users read own orders" ON public.orders;
CREATE POLICY "Users read own orders"
  ON public.orders FOR SELECT
  TO public
  USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users read own payments" ON public.payments;
CREATE POLICY "Users read own payments"
  ON public.payments FOR SELECT
  TO public
  USING (auth.uid() = user_id OR user_id IS NULL);
