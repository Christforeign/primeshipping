GRANT DELETE ON public.user_notifications TO authenticated;
CREATE POLICY "notif own delete" ON public.user_notifications FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE OR REPLACE FUNCTION public.purge_old_notifications() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.user_notifications WHERE created_at < now() - interval '10 minutes' OR is_read = true;
  RETURN NULL;
END $$;
CREATE TRIGGER trg_purge_old_notifications AFTER INSERT ON public.user_notifications FOR EACH STATEMENT EXECUTE FUNCTION public.purge_old_notifications();