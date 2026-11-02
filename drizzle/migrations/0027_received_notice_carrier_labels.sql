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
  SELECT string_agg('…'||q.x||coalesce(' ('||c.carrier||')',''), ', ' ORDER BY q.x) INTO list
  FROM (SELECT DISTINCT upper(x) x FROM unnest(p_suffixes) x WHERE upper(x) ~ '^[A-Z0-9]{5}$' LIMIT 50) q
  LEFT JOIN LATERAL (
    SELECT CASE WHEN upper(trim(i.tracking)) LIKE 'GFUS%' THEN 'GOFO'
     WHEN trim(i.tracking) ~ '^(9[2345][0-9]{18,24}|[0-9]{30})$' THEN 'USPS'
     WHEN upper(trim(i.tracking)) ~ '^1Z[A-Z0-9]{16}$' THEN 'UPS'
     WHEN upper(trim(i.tracking)) LIKE 'TBA%' THEN 'Amazon Logistics' ELSE NULL END AS carrier
    FROM public.priority_imports i WHERE right(upper(regexp_replace(i.tracking,'[^a-zA-Z0-9]','','g')),5)=q.x
    ORDER BY i.created_at DESC LIMIT 1
  ) c ON true;
  IF list IS NULL THEN RAISE EXCEPTION 'Aucun code valide'; END IF;
  t:='Prime Shipping : C’est ton colis ?'; b:='Colis reçus : '||list||'. Vérifie ton tracking complet et déclare-le pour permettre son attribution. La disponibilité pour le retrait sera confirmée séparément.'; l:='/suivi';
 ELSE RAISE EXCEPTION 'Invalid notice'; END IF;
 WITH added AS (INSERT INTO public.shipping_notice_deliveries(campaign_key,user_id,title,body,link,email_status) SELECT k,p.id,t,b,l,CASE WHEN s.email_enabled THEN 'pending' ELSE 'disabled' END FROM public.profiles p ON CONFLICT DO NOTHING RETURNING *)
 INSERT INTO public.user_notifications(user_id,title,body,link) SELECT user_id,title,body,link FROM added;
 GET DIAGNOSTICS total=ROW_COUNT;
 RETURN total;
END $$;
REVOKE ALL ON FUNCTION public.staff_send_shipping_notice(text,uuid,text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.staff_send_shipping_notice(text,uuid,text[]) TO authenticated;