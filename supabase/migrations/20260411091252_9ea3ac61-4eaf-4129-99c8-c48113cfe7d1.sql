
-- Create reseller_orders table for public delivery tracking
CREATE TABLE public.reseller_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  public_token TEXT NOT NULL UNIQUE,
  reseller_id UUID NOT NULL REFERENCES public.resellers(id) ON DELETE CASCADE,
  reseller_link_id UUID REFERENCES public.reseller_links(id),
  credits INTEGER NOT NULL,
  final_price NUMERIC NOT NULL,
  cost NUMERIC NOT NULL DEFAULT 0,
  profit NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  delivery_logs JSONB NOT NULL DEFAULT '[]'::jsonb,
  tutorial_viewed_at TIMESTAMPTZ,
  delivery_started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  client_email TEXT,
  api_order_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_reseller_orders_token ON public.reseller_orders(public_token);
CREATE INDEX idx_reseller_orders_reseller ON public.reseller_orders(reseller_id);
CREATE INDEX idx_reseller_orders_status ON public.reseller_orders(status);

-- Enable RLS
ALTER TABLE public.reseller_orders ENABLE ROW LEVEL SECURITY;

-- Public can read by token (for the delivery page)
CREATE POLICY "Public read by token"
  ON public.reseller_orders FOR SELECT
  TO anon
  USING (true);

-- Authenticated resellers read own orders
CREATE POLICY "Resellers read own orders"
  ON public.reseller_orders FOR SELECT
  TO authenticated
  USING (reseller_id IN (SELECT id FROM resellers WHERE user_id = auth.uid()));

-- Admins read all
CREATE POLICY "Admins read all reseller_orders"
  ON public.reseller_orders FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role full access
CREATE POLICY "Service role manages reseller_orders"
  ON public.reseller_orders FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.reseller_orders;
