DO $migration$
DECLARE definition text;
BEGIN
  definition := pg_get_functiondef('public.place_shop_order(jsonb)'::regprocedure);
  IF position('prate:=rate;' in definition) = 0 THEN RAISE EXCEPTION 'Expected pricing definition not found'; END IF;
  definition := replace(definition, 'prate:=rate;', 'prate:=rate;
IF NOT free AND nullif(prod.extra->>''product_rate_htg'','''') IS NOT NULL THEN
prate:=(prod.extra->>''product_rate_htg'')::numeric;
IF prate<=0 OR prate::text IN (''NaN'',''Infinity'',''-Infinity'') THEN RAISE EXCEPTION ''Taux produit invalide''; END IF;
rate:=prate;
END IF;');
  definition := replace(definition, 'amount,prate,rate,prod.media_urls[1]', 'amount,prate,cfg.usd_to_htg,prod.media_urls[1]');
  EXECUTE definition;
END $migration$;
REVOKE ALL ON FUNCTION public.place_shop_order(jsonb) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.place_shop_order(jsonb) TO authenticated;