CREATE OR REPLACE FUNCTION public.enforce_product_order_minimums() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE _extra jsonb; _minimum_qty integer; _minimum_usd numeric; _amount numeric; _custom boolean;
BEGIN
SELECT extra INTO _extra FROM public.products WHERE id = NEW.product_id;
IF NOT FOUND THEN RETURN NEW; END IF;
_custom := coalesce(_extra->>'amount_mode', 'fixed') = 'custom_usd';
_minimum_qty := greatest(1, coalesce(nullif(_extra->>'minimum_quantity', '')::integer, 1));
_minimum_usd := greatest(0, coalesce(nullif(_extra->>'minimum_order_usd', '')::numeric, 0));
IF NOT _custom AND NEW.quantity < _minimum_qty THEN RAISE EXCEPTION 'Quantité minimum : %.', _minimum_qty; END IF;
_amount := CASE WHEN _custom THEN NEW.requested_amount_usd ELSE NEW.subtotal_usd END;
IF _amount IS NULL OR _amount < _minimum_usd THEN RAISE EXCEPTION 'Montant minimum de commande : % USD.', _minimum_usd; END IF;
RETURN NEW;
END $$;
CREATE TRIGGER enforce_product_order_minimums BEFORE INSERT ON public.shop_orders FOR EACH ROW EXECUTE FUNCTION public.enforce_product_order_minimums();