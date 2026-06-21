
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

CREATE OR REPLACE FUNCTION public.get_recent_purchase_name(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    split_part(full_name, ' ', 1),
    'Alguém'
  )
  FROM public.profiles
  WHERE id = _user_id
  LIMIT 1;
$$;
