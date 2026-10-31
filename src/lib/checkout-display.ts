import { isAutomaticPayment } from './payment-availability';
type PaymentOption = { id: string; name?: string; is_enabled?: boolean; is_visible?: boolean; availability?: string };

export function checkoutPayments<T extends PaymentOption>(configured: T[]): T[] {
  const seen = new Set<string>();
  return configured.filter((payment) => {
    const card = ["stripe", "card", "credit_card", "carte_bancaire"].includes(payment.id) || /carte bancaire|visa|mastercard/i.test(payment.name || "");
    if (payment.is_visible === false || (!payment.is_enabled && payment.is_visible !== true) || payment.id === "wallet" || card || seen.has(payment.id)) return false;
    seen.add(payment.id);
    return true;
  });
}

export function paymentCoordinates(payment: { phone_number?: string; account_number?: string }): string[] {
  const seen = new Set<string>();
  return [payment.phone_number, payment.account_number].flatMap((raw) => {
    const value = raw?.trim();
    if (!value) return [];
    const key = value.replace(/[\s()+.-]/g, "").toLowerCase();
    if (seen.has(key)) return [];
    seen.add(key);
    return [value];
  });
}

/** Gourde-priced products always display in GDS; USD products show USD only for wallet payments. */
export function paymentDisplayAmount(method: string, usd: number, htg: number, gourdes = false) {
  if (gourdes) return { amount: htg, currency: "GDS" };
  return { amount: method === "wallet" ? usd : htg, currency: method === "wallet" ? "USD" : "GDS" };
}

const money = (n: unknown) => (Math.round((Number(n) || 0) * 100) / 100).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** Saved-order total: primary amount in the product's currency, plus the wallet debit when relevant. */
export function orderTotalDisplay(o: { price_currency?: string | null; payment_method?: string | null; total_usd?: unknown; total_htg?: unknown }) {
  const wallet = o.payment_method === "wallet";
  if (o.price_currency === "HTG") return { primary: `${money(o.total_htg)} GDS`, secondary: wallet ? `Débité : ${Number(o.total_usd || 0).toFixed(2)} USD` : "" };
  if (wallet) return { primary: `${Number(o.total_usd || 0).toFixed(2)} USD`, secondary: o.total_htg ? `≈ ${money(o.total_htg)} GDS` : "" };
  return { primary: `${money(o.total_htg)} GDS`, secondary: `≈ ${Number(o.total_usd || 0).toFixed(2)} USD` };
}