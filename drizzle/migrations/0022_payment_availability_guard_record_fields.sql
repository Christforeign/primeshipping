CREATE OR REPLACE FUNCTION public.guard_payment_availability() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE method text; configs jsonb; pay jsonb;
BEGIN
 IF TG_TABLE_NAME='shop_orders' THEN method:=NEW.payment_method; ELSE method:=NEW.method; END IF;
 IF method IN ('moncash_auto','natcash_auto','MonCash automatique','NatCash automatique') THEN RAISE EXCEPTION 'Paiement automatique en maintenance : confirmation fournisseur requise'; END IF;
 SELECT extra->'payment_configs' INTO configs FROM public.company_settings WHERE id=1;
 SELECT p INTO pay FROM jsonb_array_elements(CASE WHEN jsonb_typeof(configs)='array' THEN configs ELSE '[]'::jsonb END) p WHERE p->>'id'=method OR lower(p->>'name')=lower(method) LIMIT 1;
 IF TG_TABLE_NAME='shop_orders' AND method<>'wallet' AND pay IS NULL THEN RAISE EXCEPTION 'Mode de paiement inconnu'; END IF;
 IF pay IS NOT NULL AND (NOT coalesce((pay->>'is_enabled')::boolean,false) OR NOT coalesce((pay->>'is_visible')::boolean,true) OR pay->>'availability'='maintenance') THEN RAISE EXCEPTION 'Ce mode de paiement est indisponible'; END IF;
 RETURN NEW;
END $$;