CREATE TABLE public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance_usd numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallets own or staff read" ON public.wallets FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid,
  user_id uuid NOT NULL,
  user_name text,
  type text NOT NULL,
  amount_usd numeric NOT NULL,
  amount_htg numeric NOT NULL DEFAULT 0,
  method text NOT NULL DEFAULT 'admin',
  reference text,
  proof_url text,
  status text NOT NULL DEFAULT 'approved',
  description text NOT NULL DEFAULT '',
  package_id uuid,
  order_id text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wtx own or staff read" ON public.wallet_transactions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "wtx admin update" ON public.wallet_transactions FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.admin_adjust_wallet(_user_id uuid, _amount_usd numeric, _reason text)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _w public.wallets; _rate numeric; _name text;
BEGIN
  IF NOT (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'agent_finance')) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  IF _amount_usd = 0 THEN RAISE EXCEPTION 'Montant invalide'; END IF;
  INSERT INTO public.wallets(user_id) VALUES (_user_id) ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO _w FROM public.wallets WHERE user_id = _user_id FOR UPDATE;
  IF _w.balance_usd + _amount_usd < 0 THEN RAISE EXCEPTION 'Solde insuffisant'; END IF;
  UPDATE public.wallets SET balance_usd = balance_usd + _amount_usd, updated_at = now() WHERE id = _w.id;
  SELECT COALESCE(usd_to_htg,132) INTO _rate FROM public.company_settings WHERE id = 1;
  SELECT full_name INTO _name FROM public.profiles WHERE id = _user_id;
  INSERT INTO public.wallet_transactions(wallet_id,user_id,user_name,type,amount_usd,amount_htg,method,reference,status,description,created_by)
  VALUES (_w.id,_user_id,_name,CASE WHEN _amount_usd>0 THEN 'topup' ELSE 'debit' END,abs(_amount_usd),round(abs(_amount_usd)*COALESCE(_rate,132)),'admin',_reason,'approved',COALESCE(_reason,'Ajustement admin'),auth.uid());
  INSERT INTO public.user_notifications(user_id,title,body,link)
  VALUES (_user_id, CASE WHEN _amount_usd>0 THEN 'Portefeuille crédité' ELSE 'Portefeuille débité' END,
    abs(_amount_usd)::text || ' USD — ' || COALESCE(_reason,''), '/compte/portefeuille');
  RETURN _w.balance_usd + _amount_usd;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_adjust_wallet(uuid,numeric,text) TO authenticated;