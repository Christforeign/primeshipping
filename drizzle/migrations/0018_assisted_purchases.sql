-- Achats assistés : stockage réel en base pour alertes admin et suivi fiable
CREATE SEQUENCE IF NOT EXISTS public.assisted_purchase_number_seq START 1;

CREATE TABLE IF NOT EXISTS public.assisted_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number text NOT NULL UNIQUE DEFAULT lpad(nextval('public.assisted_purchase_number_seq')::text, 4, '0'),
  user_id uuid,
  customer_name text NOT NULL DEFAULT '',
  customer_email text NOT NULL DEFAULT '',
  customer_phone text NOT NULL DEFAULT '',
  store_name text NOT NULL DEFAULT '',
  product_link text NOT NULL DEFAULT '',
  product_image_url text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  exact_price_usd numeric NOT NULL DEFAULT 0,
  fee_usd numeric NOT NULL DEFAULT 0,
  tax_usd numeric NOT NULL DEFAULT 0,
  total_usd numeric NOT NULL DEFAULT 0,
  total_htg numeric NOT NULL DEFAULT 0,
  site_rate_htg numeric NOT NULL DEFAULT 0,
  payment_choice text NOT NULL DEFAULT 'pending_admin',
  payment_status text NOT NULL DEFAULT 'pending_verification',
  status text NOT NULL DEFAULT 'en_attente_validation',
  deduct_from_wallet_after_verification boolean NOT NULL DEFAULT true,
  delivery_city text NOT NULL DEFAULT '',
  delivery_address text NOT NULL DEFAULT '',
  admin_notes text NOT NULL DEFAULT '',
  tracking_number text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE, DELETE ON public.assisted_purchases TO authenticated;
GRANT ALL ON public.assisted_purchases TO service_role;
ALTER TABLE public.assisted_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ap read own or staff" ON public.assisted_purchases FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "ap staff update" ON public.assisted_purchases FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "ap staff delete" ON public.assisted_purchases FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));

-- Frais de service calculés côté base à partir des réglages (montant fixe ou pourcentage)
CREATE OR REPLACE FUNCTION public.assisted_purchase_fee(_exact_price numeric)
RETURNS numeric
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _extra jsonb;
BEGIN
  SELECT extra INTO _extra FROM public.company_settings WHERE id = 1;
  IF COALESCE(_extra->>'assisted_purchase_fee_type', 'fixed') = 'percent' THEN
    RETURN round(_exact_price * COALESCE(NULLIF(_extra->>'assisted_purchase_fee_percent', '')::numeric, 5) / 100.0, 2);
  END IF;
  RETURN COALESCE(NULLIF(_extra->>'assisted_purchase_fee_usd', '')::numeric, 5);
EXCEPTION WHEN others THEN
  RETURN 5;
END $$;

-- Prix, frais et totaux toujours recalculés par la base (jamais fournis par le navigateur)
CREATE OR REPLACE FUNCTION public.assisted_purchases_prepare()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _rate numeric;
BEGIN
  SELECT COALESCE(usd_to_htg, 132) INTO _rate FROM public.company_settings WHERE id = 1;
  NEW.fee_usd := public.assisted_purchase_fee(NEW.exact_price_usd);
  NEW.total_usd := round(NEW.exact_price_usd + NEW.fee_usd, 2);
  NEW.site_rate_htg := _rate;
  NEW.total_htg := round(NEW.total_usd * _rate, 2);
  IF NEW.payment_status IS DISTINCT FROM 'verified_paid' THEN
    NEW.payment_status := 'pending_verification';
    NEW.payment_choice := 'pending_admin';
    NEW.status := 'en_attente_validation';
  END IF;
  IF NEW.customer_email = '' AND auth.jwt() ->> 'email' IS NOT NULL THEN
    NEW.customer_email := auth.jwt() ->> 'email';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS assisted_purchases_prepare_trigger ON public.assisted_purchases;
CREATE TRIGGER assisted_purchases_prepare_trigger BEFORE INSERT ON public.assisted_purchases
FOR EACH ROW EXECUTE FUNCTION public.assisted_purchases_prepare();

-- Création d'une demande par un client connecté, avec débit portefeuille optionnel
CREATE OR REPLACE FUNCTION public.create_assisted_purchase(
  p_exact_price_usd numeric,
  p_store_name text DEFAULT '',
  p_product_link text DEFAULT '',
  p_product_image_url text DEFAULT '',
  p_description text DEFAULT '',
  p_customer_name text DEFAULT '',
  p_customer_phone text DEFAULT '',
  p_delivery_city text DEFAULT '',
  p_delivery_address text DEFAULT '',
  p_deduct_from_wallet boolean DEFAULT true
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _exact numeric;
  _w public.wallets;
  _name text;
  _row public.assisted_purchases;
  _debited boolean := false;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Connectez-vous pour envoyer une demande'; END IF;
  _exact := round(COALESCE(p_exact_price_usd, 0), 2);
  IF _exact < 0 OR _exact > 100000 THEN RAISE EXCEPTION 'Montant invalide'; END IF;

  INSERT INTO public.assisted_purchases(
    user_id, customer_name, customer_phone, store_name, product_link, product_image_url,
    description, exact_price_usd, delivery_city, delivery_address,
    deduct_from_wallet_after_verification
  ) VALUES (
    _uid, COALESCE(p_customer_name, ''), COALESCE(p_customer_phone, ''), COALESCE(p_store_name, ''),
    COALESCE(p_product_link, ''), COALESCE(p_product_image_url, ''), COALESCE(p_description, ''),
    _exact, COALESCE(p_delivery_city, ''), COALESCE(p_delivery_address, ''),
    COALESCE(p_deduct_from_wallet, true)
  ) RETURNING * INTO _row;

  IF COALESCE(p_deduct_from_wallet, true) THEN
    SELECT * INTO _w FROM public.wallets WHERE user_id = _uid FOR UPDATE;
    IF _w IS NOT NULL AND _w.balance_usd >= _row.total_usd THEN
      UPDATE public.wallets SET balance_usd = balance_usd - _row.total_usd, updated_at = now() WHERE id = _w.id;
      SELECT full_name INTO _name FROM public.profiles WHERE id = _uid;
      INSERT INTO public.wallet_transactions(wallet_id, user_id, user_name, type, amount_usd, amount_htg, method, reference, status, description, created_by)
      VALUES (_w.id, _uid, _name, 'debit', _row.total_usd, _row.total_htg, 'wallet', _row.request_number, 'approved', 'Achat assisté ' || _row.request_number, _uid);
      INSERT INTO public.user_notifications(user_id, title, body, link)
      VALUES (_uid, 'Portefeuille débité', _row.total_usd::text || ' USD — Achat assisté ' || _row.request_number, '/achat');
      UPDATE public.assisted_purchases
      SET payment_choice = 'wallet', payment_status = 'verified_paid', status = 'payee', updated_at = now()
      WHERE id = _row.id RETURNING * INTO _row;
      _debited := true;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'id', _row.id,
    'request_number', _row.request_number,
    'total_usd', _row.total_usd,
    'total_htg', _row.total_htg,
    'payment_choice', _row.payment_choice,
    'payment_status', _row.payment_status,
    'status', _row.status,
    'debited', _debited
  );
END $$;
GRANT EXECUTE ON FUNCTION public.create_assisted_purchase(numeric, text, text, text, text, text, text, text, text, boolean) TO authenticated;

-- Mise à jour admin : prix, frais, taxes, statut, notes, débit portefeuille à la validation
CREATE OR REPLACE FUNCTION public.admin_update_assisted_purchase(
  p_id uuid,
  p_exact_price_usd numeric,
  p_fee_usd numeric,
  p_tax_usd numeric,
  p_status text,
  p_admin_notes text,
  p_deduct_from_wallet boolean
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _row public.assisted_purchases;
  _w public.wallets;
  _name text;
  _total numeric;
  _htg numeric;
  _paid boolean;
  _debited boolean := false;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF p_status IS NOT NULL AND p_status NOT IN
    ('en_attente', 'en_attente_validation', 'validee', 'payee', 'achetee', 'en_cours_achat', 'recu_entrepot', 'en_vol', 'expedie', 'disponible', 'annulee')
  THEN RAISE EXCEPTION 'Statut invalide'; END IF;
  SELECT * INTO _row FROM public.assisted_purchases WHERE id = p_id FOR UPDATE;
  IF _row IS NULL THEN RAISE EXCEPTION 'Demande introuvable'; END IF;

  _total := round(COALESCE(p_exact_price_usd, 0) + COALESCE(p_fee_usd, 0) + COALESCE(p_tax_usd, 0), 2);
  _htg := round(_total * COALESCE(NULLIF(_row.site_rate_htg, 0), 132), 2);
  _paid := _row.payment_status = 'verified_paid';

  IF NOT _paid AND COALESCE(p_deduct_from_wallet, true) AND p_status IN ('validee', 'payee') THEN
    SELECT * INTO _w FROM public.wallets WHERE user_id = _row.user_id FOR UPDATE;
    IF _w IS NOT NULL AND _w.balance_usd >= _total THEN
      UPDATE public.wallets SET balance_usd = balance_usd - _total, updated_at = now() WHERE id = _w.id;
      SELECT full_name INTO _name FROM public.profiles WHERE id = _row.user_id;
      INSERT INTO public.wallet_transactions(wallet_id, user_id, user_name, type, amount_usd, amount_htg, method, reference, status, description, created_by)
      VALUES (_w.id, _row.user_id, _name, 'debit', _total, _htg, 'wallet', _row.request_number, 'approved', 'Achat assisté ' || _row.request_number, auth.uid());
      INSERT INTO public.user_notifications(user_id, title, body, link)
      VALUES (_row.user_id, 'Portefeuille débité', _total::text || ' USD — Achat assisté ' || _row.request_number, '/achat');
      _paid := true;
      _debited := true;
    END IF;
  END IF;

  UPDATE public.assisted_purchases SET
    exact_price_usd = COALESCE(p_exact_price_usd, exact_price_usd),
    fee_usd = COALESCE(p_fee_usd, fee_usd),
    tax_usd = COALESCE(p_tax_usd, tax_usd),
    total_usd = _total,
    total_htg = _htg,
    status = COALESCE(p_status, status),
    admin_notes = COALESCE(p_admin_notes, admin_notes),
    deduct_from_wallet_after_verification = COALESCE(p_deduct_from_wallet, deduct_from_wallet_after_verification),
    payment_status = CASE WHEN _paid THEN 'verified_paid' ELSE payment_status END,
    payment_choice = CASE WHEN _paid THEN 'wallet' ELSE payment_choice END,
    updated_at = now()
  WHERE id = p_id RETURNING * INTO _row;

  RETURN jsonb_build_object(
    'id', _row.id,
    'status', _row.status,
    'payment_status', _row.payment_status,
    'total_usd', _row.total_usd,
    'total_htg', _row.total_htg,
    'debited', _debited
  );
END $$;
GRANT EXECUTE ON FUNCTION public.admin_update_assisted_purchase(uuid, numeric, numeric, numeric, text, text, boolean) TO authenticated;
