
-- SEO Opportunities table
CREATE TABLE public.seo_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL,
  intent_type TEXT NOT NULL DEFAULT 'transactional',
  cluster_id UUID REFERENCES public.seo_clusters(id) ON DELETE SET NULL,
  cluster_suggestion TEXT,
  action TEXT NOT NULL DEFAULT 'create',
  opportunity_score INTEGER NOT NULL DEFAULT 50,
  risk_score INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  similar_pages JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  resolved_page_id UUID REFERENCES public.seo_pages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage seo_opportunities"
  ON public.seo_opportunities FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages seo_opportunities"
  ON public.seo_opportunities FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- SEO Page Metrics table (monitoring snapshots)
CREATE TABLE public.seo_page_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.seo_pages(id) ON DELETE CASCADE,
  snapshot_day INTEGER NOT NULL DEFAULT 7,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  avg_position NUMERIC DEFAULT 0,
  classification TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_page_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read seo_page_metrics"
  ON public.seo_page_metrics FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages seo_page_metrics"
  ON public.seo_page_metrics FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- SEO Optimizations table
CREATE TABLE public.seo_optimizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.seo_pages(id) ON DELETE CASCADE,
  optimization_type TEXT NOT NULL,
  current_value TEXT,
  suggested_value TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_optimizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage seo_optimizations"
  ON public.seo_optimizations FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages seo_optimizations"
  ON public.seo_optimizations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
