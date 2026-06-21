
-- Add slug and store_name to resellers
ALTER TABLE public.resellers
ADD COLUMN IF NOT EXISTS slug text UNIQUE,
ADD COLUMN IF NOT EXISTS store_name text;

-- Create reseller_referrals table for tracking
CREATE TABLE IF NOT EXISTS public.reseller_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id uuid NOT NULL REFERENCES public.resellers(id) ON DELETE CASCADE,
  pack integer NOT NULL DEFAULT 0,
  source text DEFAULT 'link',
  clicked_at timestamptz NOT NULL DEFAULT now(),
  converted boolean NOT NULL DEFAULT false,
  order_id uuid REFERENCES public.orders(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_reseller_referrals_reseller ON public.reseller_referrals(reseller_id);
CREATE INDEX IF NOT EXISTS idx_reseller_referrals_converted ON public.reseller_referrals(reseller_id, converted);

-- Enable RLS
ALTER TABLE public.reseller_referrals ENABLE ROW LEVEL SECURITY;

-- Resellers can read their own referrals
CREATE POLICY "Users read own referrals"
ON public.reseller_referrals
FOR SELECT
TO authenticated
USING (
  reseller_id IN (
    SELECT id FROM public.resellers WHERE user_id = auth.uid()
  )
);

-- Service role manages all
CREATE POLICY "Service role manages referrals"
ON public.reseller_referrals
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Public can insert referral clicks (for tracking)
CREATE POLICY "Public insert referral clicks"
ON public.reseller_referrals
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
