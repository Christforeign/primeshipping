CREATE OR REPLACE FUNCTION public.request_wallet_topup(_amount_usd numeric, _amount_htg numeric, _method text, _reference text, _proof_url text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid; _name text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Non connecté'; END IF;
  IF _amount_usd IS NULL OR _amount_usd <= 0 THEN RAISE EXCEPTION 'Montant invalide'; END IF;
  SELECT full_name INTO _name FROM profiles WHERE id = auth.uid();
  INSERT INTO wallet_transactions(user_id,user_name,type,amount_usd,amount_htg,method,reference,proof_url,status,description,created_by)
  VALUES (auth.uid(),_name,'topup',_amount_usd,COALESCE(_amount_htg,0),COALESCE(_method,'manuel'),_reference,_proof_url,'pending','Demande de recharge',auth.uid())
  RETURNING id INTO _id;
  RETURN _id;
END $$;

CREATE OR REPLACE FUNCTION public.review_wallet_topup(_tx_id uuid, _approve boolean)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t wallet_transactions%ROWTYPE;
BEGIN
  IF NOT is_admin(auth.uid()) AND NOT has_role(auth.uid(),'agent_finance') THEN RAISE EXCEPTION 'Non autorisé'; END IF;
  SELECT * INTO t FROM wallet_transactions WHERE id = _tx_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Transaction introuvable'; END IF;
  IF t.status <> 'pending' THEN RAISE EXCEPTION 'Déjà traitée'; END IF;
  IF _approve THEN
    INSERT INTO wallets(user_id, balance_usd) VALUES (t.user_id, 0) ON CONFLICT DO NOTHING;
    UPDATE wallets SET balance_usd = balance_usd + t.amount_usd, updated_at = now() WHERE user_id = t.user_id;
    UPDATE wallet_transactions SET status='approved' WHERE id=_tx_id;
    INSERT INTO user_notifications(user_id,title,body,link) VALUES (t.user_id,'Recharge validée', t.amount_usd||' USD ajoutés à votre portefeuille','/compte/portefeuille');
    RETURN 'approved';
  ELSE
    UPDATE wallet_transactions SET status='rejected' WHERE id=_tx_id;
    INSERT INTO user_notifications(user_id,title,body,link) VALUES (t.user_id,'Recharge refusée','Votre demande de '||t.amount_usd||' USD a été refusée','/compte/portefeuille');
    RETURN 'rejected';
  END IF;
END $$;

GRANT EXECUTE ON FUNCTION public.request_wallet_topup(numeric,numeric,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_wallet_topup(uuid,boolean) TO authenticated;