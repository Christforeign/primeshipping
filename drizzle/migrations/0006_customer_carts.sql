CREATE TABLE public.customer_carts (
  user_id uuid PRIMARY KEY,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_reminded_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_carts TO authenticated;
GRANT ALL ON public.customer_carts TO service_role;
ALTER TABLE public.customer_carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "carts own or staff read" ON public.customer_carts FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "carts own insert" ON public.customer_carts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "carts own or staff update" ON public.customer_carts FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid())) WITH CHECK (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "carts own delete" ON public.customer_carts FOR DELETE TO authenticated USING (user_id = auth.uid());