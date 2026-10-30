CREATE OR REPLACE FUNCTION public.commit_priority_import(p_source_key text, p_tracking text, p_reception text, p_consignee text, p_content text, p_weight numeric, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS priority_imports LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE r public.priority_imports; pid uuid; rate numeric;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Forbidden'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(lower(p_tracking),0));
 SELECT * INTO r FROM public.priority_imports WHERE source_key=p_source_key;
 IF FOUND THEN RETURN r; END IF;
 SELECT shipping_rate_per_lb INTO rate FROM public.company_settings WHERE id=1;
 SELECT id INTO pid FROM public.packages WHERE lower(carrier_tracking)=lower(p_tracking) LIMIT 1;
 IF pid IS NOT NULL THEN
  UPDATE public.packages SET status='recu_entrepot', received_at=coalesce(received_at,now()),
   actual_weight_lb=coalesce(p_weight,actual_weight_lb),
   shipping_fee=CASE WHEN rate IS NOT NULL AND p_weight IS NOT NULL THEN round(rate*p_weight,2) ELSE shipping_fee END
  WHERE id=pid AND status IN ('declare','attente_reception');
 ELSIF p_user_id IS NOT NULL THEN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id=p_user_id) THEN RAISE EXCEPTION 'Unknown client'; END IF;
  INSERT INTO public.packages(user_id,merchant,description,carrier_tracking,merchant_order_number,actual_weight_lb,shipping_fee,destination,quantity,status,received_at)
  VALUES(p_user_id,'Transport',coalesce(nullif(p_content,''),'Colis'),p_tracking,nullif(p_reception,''),p_weight,CASE WHEN rate IS NOT NULL AND p_weight IS NOT NULL THEN round(rate*p_weight,2) ELSE NULL END,'Haïti',1,'recu_entrepot',now()) RETURNING id INTO pid;
 END IF;
 INSERT INTO public.priority_imports(source_key,tracking,reception,consignee,content,weight_lb,package_id,email_sent)
 VALUES(p_source_key,p_tracking,p_reception,p_consignee,p_content,p_weight,pid,EXISTS(SELECT 1 FROM public.priority_imports WHERE package_id=pid AND email_sent)) RETURNING * INTO r;
 RETURN r;
END $function$;

CREATE OR REPLACE FUNCTION public.assign_priority_import(p_id uuid, p_user_id uuid)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE r public.priority_imports; pid uuid; rate numeric;
BEGIN
 IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Forbidden'; END IF;
 SELECT * INTO r FROM public.priority_imports WHERE id=p_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Import missing'; END IF;
 IF r.package_id IS NOT NULL THEN RETURN r.package_id; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_user_id) THEN RAISE EXCEPTION 'Unknown client'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(lower(r.tracking),0));
 SELECT id INTO pid FROM public.packages WHERE lower(carrier_tracking)=lower(r.tracking) LIMIT 1;
 IF pid IS NULL THEN
  SELECT shipping_rate_per_lb INTO rate FROM public.company_settings WHERE id=1;
  INSERT INTO public.packages(user_id,merchant,description,carrier_tracking,merchant_order_number,actual_weight_lb,shipping_fee,destination,quantity,status,received_at,created_by)
  VALUES(p_user_id,'Transport',coalesce(nullif(r.content,''),'Colis'),r.tracking,nullif(r.reception,''),r.weight_lb,CASE WHEN rate IS NOT NULL AND r.weight_lb IS NOT NULL THEN round(rate*r.weight_lb,2) ELSE NULL END,'Haïti',1,'recu_entrepot',now(),auth.uid()) RETURNING id INTO pid;
 END IF;
 UPDATE public.priority_imports SET package_id=pid, email_sent=false WHERE id=p_id;
 RETURN pid;
END $function$;