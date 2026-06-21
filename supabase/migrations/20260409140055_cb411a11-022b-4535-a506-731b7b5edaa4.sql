CREATE POLICY "Anon can read notifications"
ON public.notifications
FOR SELECT
TO anon
USING (true);