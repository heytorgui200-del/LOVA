-- Allow admins to read all resellers
CREATE POLICY "Admins read all resellers"
ON public.resellers
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update resellers (activate/deactivate, change margin)
CREATE POLICY "Admins update resellers"
ON public.resellers
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete resellers
CREATE POLICY "Admins delete resellers"
ON public.resellers
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to insert resellers
CREATE POLICY "Admins insert resellers"
ON public.resellers
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));