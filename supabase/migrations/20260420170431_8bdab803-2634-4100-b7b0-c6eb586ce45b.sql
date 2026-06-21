-- Aggregated count of credits delivered in last 24h (public, safe)
CREATE OR REPLACE FUNCTION public.get_credits_delivered_24h()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(credits)::integer, 0)
  FROM public.orders
  WHERE status = 'completed'
    AND completed_at >= now() - interval '24 hours';
$$;

-- Anonymized recent purchases (first name + credits + age only)
CREATE OR REPLACE FUNCTION public.get_recent_purchases(_limit integer DEFAULT 10)
RETURNS TABLE(first_name text, credits integer, minutes_ago integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(split_part(p.full_name, ' ', 1), 'Alguém') AS first_name,
    o.credits,
    GREATEST(1, EXTRACT(EPOCH FROM (now() - o.completed_at))::integer / 60) AS minutes_ago
  FROM public.orders o
  LEFT JOIN public.profiles p ON p.id = o.user_id
  WHERE o.status = 'completed'
    AND o.completed_at >= now() - interval '24 hours'
    AND o.user_id IS NOT NULL
  ORDER BY o.completed_at DESC
  LIMIT LEAST(GREATEST(_limit, 1), 50);
$$;

GRANT EXECUTE ON FUNCTION public.get_credits_delivered_24h() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_recent_purchases(integer) TO anon, authenticated;