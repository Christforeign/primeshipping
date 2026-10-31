CREATE TABLE public.shipping_notice_settings (id integer PRIMARY KEY DEFAULT 1 CHECK(id=1), arrivals_enabled boolean NOT NULL DEFAULT false, reminders_enabled boolean NOT NULL DEFAULT false, email_enabled boolean NOT NULL DEFAULT false, reminder_days integer NOT NULL DEFAULT 7 CHECK(reminder_days BETWEEN 1 AND 30), email_daily_limit integer NOT NULL DEFAULT 100 CHECK(email_daily_limit BETWEEN 0 AND 100), last_reminder_at timestamptz);
GRANT SELECT, INSERT, UPDATE ON public.shipping_notice_settings TO authenticated;
GRANT ALL ON public.shipping_notice_settings TO service_role;
ALTER TABLE public.shipping_notice_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY shipping_notice_staff ON public.shipping_notice_settings TO authenticated USING(public.is_staff(auth.uid())) WITH CHECK(public.is_staff(auth.uid()));
CREATE TABLE public.shipping_notice_deliveries (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), campaign_key text NOT NULL, user_id uuid NOT NULL, title text NOT NULL, body text NOT NULL, link text NOT NULL, email_status text NOT NULL DEFAULT 'pending' CHECK(email_status IN ('pending','claimed','sent','failed','disabled')), attempted_at timestamptz, email_error text, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(campaign_key,user_id));
GRANT SELECT ON public.shipping_notice_deliveries TO authenticated;
GRANT ALL ON public.shipping_notice_deliveries TO service_role;
ALTER TABLE public.shipping_notice_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY shipping_notice_delivery_staff ON public.shipping_notice_deliveries FOR SELECT TO authenticated USING(public.is_staff(auth.uid()));
CREATE OR REPLACE FUNCTION public.enqueue_shipping_notice(p_kind text) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s public.shipping_notice_settings; k text; t text; b text; l text; total integer;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Forbidden'; END IF;
 INSERT INTO public.shipping_notice_settings(id) VALUES(1) ON CONFLICT DO NOTHING;
 SELECT * INTO s FROM public.shipping_notice_settings WHERE id=1 FOR UPDATE;
 IF p_kind='arrival' THEN
  IF NOT s.arrivals_enabled THEN RETURN 0; END IF;
  k:='arrival-'||to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD'); t:='Prime Shipping : nouveaux colis reçus'; b:='Nous avons reçu de nouveaux colis. Saisissez votre tracking pour vérifier si le vôtre est reçu. La mise à disposition sera confirmée séparément.'; l:='/suivi';
 ELSIF p_kind='reminder' THEN
  IF NOT s.reminders_enabled OR (s.last_reminder_at IS NOT NULL AND s.last_reminder_at > now()-make_interval(days=>s.reminder_days)) THEN RETURN 0; END IF;
  k:='reminder-'||to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD'); t:='Pensez à déclarer vos colis'; b:='Enregistrez le tracking de vos achats pour faciliter leur identification et recevoir leur suivi personnel.'; l:='/compte/colis/nouveau';
  UPDATE public.shipping_notice_settings SET last_reminder_at=now() WHERE id=1;
 ELSE RAISE EXCEPTION 'Invalid notice'; END IF;
 WITH added AS (INSERT INTO public.shipping_notice_deliveries(campaign_key,user_id,title,body,link,email_status) SELECT k,p.id,t,b,l,CASE WHEN s.email_enabled THEN 'pending' ELSE 'disabled' END FROM public.profiles p ON CONFLICT DO NOTHING RETURNING *)
 INSERT INTO public.user_notifications(user_id,title,body,link) SELECT user_id,title,body,link FROM added;
 GET DIAGNOSTICS total=ROW_COUNT;
 RETURN total;
END $$;
REVOKE ALL ON FUNCTION public.enqueue_shipping_notice(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_shipping_notice(text) TO service_role;
CREATE OR REPLACE FUNCTION public.claim_shipping_notice_emails() RETURNS SETOF public.shipping_notice_deliveries LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE lim integer; used integer;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Forbidden'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('shipping-notice-email-budget',0));
 SELECT CASE WHEN email_enabled THEN email_daily_limit ELSE 0 END INTO lim FROM public.shipping_notice_settings WHERE id=1;
 SELECT count(*) INTO used FROM public.shipping_notice_deliveries WHERE attempted_at >= date_trunc('day',now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
 RETURN QUERY UPDATE public.shipping_notice_deliveries SET email_status='claimed',attempted_at=now() WHERE id IN (SELECT id FROM public.shipping_notice_deliveries WHERE email_status='pending' AND created_at>now()-interval '7 days' ORDER BY created_at,id LIMIT least(20,greatest(coalesce(lim,0)-used,0)) FOR UPDATE SKIP LOCKED) RETURNING *;
END $$;
REVOKE ALL ON FUNCTION public.claim_shipping_notice_emails() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_shipping_notice_emails() TO service_role;
CREATE OR REPLACE FUNCTION public.update_priority_weight(p_id uuid,p_weight numeric) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE pid uuid;
BEGIN
 IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Forbidden'; END IF;
 IF p_weight IS NULL OR p_weight<0 OR p_weight>10000 THEN RAISE EXCEPTION 'Invalid weight'; END IF;
 SELECT package_id INTO pid FROM public.priority_imports WHERE id=p_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Import missing'; END IF;
 UPDATE public.priority_imports SET weight_lb=p_weight WHERE id=p_id;
 IF pid IS NOT NULL THEN UPDATE public.packages SET actual_weight_lb=p_weight WHERE id=pid; END IF;
END $$;
REVOKE ALL ON FUNCTION public.update_priority_weight(uuid,numeric) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.update_priority_weight(uuid,numeric) TO authenticated;