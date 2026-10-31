CREATE OR REPLACE FUNCTION public.commit_priority_import(p_source_key text,p_tracking text,p_reception text,p_consignee text,p_content text,p_weight numeric,p_user_id uuid DEFAULT NULL) RETURNS public.priority_imports LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.priority_imports; pid uuid; rate numeric; matches integer;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Forbidden'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(lower(trim(p_tracking)),0));
 SELECT * INTO r FROM public.priority_imports WHERE source_key=p_source_key OR lower(trim(tracking))=lower(trim(p_tracking)) ORDER BY created_at LIMIT 1;
 IF FOUND THEN RETURN r; END IF;
 SELECT shipping_rate_per_lb INTO rate FROM public.company_settings WHERE id=1;
 SELECT count(*) INTO matches FROM public.packages WHERE lower(trim(carrier_tracking))=lower(trim(p_tracking)) OR lower(trim(tracking_number))=lower(trim(p_tracking));
 IF matches=1 THEN
  SELECT id INTO pid FROM public.packages WHERE lower(trim(carrier_tracking))=lower(trim(p_tracking)) OR lower(trim(tracking_number))=lower(trim(p_tracking));
  UPDATE public.packages SET status='recu_entrepot',received_at=coalesce(received_at,now()),actual_weight_lb=coalesce(p_weight,actual_weight_lb),shipping_fee=CASE WHEN rate IS NOT NULL AND p_weight IS NOT NULL THEN round(rate*p_weight,2) ELSE shipping_fee END WHERE id=pid AND status IN ('declare','attente_reception');
 END IF;
 INSERT INTO public.priority_imports(source_key,tracking,reception,consignee,content,weight_lb,package_id) VALUES(p_source_key,trim(p_tracking),p_reception,p_consignee,p_content,p_weight,pid) RETURNING * INTO r;
 RETURN r;
END $$;
CREATE OR REPLACE FUNCTION public.track_package(_tracking text) RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT coalesce(
 (SELECT (jsonb_build_object('tracking_number',p.tracking_number,'status',p.status,'updated_at',p.updated_at,'received_at',p.received_at,'next_step',CASE p.status::text WHEN 'declare' THEN 'Réception du colis' WHEN 'attente_reception' THEN 'Réception du colis' WHEN 'recu_entrepot' THEN 'Départ en transit' WHEN 'preparation' THEN 'Départ en transit' WHEN 'expedie' THEN 'Acheminement vers la succursale' WHEN 'en_transit' THEN 'Acheminement vers la succursale' WHEN 'livraison_locale' THEN 'Entrée en stock à la succursale' WHEN 'arrive_haiti' THEN 'Mise à disposition' WHEN 'douane' THEN 'Mise à disposition' WHEN 'disponible_retrait' THEN 'Retrait ou livraison au destinataire' WHEN 'livre' THEN 'Acheminement terminé' ELSE 'Contactez notre équipe pour la suite' END,'is_owner',coalesce(p.user_id=auth.uid(),false)) || CASE WHEN p.user_id=auth.uid() THEN jsonb_build_object('description',p.description,'weight_lbs',coalesce(p.actual_weight_lb,p.estimated_weight_lb),'events',coalesce((SELECT json_agg(json_build_object('status',e.status,'note',e.note,'created_at',e.created_at) ORDER BY e.created_at DESC) FROM public.package_events e WHERE e.package_id=p.id AND NOT e.is_internal),'[]'::json)) ELSE '{}'::jsonb END)::json FROM public.packages p WHERE upper(trim(p.tracking_number))=upper(trim(_tracking)) OR upper(trim(p.carrier_tracking))=upper(trim(_tracking)) ORDER BY (p.user_id=auth.uid()) DESC NULLS LAST,p.created_at LIMIT 1),
 (SELECT json_build_object('tracking_number',i.tracking,'status','recu_entrepot','updated_at',i.created_at,'received_at',i.created_at,'next_step','Déclarez votre tracking pour permettre son attribution. La disponibilité sera confirmée séparément.','is_owner',false) FROM public.priority_imports i WHERE upper(trim(i.tracking))=upper(trim(_tracking)) AND i.package_id IS NULL ORDER BY i.created_at DESC LIMIT 1))
$$;