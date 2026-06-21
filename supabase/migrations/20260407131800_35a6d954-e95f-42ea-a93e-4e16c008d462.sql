
CREATE TABLE public.refund_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id),
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  refund_type TEXT NOT NULL CHECK (refund_type IN ('mercadopago', 'wallet')),
  mercadopago_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID
);

ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all refund_requests"
  ON public.refund_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update refund_requests"
  ON public.refund_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read own refund_requests"
  ON public.refund_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages refund_requests"
  ON public.refund_requests FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX idx_refund_requests_status ON public.refund_requests(status);
CREATE INDEX idx_refund_requests_order_id ON public.refund_requests(order_id);
