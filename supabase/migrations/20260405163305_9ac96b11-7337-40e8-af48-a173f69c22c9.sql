
-- Email templates table
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text UNIQUE NOT NULL,
  subject text NOT NULL,
  body_html text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage templates"
  ON public.email_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read templates"
  ON public.email_templates
  FOR SELECT TO public
  USING (true);

-- Seed default templates
INSERT INTO public.email_templates (template_key, subject, body_html) VALUES
  ('welcome', 'Bem-vindo à nossa plataforma!', '<h1>Bem-vindo, {{name}}!</h1><p>Sua conta foi criada com sucesso. Estamos felizes em ter você conosco.</p><p>Acesse seu painel para começar a usar nossos serviços.</p><p>Equipe da plataforma</p>'),
  ('signup_confirm', 'Confirme seu cadastro', '<h1>Olá, {{name}}!</h1><p>Obrigado por se cadastrar. Por favor, confirme seu e-mail clicando no link abaixo:</p><p><a href="{{confirm_url}}">Confirmar E-mail</a></p><p>Se você não se cadastrou, ignore este e-mail.</p>');
