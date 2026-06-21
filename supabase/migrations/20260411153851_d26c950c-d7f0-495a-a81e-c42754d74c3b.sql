-- Allow anonymous users to read active resellers (needed for public reseller pages)
CREATE POLICY "Public read active resellers"
ON public.resellers
FOR SELECT
TO anon
USING (status = 'active');

-- Allow authenticated users to also read active links (currently only anon can)
CREATE POLICY "Authenticated read active links"
ON public.reseller_links
FOR SELECT
TO authenticated
USING (is_active = true);
