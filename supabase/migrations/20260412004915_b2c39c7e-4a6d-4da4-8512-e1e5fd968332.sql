-- Remove pricing_cache from Realtime to prevent unauthorized channel subscriptions
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE public.pricing_cache;
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;