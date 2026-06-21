
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Public insert referral clicks" ON public.reseller_referrals;

-- Recreate with tighter check: only allow non-converted click tracking
CREATE POLICY "Public insert referral clicks"
ON public.reseller_referrals
FOR INSERT
TO anon, authenticated
WITH CHECK (converted = false AND order_id IS NULL);
