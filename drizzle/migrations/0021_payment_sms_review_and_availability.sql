CREATE TABLE public.payment_sms_receipts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 provider text NOT NULL CHECK (provider IN ('moncash','natcash')),
 transaction_id text NOT NULL,
 amount_htg numeric(14,2) NOT NULL CHECK (amount_htg > 0),
 sender_phone text NOT NULL,
 content_code text,
 status text NOT NULL DEFAULT 'needs_review' CHECK (status IN ('needs_review','dismissed')),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(provider, transaction_id)
);
GRANT SELECT, UPDATE ON public.payment_sms_receipts TO authenticated;
GRANT ALL ON public.payment_sms_receipts TO service_role;
ALTER TABLE public.payment_sms_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Finance reads SMS notices" ON public.payment_sms_receipts FOR SELECT TO authenticated USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'agent_finance'));
CREATE POLICY "Finance dismisses SMS notices" ON public.payment_sms_receipts FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'agent_finance')) WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'agent_finance'));
CREATE OR REPLACE FUNCTION public.guard_sms_receipt_update() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF NEW.id IS DISTINCT FROM OLD.id OR NEW.provider IS DISTINCT FROM OLD.provider OR NEW.transaction_id IS DISTINCT FROM OLD.transaction_id OR NEW.amount_htg IS DISTINCT FROM OLD.amount_htg OR NEW.sender_phone IS DISTINCT FROM OLD.sender_phone OR NEW.content_code IS DISTINCT FROM OLD.content_code OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN RAISE EXCEPTION 'Notification immuable'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_sms_receipt_update BEFORE UPDATE ON public.payment_sms_receipts FOR EACH ROW EXECUTE FUNCTION public.guard_sms_receipt_update();
CREATE OR REPLACE FUNCTION public.guard_payment_availability() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE method text; configs jsonb; pay jsonb;
BEGIN
 method := CASE WHEN TG_TABLE_NAME='shop_orders' THEN NEW.payment_method ELSE NEW.method END;
 IF method IN ('moncash_auto','natcash_auto','MonCash automatique','NatCash automatique') THEN RAISE EXCEPTION 'Paiement automatique en maintenance : confirmation fournisseur requise'; END IF;
 SELECT extra->'payment_configs' INTO configs FROM public.company_settings WHERE id=1;
 SELECT p INTO pay FROM jsonb_array_elements(CASE WHEN jsonb_typeof(configs)='array' THEN configs ELSE '[]'::jsonb END) p WHERE p->>'id'=method OR lower(p->>'name')=lower(method) LIMIT 1;
 IF pay IS NOT NULL AND (NOT coalesce((pay->>'is_enabled')::boolean,false) OR NOT coalesce((pay->>'is_visible')::boolean,true) OR pay->>'availability'='maintenance') THEN RAISE EXCEPTION 'Ce mode de paiement est indisponible'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_shop_payment_availability BEFORE INSERT ON public.shop_orders FOR EACH ROW EXECUTE FUNCTION public.guard_payment_availability();
CREATE TRIGGER guard_topup_payment_availability BEFORE INSERT ON public.wallet_transactions FOR EACH ROW WHEN (NEW.type='topup') EXECUTE FUNCTION public.guard_payment_availability();
COMMENT ON TABLE public.payment_sms_receipts IS 'Untrusted phone-relayed SMS notifications; never proof of provider payment and never an automatic wallet credit.';