CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1;

CREATE TABLE public.shop_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE DEFAULT ('#' || lpad(nextval('public.order_number_seq')::text, 4, '0')),
  user_id uuid NOT NULL,
  product_id text,
  product_title text NOT NULL,
  product_kind text,
  variant_id text,
  variant_name text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price_usd numeric NOT NULL DEFAULT 0,
  subtotal_usd numeric NOT NULL DEFAULT 0,
  tax_amount_usd numeric NOT NULL DEFAULT 0,
  service_fee_usd numeric NOT NULL DEFAULT 0,
  total_usd numeric NOT NULL DEFAULT 0,
  total_htg numeric NOT NULL DEFAULT 0,
  customer_name text,
  customer_email text,
  customer_phone text,
  customer_city text,
  delivery_address text,
  custom_field_responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  payment_method text NOT NULL,
  payment_reference text,
  payment_proof_url text,
  status text NOT NULL DEFAULT 'en_attente',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.shop_orders TO authenticated;
GRANT ALL ON public.shop_orders TO service_role;
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders own or staff read" ON public.shop_orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "orders staff update" ON public.shop_orders FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.place_shop_order(_order jsonb)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _p public.profiles;
  _total numeric := coalesce((_order->>'total_usd')::numeric, 0);
  _method text := coalesce(_order->>'payment_method', '');
  _bal numeric;
  _row public.shop_orders;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Connexion requise'; END IF;
  IF _total <= 0 THEN RAISE EXCEPTION 'Montant invalide'; END IF;
  SELECT * INTO _p FROM public.profiles WHERE id = _uid;

  IF _method = 'wallet' THEN
    SELECT balance_usd INTO _bal FROM public.wallets WHERE user_id = _uid FOR UPDATE;
    IF coalesce(_bal, 0) < _total THEN RAISE EXCEPTION 'Solde du portefeuille insuffisant'; END IF;
  END IF;

  INSERT INTO public.shop_orders (user_id, product_id, product_title, product_kind, variant_id, variant_name, quantity,
    unit_price_usd, subtotal_usd, tax_amount_usd, service_fee_usd, total_usd, total_htg,
    customer_name, customer_email, customer_phone, customer_city, delivery_address, custom_field_responses,
    payment_method, payment_reference, payment_proof_url, status)
  VALUES (_uid, _order->>'product_id', coalesce(_order->>'product_title','Commande'), _order->>'product_kind',
    _order->>'variant_id', _order->>'variant_name', greatest(coalesce((_order->>'quantity')::int,1),1),
    coalesce((_order->>'unit_price_usd')::numeric,0), coalesce((_order->>'subtotal_usd')::numeric,0),
    coalesce((_order->>'tax_amount_usd')::numeric,0), coalesce((_order->>'service_fee_usd')::numeric,0),
    _total, coalesce((_order->>'total_htg')::numeric,0),
    coalesce(nullif(_p.full_name,''), _p.email), _p.email, _p.phone, _p.city, _order->>'delivery_address',
    coalesce(_order->'custom_field_responses','{}'::jsonb), _method, _order->>'payment_reference', _order->>'payment_proof_url',
    CASE WHEN _method = 'wallet' THEN 'payee' ELSE 'en_attente' END)
  RETURNING * INTO _row;

  IF _method = 'wallet' THEN
    UPDATE public.wallets SET balance_usd = balance_usd - _total, updated_at = now() WHERE user_id = _uid;
    INSERT INTO public.wallet_transactions (user_id, user_name, type, amount_usd, amount_htg, method, status, description, order_id, created_by)
    VALUES (_uid, _p.full_name, 'debit', _total, _row.total_htg, 'wallet', 'approved', 'Paiement commande ' || _row.order_number, _row.id::text, _uid);
  END IF;

  RETURN json_build_object('id', _row.id, 'order_number', _row.order_number, 'status', _row.status);
END $$;
REVOKE ALL ON FUNCTION public.place_shop_order(jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.place_shop_order(jsonb) TO authenticated;