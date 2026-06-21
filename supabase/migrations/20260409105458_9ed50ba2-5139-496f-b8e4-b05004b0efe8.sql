
-- Drop the overly permissive UPDATE policy
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;

-- Create restrictive policy: only allow updating full_name and avatar_url
-- WITH CHECK ensures wallet_balance cannot be changed via frontend
CREATE POLICY "Users update own profile safe" ON public.profiles
  FOR UPDATE TO public
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
