CREATE OR REPLACE FUNCTION public.place_shop_order(_order jsonb) RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); prod public.products; cfg public.company_settings; prof public.profiles; ord public.shop_orders; variant jsonb; pay jsonb; field jsonb; qty integer; amount numeric; rate numeric; prate numeric; unit numeric; subtotal numeric; tax numeric; fee numeric:=0; total numeric; htg numeric; bal numeric; taxrate numeric; method text:=coalesce(_order->>'payment_method',''); free boolean; gourdes boolean; linehtg numeric; taxhtg numeric; feehtg numeric:=0; delivery numeric:=0; home boolean:=false; quote boolean:=false; dmode text;
BEGIN
IF uid IS NULL THEN RAISE EXCEPTION 'Connexion requise'; END IF;
SELECT * INTO prod FROM public.products WHERE id=_order->>'product_id' AND is_active;
IF NOT FOUND THEN RAISE EXCEPTION 'Produit indisponible'; END IF;
IF coalesce(prod.extra->>'order_mode','site')<>'site' THEN RAISE EXCEPTION 'Ce produit utilise une commande externe'; END IF;
SELECT * INTO cfg FROM public.company_settings WHERE id=1; rate:=cfg.usd_to_htg;
IF rate IS NULL OR rate<=0 OR rate::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Taux du site non configuré'; END IF;
SELECT * INTO prof FROM public.profiles WHERE id=uid;
qty:=coalesce((_order->>'quantity')::integer,1);
IF qty<1 OR qty>999 THEN RAISE EXCEPTION 'Quantité invalide'; END IF;
free:=coalesce(prod.extra->>'amount_mode','fixed')='custom_usd'; gourdes:=NOT free AND coalesce(prod.extra->>'price_currency','USD')='HTG'; prate:=rate;
dmode:=_order->>'delivery_mode';
IF prod.requires_shipping_address THEN
IF dmode IS NULL OR dmode NOT IN ('home','pickup') THEN RAISE EXCEPTION 'Choisissez livraison ou retrait'; END IF;
IF (dmode='home' AND prod.delivery_options='pickup') OR (dmode='pickup' AND prod.delivery_options='home') THEN RAISE EXCEPTION 'Mode de réception indisponible'; END IF;
IF nullif(trim(_order->>'delivery_address'),'') IS NULL THEN RAISE EXCEPTION 'Adresse requise'; END IF;
IF dmode='pickup' AND nullif(trim(cfg.pickup_address),'') IS NULL THEN RAISE EXCEPTION 'Adresse de retrait non configurée'; END IF;
home:=dmode='home'; quote:=home AND coalesce(prod.extra->>'delivery_pricing','quote')<>'fixed';
IF home AND NOT quote THEN delivery:=coalesce((prod.extra->>'delivery_fee_htg')::numeric,0); END IF;
END IF;
IF delivery<0 OR delivery::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Tarif livraison invalide'; END IF;
IF free THEN
amount:=(_order->>'requested_amount_usd')::numeric; prate:=(prod.extra->>'product_rate_htg')::numeric;
IF amount IS NULL OR amount<=0 OR amount<>round(amount,2) OR amount::text IN ('NaN','Infinity','-Infinity') OR prate IS NULL OR prate<=0 OR prate::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Montant ou taux produit invalide'; END IF;
qty:=1; unit:=round(amount*prate/rate,2); subtotal:=unit;
ELSE
IF nullif(_order->>'variant_id','') IS NOT NULL THEN
SELECT v INTO variant FROM jsonb_array_elements(coalesce(prod.variants,'[]'::jsonb)) v WHERE v->>'id'=_order->>'variant_id';
IF variant IS NULL THEN RAISE EXCEPTION 'Variante indisponible'; END IF;
unit:=coalesce((variant->>'promo_price_usd')::numeric,(variant->>'price_usd')::numeric);
ELSE unit:=coalesce(prod.promo_price_usd,prod.price_usd); END IF;
IF unit IS NULL OR unit<0 OR unit::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Prix produit invalide'; END IF;
linehtg:=CASE WHEN gourdes THEN round(unit*qty,2) ELSE round(round(unit*qty,2)*rate,2) END;
subtotal:=CASE WHEN gourdes THEN ceil(linehtg/rate*100)/100 ELSE round(unit*qty,2) END;
IF gourdes THEN unit:=ceil(unit/rate*100)/100; END IF;
END IF;
IF prod.apply_tax THEN taxrate:=coalesce(prod.tax_rate_override,CASE WHEN coalesce((cfg.extra->>'tax_enabled')::boolean,false) THEN coalesce((cfg.extra->>'tax_rate')::numeric,0) ELSE 0 END); ELSE taxrate:=0; END IF;
tax:=round(subtotal*taxrate/100,2); taxhtg:=CASE WHEN gourdes THEN round(linehtg*taxrate/100,2) ELSE round(tax*rate,2) END;
IF gourdes THEN tax:=ceil(taxhtg/rate*100)/100; END IF;
IF method='' THEN RAISE EXCEPTION 'Mode de paiement requis'; END IF;
IF method<>'wallet' THEN
SELECT p INTO pay FROM jsonb_array_elements(coalesce(cfg.extra->'payment_configs','[]'::jsonb)) p WHERE p->>'id'=method AND coalesce((p->>'is_enabled')::boolean,false);
IF pay IS NOT NULL THEN
fee:=round((subtotal+tax+round(delivery/rate,2))*coalesce((pay->>'fee_percentage')::numeric,0)/100+coalesce((pay->>'fee_fixed_usd')::numeric,0),2);
feehtg:=CASE WHEN gourdes THEN round((linehtg+taxhtg+delivery)*coalesce((pay->>'fee_percentage')::numeric,0)/100+coalesce((pay->>'fee_fixed_usd')::numeric,0)*rate,2) ELSE round(fee*rate,2) END;
IF gourdes THEN fee:=ceil(feehtg/rate*100)/100; END IF;
IF coalesce((pay->>'require_proof')::boolean,false) AND nullif(_order->>'payment_proof_url','') IS NULL THEN RAISE EXCEPTION 'Preuve de paiement requise'; END IF;
END IF; END IF;
FOR field IN SELECT f FROM jsonb_array_elements(coalesce(prod.custom_fields,'[]'::jsonb)) f LOOP
IF coalesce((field->>'required')::boolean,false) AND coalesce(_order->'custom_field_responses'->>(field->>'id'),'') IN ('','[]','null') THEN RAISE EXCEPTION 'Information requise : %',field->>'label'; END IF;
END LOOP;
total:=round(subtotal+tax+fee+round(delivery/rate,2),2);
htg:=CASE WHEN free THEN CASE WHEN tax=0 AND fee=0 THEN round(amount*prate,2) ELSE round(total*rate,2) END ELSE round(linehtg+taxhtg+feehtg+delivery,2) END;
IF gourdes THEN total:=ceil(htg/rate*100)/100; END IF;
IF total<=0 OR total::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Montant invalide'; END IF;
IF (_order->>'total_usd')::numeric IS DISTINCT FROM total OR (_order->>'total_htg')::numeric IS DISTINCT FROM htg THEN RAISE EXCEPTION 'Le prix a changé. Actualisez la commande avant de payer.'; END IF;
IF method='wallet' THEN SELECT balance_usd INTO bal FROM public.wallets WHERE user_id=uid FOR UPDATE; IF coalesce(bal,0)<total THEN RAISE EXCEPTION 'Solde du portefeuille insuffisant'; END IF; END IF;
INSERT INTO public.shop_orders(user_id,product_id,product_title,product_kind,variant_id,variant_name,quantity,unit_price_usd,subtotal_usd,tax_amount_usd,service_fee_usd,total_usd,total_htg,customer_name,customer_email,customer_phone,customer_city,delivery_address,custom_field_responses,payment_method,payment_reference,payment_proof_url,status,requested_amount_usd,product_rate_htg,site_rate_htg,product_image_url,delivery_mode,delivery_fee_htg,delivery_quote_pending,price_currency)
VALUES(uid,prod.id,prod.title,prod.kind,variant->>'id',variant->>'name',qty,unit,subtotal,tax,fee,total,htg,prof.full_name,prof.email,prof.phone,prof.city,_order->>'delivery_address',coalesce(_order->'custom_field_responses','{}'::jsonb),method,CASE WHEN method='wallet' THEN NULL ELSE _order->>'payment_reference' END,CASE WHEN method='wallet' THEN NULL ELSE _order->>'payment_proof_url' END,CASE WHEN method='wallet' THEN 'payee' ELSE 'en_attente' END,amount,prate,rate,prod.media_urls[1],dmode,delivery,quote,CASE WHEN gourdes THEN 'HTG' ELSE 'USD' END) RETURNING * INTO ord;
IF method='wallet' THEN
UPDATE public.wallets SET balance_usd=balance_usd-total,updated_at=now() WHERE user_id=uid;
INSERT INTO public.wallet_transactions(user_id,user_name,type,amount_usd,amount_htg,method,status,description,order_id,created_by) VALUES(uid,prof.full_name,'debit',total,htg,'wallet','approved','Paiement commande '||ord.order_number,ord.id::text,uid);
END IF;
IF quote THEN INSERT INTO public.user_notifications(user_id,title,body,link) VALUES(uid,'Tarif de livraison à confirmer','Un administrateur vous notifiera le tarif de livraison en fonction de votre adresse. Les frais de livraison seront à régler séparément après confirmation.','/compte/commandes'); END IF;
RETURN json_build_object('id',ord.id,'order_number',ord.order_number,'status',ord.status,'total_usd',total,'total_htg',htg);
END $$;
REVOKE ALL ON FUNCTION public.place_shop_order(jsonb) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.place_shop_order(jsonb) TO authenticated;