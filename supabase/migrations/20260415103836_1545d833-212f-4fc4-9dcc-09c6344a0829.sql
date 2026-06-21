
-- Create comments table for community reviews
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Anônimo',
  message text NOT NULL,
  rating integer DEFAULT 5,
  parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  is_admin boolean NOT NULL DEFAULT false,
  is_approved boolean NOT NULL DEFAULT false,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_comment_rating()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_comment_rating
BEFORE INSERT OR UPDATE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.validate_comment_rating();

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Public reads only approved comments
CREATE POLICY "Public read approved" ON public.comments
  FOR SELECT TO anon, authenticated USING (is_approved = true);

-- Admins manage all comments
CREATE POLICY "Admins manage comments" ON public.comments
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can submit (moderated)
CREATE POLICY "Anyone can submit" ON public.comments
  FOR INSERT TO anon, authenticated
  WITH CHECK (is_approved = false AND is_admin = false AND parent_id IS NULL);

-- Service role full access
CREATE POLICY "Service role manages comments" ON public.comments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Index for faster queries
CREATE INDEX idx_comments_approved ON public.comments (is_approved, created_at DESC);
CREATE INDEX idx_comments_parent ON public.comments (parent_id) WHERE parent_id IS NOT NULL;
