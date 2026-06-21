CREATE POLICY "Public read whatsapp_number"
ON public.api_config FOR SELECT TO anon, authenticated
USING (key_name = 'whatsapp_number');