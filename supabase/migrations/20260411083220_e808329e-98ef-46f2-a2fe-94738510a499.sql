
CREATE TABLE public.reseller_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reseller_id uuid NOT NULL REFERENCES public.resellers(id) ON DELETE CASCADE,
  pack integer NOT NULL,
  cost numeric NOT NULL DEFAULT 0,
  sale_price numeric NOT NULL DEFAULT 0,
  profit numeric NOT NULL DEFAULT 0,
  margin_mode text NOT NULL DEFAULT 'percent',
  slug text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  views integer NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Unique constraint on reseller + slug
CREATE UNIQUE INDEX idx_reseller_links_unique_slug ON public.reseller_links (reseller_id, slug);

-- Enable RLS
ALTER TABLE public.reseller_links ENABLE ROW LEVEL SECURITY;

-- Resellers read own links
CREATE POLICY "Resellers read own links"
ON public.reseller_links
FOR SELECT
TO authenticated
USING (reseller_id IN (SELECT id FROM public.resellers WHERE user_id = auth.uid()));

-- Resellers create own links
CREATE POLICY "Resellers insert own links"
ON public.reseller_links
FOR INSERT
TO authenticated
WITH CHECK (reseller_id IN (SELECT id FROM public.resellers WHERE user_id = auth.uid()));

-- Resellers update own links
CREATE POLICY "Resellers update own links"
ON public.reseller_links
FOR UPDATE
TO authenticated
USING (reseller_id IN (SELECT id FROM public.resellers WHERE user_id = auth.uid()));

-- Admins read all
CREATE POLICY "Admins read all reseller_links"
ON public.reseller_links
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Service role full access
CREATE POLICY "Service role manages reseller_links"
ON public.reseller_links
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Public can read active links (for public reseller pages)
CREATE POLICY "Public read active links"
ON public.reseller_links
FOR SELECT
TO anon
USING (is_active = true);

-- Function to increment views atomically
CREATE OR REPLACE FUNCTION public.increment_link_views(_link_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE reseller_links SET views = views + 1 WHERE id = _link_id;
$$;
