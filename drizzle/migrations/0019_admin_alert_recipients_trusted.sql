-- Alertes administrateurs : les demandes d'achat assisté comptent comme activité récente,
-- et une variante réservée au serveur permet d'alerter lors d'une demande envoyée sans compte.
CREATE OR REPLACE FUNCTION public.admin_alert_recipients()
RETURNS SETOF text
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN; END IF;
  IF NOT public.is_staff(uid)
     AND NOT EXISTS (SELECT 1 FROM public.shop_orders WHERE user_id = uid AND created_at > now() - interval '30 minutes')
     AND NOT EXISTS (SELECT 1 FROM public.packages WHERE user_id = uid AND updated_at > now() - interval '30 minutes')
     AND NOT EXISTS (SELECT 1 FROM public.wallet_transactions WHERE user_id = uid AND created_at > now() - interval '30 minutes')
     AND NOT EXISTS (SELECT 1 FROM public.support_messages WHERE user_id = uid AND created_at > now() - interval '30 minutes')
     AND NOT EXISTS (SELECT 1 FROM public.assisted_purchases WHERE user_id = uid AND updated_at > now() - interval '30 minutes')
  THEN RETURN; END IF;
  RETURN QUERY
    SELECT DISTINCT lower(u.email)::text FROM public.user_roles r
    JOIN auth.users u ON u.id = r.user_id
    WHERE r.role IN ('super_admin','admin') AND u.email IS NOT NULL
    LIMIT 20;
END $$;

CREATE OR REPLACE FUNCTION public.admin_alert_recipients_trusted()
RETURNS SETOF text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT lower(u.email)::text FROM public.user_roles r
  JOIN auth.users u ON u.id = r.user_id
  WHERE r.role IN ('super_admin','admin') AND u.email IS NOT NULL
  LIMIT 20;
$$;
REVOKE ALL ON FUNCTION public.admin_alert_recipients_trusted() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_alert_recipients_trusted() TO service_role;
