export const DEFAULT_ORDER_NOTICE = "En passant commande, vous acceptez nos conditions d'utilisation. Les produits numériques ne sont pas remboursables. Vérifiez bien vos informations : aucune commande ne peut être remboursée en cas d'informations erronées. Pour les produits physiques, signalez tout dommage sous 24 heures. Les livraisons peuvent être retardées. En cas de fraude, votre compte sera supprimé et votre commande annulée.";

export type OrderMinimums = { price_currency?: "USD" | "HTG"; minimum_quantity?: number; minimum_order_usd?: number; order_notice?: string };

export function minimumQuantity(extra?: OrderMinimums | null) {
  const value = Number(extra?.minimum_quantity);
  return Number.isInteger(value) && value >= 1 && value <= 999 ? value : 1;
}

// For custom-USD products the minimum applies to the requested amount, not the wallet conversion.
export function orderMinimumError(extra: OrderMinimums | null | undefined, quantity: number, amountUsd: number, customAmount = false) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) return "Quantité invalide.";
  if (!customAmount && quantity < minimumQuantity(extra)) return `Quantité minimum : ${minimumQuantity(extra)}.`;
  const minimum = Number(extra?.minimum_order_usd) || 0;
  if (!Number.isFinite(amountUsd) || amountUsd < minimum) return `Montant minimum de commande : ${minimum.toFixed(2)} ${!customAmount && extra?.price_currency === "HTG" ? "GDS" : "USD"}.`;
  return null;
}