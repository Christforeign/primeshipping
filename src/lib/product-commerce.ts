import type { ProductItem } from "./types-store";

type Extra = ProductItem["extra"];
export const deliveryQuoteNotice = "Un administrateur vous notifiera le tarif de livraison en fonction de votre adresse. Les frais de livraison seront à régler séparément après confirmation.";
export function productCurrency(extra: Extra) { return extra?.amount_mode !== "custom_usd" && extra?.price_currency === "HTG" ? "GDS" : "USD"; }
export function deliveryPricing(extra: Extra, home: boolean) {
  const quote = home && extra?.delivery_pricing !== "fixed";
  return { quote, feeHtg: home && !quote ? Math.max(0, Number(extra?.delivery_fee_htg) || 0) : 0 };
}
export function fixedProductTotals(amount: number, quantity: number, extra: Extra, rate: number, taxRate = 0, feePercent = 0, feeFixedUsd = 0, home = false) {
  const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
  const htg = productCurrency(extra) === "GDS";
  const line = round(amount * quantity);
  const subtotalHtg = htg ? line : round(line * rate);
  const subtotalUsd = htg ? round(line / rate) : line;
  const delivery = deliveryPricing(extra, home);
  // Gourde prices stay exact; USD conversion is only for the USD wallet.
  const taxHtg = htg ? round(subtotalHtg * taxRate / 100) : round(round(subtotalUsd * taxRate / 100) * rate);
  const taxUsd = htg ? round(taxHtg / rate) : round(subtotalUsd * taxRate / 100);
  const feeHtg = htg ? round((subtotalHtg + taxHtg + delivery.feeHtg) * feePercent / 100 + feeFixedUsd * rate) : round(round((subtotalUsd + taxUsd + round(delivery.feeHtg / rate)) * feePercent / 100 + feeFixedUsd) * rate);
  const feeUsd = round(feeHtg / rate);
  const totalHtg = round(subtotalHtg + taxHtg + delivery.feeHtg + feeHtg);
  const totalUsd = htg ? round(totalHtg / rate) : round(subtotalUsd + taxUsd + round(delivery.feeHtg / rate) + feeUsd);
  return { subtotalUsd, subtotalHtg, taxUsd, taxHtg, feeUsd, feeHtg, totalUsd, totalHtg, quote: delivery.quote, deliveryFeeHtg: delivery.feeHtg };
}