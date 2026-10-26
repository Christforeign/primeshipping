CREATE TABLE public.app_error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  source text NOT NULL,
  message text NOT NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb
);
GRANT SELECT, INSERT, DELETE ON public.app_error_logs TO authenticated;
GRANT ALL ON public.app_error_logs TO service_role;
ALTER TABLE public.app_error_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs staff read" ON public.app_error_logs FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "logs insert self" ON public.app_error_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "logs staff delete" ON public.app_error_logs FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));