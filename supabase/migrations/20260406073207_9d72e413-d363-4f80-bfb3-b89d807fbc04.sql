CREATE TABLE public.pricing_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prices jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pricing_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read pricing_cache" ON public.pricing_cache FOR SELECT TO public USING (true);

CREATE POLICY "Service role manages pricing_cache" ON public.pricing_cache FOR ALL TO service_role USING (true) WITH CHECK (true);