type PaymentOption = { id: string; name?: string; is_enabled?: boolean };

export function checkoutPayments<T extends PaymentOption>(configured: T[]): T[] {
  const seen = new Set<string>();
  return configured.filter((payment) => {
    const card = ["stripe", "card", "credit_card", "carte_bancaire"].includes(payment.id) || /carte bancaire|visa|mastercard/i.test(payment.name || "");
    if (!payment.is_enabled || payment.id === "wallet" || card || seen.has(payment.id)) return false;
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

export function paymentDisplayAmount(method: string, usd: number, htg: number) {
  return { amount: method === "wallet" ? usd : htg, currency: method === "wallet" ? "USD" : "GDS" };
}