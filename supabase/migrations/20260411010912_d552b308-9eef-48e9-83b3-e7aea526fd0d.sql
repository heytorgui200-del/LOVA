
-- Create seo_clusters table
CREATE TABLE public.seo_clusters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  hub_page_id UUID REFERENCES public.seo_pages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seo_clusters ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins manage seo_clusters"
ON public.seo_clusters
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Public read
CREATE POLICY "Public read seo_clusters"
ON public.seo_clusters
FOR SELECT
TO public
USING (true);

-- Add columns to seo_pages
ALTER TABLE public.seo_pages
  ADD COLUMN cluster_id UUID REFERENCES public.seo_clusters(id) ON DELETE SET NULL,
  ADD COLUMN intent_type TEXT DEFAULT 'transactional',
  ADD COLUMN opportunity_score INTEGER DEFAULT 50,
  ADD COLUMN internal_links_json JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN status TEXT NOT NULL DEFAULT 'published';

-- Index for cluster lookups
CREATE INDEX idx_seo_pages_cluster_id ON public.seo_pages(cluster_id);
CREATE INDEX idx_seo_pages_status ON public.seo_pages(status);
