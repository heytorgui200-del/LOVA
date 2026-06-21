
-- FIX 1: orders — remove anonymous read leak
DROP POLICY IF EXISTS "Users read own orders" ON public.orders;
CREATE POLICY "Users read own orders"
  ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- orders — restrict inserts to service_role only
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
CREATE POLICY "Service role inserts orders"
  ON public.orders FOR INSERT TO service_role
  WITH CHECK (true);

-- Admin update orders
DROP POLICY IF EXISTS "Admins update orders" ON public.orders;
CREATE POLICY "Admins update orders"
  ON public.orders FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role update orders (for webhook)
DROP POLICY IF EXISTS "Service role updates orders" ON public.orders;
CREATE POLICY "Service role updates orders"
  ON public.orders FOR UPDATE TO service_role
  USING (true);

-- FIX 2: payments — remove anonymous read leak
DROP POLICY IF EXISTS "Users read own payments" ON public.payments;
CREATE POLICY "Users read own payments"
  ON public.payments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- payments — restrict inserts to service_role only
DROP POLICY IF EXISTS "Anyone can insert payments" ON public.payments;
CREATE POLICY "Service role inserts payments"
  ON public.payments FOR INSERT TO service_role
  WITH CHECK (true);

-- Admin read payments
DROP POLICY IF EXISTS "Admins read all payments" ON public.payments;
CREATE POLICY "Admins read all payments"
  ON public.payments FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role update payments
DROP POLICY IF EXISTS "Service role updates payments" ON public.payments;
CREATE POLICY "Service role updates payments"
  ON public.payments FOR UPDATE TO service_role
  USING (true);

-- FIX 3: email_templates — remove public read
DROP POLICY IF EXISTS "Public read templates" ON public.email_templates;
