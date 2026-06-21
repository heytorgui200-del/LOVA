
-- Rate limiting table
CREATE TABLE public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  ip_address text,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service_role can access
CREATE POLICY "Service role manages rate_limits"
ON public.rate_limits FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Cleanup function for old entries
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limits WHERE attempted_at < now() - interval '10 minutes';
$$;

-- Index for fast lookups
CREATE INDEX idx_rate_limits_lookup ON public.rate_limits (user_id, action, attempted_at DESC);
CREATE INDEX idx_rate_limits_ip ON public.rate_limits (ip_address, action, attempted_at DESC);
