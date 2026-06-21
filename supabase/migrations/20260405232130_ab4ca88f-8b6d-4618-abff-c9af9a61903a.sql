CREATE OR REPLACE FUNCTION public.get_completed_orders_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(COUNT(*)::integer, 0)
  FROM public.orders
  WHERE status = 'completed';
$$;