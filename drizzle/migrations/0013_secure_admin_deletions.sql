CREATE OR REPLACE FUNCTION public.admin_delete_customer_account(_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Non autorisé'; END IF;
  IF _user_id = auth.uid() THEN RAISE EXCEPTION 'Tu ne peux pas supprimer ton propre compte'; END IF;
  IF public.is_staff(_user_id) THEN RAISE EXCEPTION 'Retire les droits du personnel avant de supprimer ce compte'; END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id) THEN RAISE EXCEPTION 'Compte introuvable'; END IF;
  DELETE FROM public.wallet_transactions WHERE user_id = _user_id;
  DELETE FROM public.wallets WHERE user_id = _user_id;
  DELETE FROM public.shop_orders WHERE user_id = _user_id;
  DELETE FROM public.customer_carts WHERE user_id = _user_id;
  DELETE FROM public.support_messages WHERE user_id = _user_id;
  DELETE FROM public.user_notifications WHERE user_id = _user_id;
  DELETE FROM public.app_error_logs WHERE user_id = _user_id;
  UPDATE public.wallet_transactions SET package_id = NULL WHERE package_id IN (SELECT id FROM public.packages WHERE user_id = _user_id);
  DELETE FROM public.packages WHERE user_id = _user_id;
  DELETE FROM public.addresses WHERE user_id = _user_id;
  DELETE FROM auth.users WHERE id = _user_id;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_delete_customer_account(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_customer_account(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_package(_package_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Non autorisé'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.packages WHERE id = _package_id FOR UPDATE) THEN RAISE EXCEPTION 'Colis introuvable'; END IF;
  UPDATE public.wallet_transactions SET package_id = NULL WHERE package_id = _package_id;
  DELETE FROM public.packages WHERE id = _package_id;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_delete_package(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_package(uuid) TO authenticated;