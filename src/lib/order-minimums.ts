export const DEFAULT_ORDER_NOTICE = "En passant votre commande, vous acceptez nos conditions d’utilisation. Les produits numériques ne sont pas remboursables, sous réserve des droits prévus par la loi applicable. Votre commande peut être finalisée instantanément ou sous 5 à 20 minutes ; en cas de retard, le traitement peut prendre 24 heures ou plus.";

export type OrderMinimums = { minimum_quantity?: number; minimum_order_usd?: number; order_notice?: string };

export function minimumQuantity(extra?: OrderMinimums | null) {
  const value = Number(extra?.minimum_quantity);
  return Number.isInteger(value) && value >= 1 && value <= 999 ? value : 1;
}

// For custom-USD products the minimum applies to the requested amount, not the wallet conversion.
export function orderMinimumError(extra: OrderMinimums | null | undefined, quantity: number, amountUsd: number, customAmount = false) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) return "Quantité invalide.";
  if (!customAmount && quantity < minimumQuantity(extra)) return `Quantité minimum : ${minimumQuantity(extra)}.`;
  const minimum = Number(extra?.minimum_order_usd) || 0;
  if (!Number.isFinite(amountUsd) || amountUsd < minimum) return `Montant minimum de commande : ${minimum.toFixed(2)} USD.`;
  return null;
}