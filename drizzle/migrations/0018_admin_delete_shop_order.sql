CREATE OR REPLACE FUNCTION public.admin_delete_shop_order(_order_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')) THEN
  RAISE EXCEPTION 'Accès administrateur requis' USING ERRCODE = '42501';
 END IF;
 PERFORM 1 FROM public.shop_orders WHERE id = _order_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Commande introuvable'; END IF;
 UPDATE public.wallet_transactions SET order_id = NULL WHERE order_id = _order_id::text;
 DELETE FROM public.shop_orders WHERE id = _order_id;
END; $$;
REVOKE ALL ON FUNCTION public.admin_delete_shop_order(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_shop_order(uuid) TO authenticated;
COMMENT ON FUNCTION public.admin_delete_shop_order(uuid) IS 'Admin-only permanent order removal. Financial ledger entries remain intact; no refund is performed.';