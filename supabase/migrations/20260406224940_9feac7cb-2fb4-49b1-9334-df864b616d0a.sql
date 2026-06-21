
-- 1. Remove public read policy on api_config that leaks profit margin
DROP POLICY IF EXISTS "Public read profit_margin" ON public.api_config;

-- 2. user_roles: block INSERT/UPDATE/DELETE for non-admins (currently no INSERT/UPDATE/DELETE policies exist, which is good, but let's be explicit)
-- Add admin-only INSERT
CREATE POLICY "Only admins insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add admin-only UPDATE
CREATE POLICY "Only admins update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add admin-only DELETE
CREATE POLICY "Only admins delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
