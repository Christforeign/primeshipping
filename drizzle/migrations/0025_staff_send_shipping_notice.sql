CREATE OR REPLACE FUNCTION public.staff_send_shipping_notice(p_kind text, p_request_id uuid, p_suffixes text[] DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.shipping_notice_settings; k text; t text; b text; l text; total integer; list text;
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Forbidden'; END IF;
 INSERT INTO public.shipping_notice_settings(id) VALUES(1) ON CONFLICT DO NOTHING;
 SELECT * INTO s FROM public.shipping_notice_settings WHERE id=1;
 k := 'manual-'||p_kind||'-'||p_request_id::text;
 IF p_kind='arrival' THEN
  t:='Prime Shipping : nouveaux colis reçus'; b:='Nous avons reçu de nouveaux colis. Saisissez votre tracking pour vérifier si le vôtre est reçu. La mise à disposition sera confirmée séparément.'; l:='/suivi';
 ELSIF p_kind='reminder' THEN
  t:='Pensez à déclarer vos colis'; b:='Enregistrez le tracking de vos achats pour faciliter leur identification et recevoir leur suivi personnel.'; l:='/compte/colis/nouveau';
 ELSIF p_kind='suffixes' THEN
  SELECT string_agg('…'||x, ', ') INTO list FROM (SELECT DISTINCT upper(x) x FROM unnest(p_suffixes) x WHERE upper(x) ~ '^[A-Z0-9]{5}$' LIMIT 50) q;
  IF list IS NULL THEN RAISE EXCEPTION 'Aucun code valide'; END IF;
  t:='Prime Shipping : colis reçus à vérifier'; b:='Nous avons reçu des colis se terminant par : '||list||'. Si l’un est à vous, déclarez votre tracking pour qu’il soit attribué à votre compte.'; l:='/compte/colis/nouveau';
 ELSE RAISE EXCEPTION 'Invalid notice'; END IF;
 WITH added AS (INSERT INTO public.shipping_notice_deliveries(campaign_key,user_id,title,body,link,email_status) SELECT k,p.id,t,b,l,CASE WHEN s.email_enabled THEN 'pending' ELSE 'disabled' END FROM public.profiles p ON CONFLICT DO NOTHING RETURNING *)
 INSERT INTO public.user_notifications(user_id,title,body,link) SELECT user_id,title,body,link FROM added;
 GET DIAGNOSTICS total=ROW_COUNT;
 RETURN total;
END $$;
REVOKE ALL ON FUNCTION public.staff_send_shipping_notice(text,uuid,text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.staff_send_shipping_notice(text,uuid,text[]) TO authenticated;