CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.simulator_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  emoji text DEFAULT '✨',
  suggested_credits int NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.simulator_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active intents"
  ON public.simulator_intents FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins manage intents"
  ON public.simulator_intents FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages intents"
  ON public.simulator_intents FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER simulator_intents_updated_at
  BEFORE UPDATE ON public.simulator_intents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.simulator_intents (label, emoji, suggested_credits, description, sort_order) VALUES
  ('Landing page',   '🚀', 200,  'Site de apresentação com formulário', 1),
  ('Dashboard',      '📊', 800,  'Painel com gráficos e dados',         2),
  ('App SaaS',       '⚡', 1500, 'MVP funcional com autenticação',      3),
  ('E-commerce',     '🛒', 2500, 'Loja com carrinho e pagamento',       4),
  ('MVP completo',   '💎', 3500, 'Produto completo pronto para escalar',5),
  ('Só explorando',  '✨', 100,  'Quero testar a plataforma',           6);