
-- 1. Add refunded column to prevent double-refunds
ALTER TABLE public.reseller_orders ADD COLUMN IF NOT EXISTS refunded boolean NOT NULL DEFAULT false;

-- 2. Remove reseller_orders from Realtime (ignore error if not in publication)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE public.reseller_orders;
EXCEPTION WHEN OTHERS THEN
  -- table might not be in publication, ignore
  NULL;
END;
$$;

-- 3. Create security-definer function for safe public link lookup
CREATE OR REPLACE FUNCTION public.get_public_link_info(_reseller_id uuid, _slug text)
RETURNS TABLE(id uuid, pack integer, sale_price numeric, reseller_id uuid, is_active boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rl.id, rl.pack, rl.sale_price, rl.reseller_id, rl.is_active
  FROM reseller_links rl
  WHERE rl.reseller_id = _reseller_id
    AND rl.slug = _slug
    AND rl.is_active = true
  LIMIT 1;
$$;

-- 4. Create security-definer function for safe public reseller lookup
CREATE OR REPLACE FUNCTION public.get_public_reseller_info(_slug text)
RETURNS TABLE(id uuid, store_name text, slug text, status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.store_name, r.slug, r.status
  FROM resellers r
  WHERE r.slug = _slug
    AND r.status = 'active'
  LIMIT 1;
$$;

-- 5. Drop insecure anon policies on reseller_links
DROP POLICY IF EXISTS "Public read active links" ON public.reseller_links;
DROP POLICY IF EXISTS "Authenticated read active links" ON public.reseller_links;

-- 6. Drop insecure anon policy on resellers
DROP POLICY IF EXISTS "Public read active resellers" ON public.resellers;
