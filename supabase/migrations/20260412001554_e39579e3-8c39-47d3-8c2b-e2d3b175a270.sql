
-- 1. Fix reseller_orders anon SELECT: restrict to public_token filter only
DROP POLICY IF EXISTS "Public read by token" ON public.reseller_orders;
CREATE POLICY "Public read by token" ON public.reseller_orders
  FOR SELECT TO anon
  USING (false);
-- Anon can only read via edge function (service_role). Frontend queries will use authenticated role.

-- 2. Add anon UPDATE blocked (already no policy, but explicit)
-- No changes needed, anon has no UPDATE/INSERT/DELETE policies

-- 3. Add client_whatsapp to reseller_orders
ALTER TABLE public.reseller_orders ADD COLUMN IF NOT EXISTS client_whatsapp text;

-- 4. Add expires_at to reseller_orders with 48h default
ALTER TABLE public.reseller_orders ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone DEFAULT (now() + interval '48 hours');

-- 5. Add whatsapp to resellers
ALTER TABLE public.resellers ADD COLUMN IF NOT EXISTS whatsapp text;
