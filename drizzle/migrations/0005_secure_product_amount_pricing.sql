ALTER TABLE public.shop_orders ADD COLUMN IF NOT EXISTS requested_amount_usd numeric, ADD COLUMN IF NOT EXISTS product_rate_htg numeric, ADD COLUMN IF NOT EXISTS site_rate_htg numeric, ADD COLUMN IF NOT EXISTS product_image_url text;
CREATE OR REPLACE FUNCTION public.place_shop_order(_order jsonb) RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
_uid uuid := auth.uid(); _profile public.profiles; _prod public.products; _settings public.company_settings; _row public.shop_orders;
_variant jsonb; _payment jsonb; _field jsonb; _qty integer; _amount numeric; _rate numeric; _prate numeric; _unit numeric; _subtotal numeric; _tax numeric; _fee numeric; _total numeric; _htg numeric; _bal numeric; _taxrate numeric; _method text := coalesce(_order->>'payment_method',''); _free boolean;
BEGIN
IF _uid IS NULL THEN RAISE EXCEPTION 'Connexion requise'; END IF;
SELECT * INTO _prod FROM public.products WHERE id=_order->>'product_id' AND is_active=true;
IF NOT FOUND THEN RAISE EXCEPTION 'Produit indisponible'; END IF;
IF coalesce(_prod.extra->>'order_mode','site') <> 'site' THEN RAISE EXCEPTION 'Ce produit utilise une commande externe'; END IF;
SELECT * INTO _settings FROM public.company_settings WHERE id=1;
_rate := _settings.usd_to_htg;
IF _rate IS NULL OR _rate<=0 THEN RAISE EXCEPTION 'Taux du site non configuré'; END IF;
SELECT * INTO _profile FROM public.profiles WHERE id=_uid;
_qty:=coalesce((_order->>'quantity')::integer,1);
IF _qty<1 OR _qty>999 THEN RAISE EXCEPTION 'Quantité invalide'; END IF;
_free:=coalesce((_prod.extra->>'amount_mode')='custom_usd',false);
_prate:=_rate;
IF _free THEN
_amount:=(_order->>'requested_amount_usd')::numeric; _prate:=(_prod.extra->>'product_rate_htg')::numeric;
IF _amount IS NULL OR _amount<=0 OR _amount<>round(_amount,2) OR _amount::text IN ('NaN','Infinity') OR _prate IS NULL OR _prate<=0 OR _prate::text IN ('NaN','Infinity') THEN RAISE EXCEPTION 'Montant ou taux produit invalide'; END IF;
_qty:=1; _unit:=round(_amount*_prate/_rate,2); _subtotal:=_unit;
ELSE
IF nullif(_order->>'variant_id','') IS NOT NULL THEN
SELECT v INTO _variant FROM jsonb_array_elements(coalesce(_prod.variants,'[]'::jsonb)) v WHERE v->>'id'=_order->>'variant_id';
IF _variant IS NULL THEN RAISE EXCEPTION 'Variante indisponible'; END IF;
_unit:=coalesce((_variant->>'promo_price_usd')::numeric,(_variant->>'price_usd')::numeric);
ELSE _unit:=coalesce(_prod.promo_price_usd,_prod.price_usd); END IF;
_subtotal:=round(_unit*_qty,2);
END IF;
IF _prod.apply_tax THEN _taxrate:=coalesce(_prod.tax_rate_override,CASE WHEN coalesce((_settings.extra->>'tax_enabled')::boolean,false) THEN coalesce((_settings.extra->>'tax_rate')::numeric,0) ELSE 0 END); ELSE _taxrate:=0; END IF;
_tax:=round(_subtotal*_taxrate/100,2); _fee:=0;
IF _method='' THEN RAISE EXCEPTION 'Mode de paiement requis'; END IF;
IF _method<>'wallet' THEN
SELECT p INTO _payment FROM jsonb_array_elements(coalesce(_settings.extra->'payment_configs','[]'::jsonb)) p WHERE p->>'id'=_method AND coalesce((p->>'is_enabled')::boolean,false);
IF _payment IS NOT NULL THEN
_fee:=round((_subtotal+_tax)*coalesce((_payment->>'fee_percentage')::numeric,0)/100+coalesce((_payment->>'fee_fixed_usd')::numeric,0),2);
IF coalesce((_payment->>'require_proof')::boolean,false) AND nullif(_order->>'payment_proof_url','') IS NULL THEN RAISE EXCEPTION 'Preuve de paiement requise'; END IF;
END IF;
END IF;
FOR _field IN SELECT f FROM jsonb_array_elements(coalesce(_prod.custom_fields,'[]'::jsonb)) f LOOP
IF coalesce((_field->>'required')::boolean,false) AND (coalesce(_order->'custom_field_responses'->>(_field->>'id'),'') IN ('','[]','null')) THEN RAISE EXCEPTION 'Information requise : %',_field->>'label'; END IF;
END LOOP;
_total:=round(_subtotal+_tax+_fee,2); _htg:=CASE WHEN _free AND _tax=0 AND _fee=0 THEN round(_amount*_prate,2) ELSE round(_total*_rate,2) END;
IF _total<=0 OR _total::text IN ('NaN','Infinity') THEN RAISE EXCEPTION 'Montant invalide'; END IF;
IF (_order->>'total_usd')::numeric IS DISTINCT FROM _total THEN RAISE EXCEPTION 'Le prix a changé. Actualisez la commande avant de payer.'; END IF;
IF _method='wallet' THEN SELECT balance_usd INTO _bal FROM public.wallets WHERE user_id=_uid FOR UPDATE; IF coalesce(_bal,0)<_total THEN RAISE EXCEPTION 'Solde du portefeuille insuffisant'; END IF; END IF;
INSERT INTO public.shop_orders(user_id,product_id,product_title,product_kind,variant_id,variant_name,quantity,unit_price_usd,subtotal_usd,tax_amount_usd,service_fee_usd,total_usd,total_htg,customer_name,customer_email,customer_phone,customer_city,delivery_address,custom_field_responses,payment_method,payment_reference,payment_proof_url,status,requested_amount_usd,product_rate_htg,site_rate_htg,product_image_url)
VALUES(_uid,_prod.id,_prod.title,_prod.kind,_variant->>'id',_variant->>'name',_qty,_unit,_subtotal,_tax,_fee,_total,_htg,_profile.full_name,_profile.email,_profile.phone,_profile.city,_order->>'delivery_address',coalesce(_order->'custom_field_responses','{}'::jsonb),_method,CASE WHEN _method='wallet' THEN NULL ELSE _order->>'payment_reference' END,CASE WHEN _method='wallet' THEN NULL ELSE _order->>'payment_proof_url' END,CASE WHEN _method='wallet' THEN 'payee' ELSE 'en_attente' END,_amount,_prate,_rate,_prod.media_urls[1]) RETURNING * INTO _row;
IF _method='wallet' THEN
UPDATE public.wallets SET balance_usd=balance_usd-_total,updated_at=now() WHERE user_id=_uid;
INSERT INTO public.wallet_transactions(user_id,user_name,type,amount_usd,amount_htg,method,status,description,order_id,created_by) VALUES(_uid,_profile.full_name,'debit',_total,_htg,'wallet','approved','Paiement commande '||_row.order_number,_row.id::text,_uid);
END IF;
RETURN json_build_object('id',_row.id,'order_number',_row.order_number,'status',_row.status,'total_usd',_total,'total_htg',_htg);
END $$;
REVOKE ALL ON FUNCTION public.place_shop_order(jsonb) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.place_shop_order(jsonb) TO authenticated;