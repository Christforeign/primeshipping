import { describe, expect, it } from "vitest";
import { checkoutPayments, paymentCoordinates, paymentDisplayAmount } from "./checkout-display";
import { topupPrice } from "./product-pricing";

describe("Affichage du paiement", () => {
  const price = topupPrice(5, 148, 135);
  it("MonCash montre uniquement les 740 gourdes pour les 5 USD choisis au taux produit", () => {
    expect(paymentDisplayAmount("moncash", price.walletUsd, price.totalHtg)).toEqual({ amount: 740, currency: "GDS" });
  });
  it("Prime montre le débit converti de 5,48 USD", () => {
    expect(paymentDisplayAmount("wallet", price.walletUsd, price.totalHtg)).toEqual({ amount: 5.48, currency: "USD" });
  });
  it("NatCash affiche lui aussi les gourdes, pas le débit Prime", () => {
    expect(paymentDisplayAmount("natcash", price.walletUsd, price.totalHtg)).toEqual({ amount: 740, currency: "GDS" });
  });
  it("retire la carte bancaire et conserve MonCash", () => {
    expect(checkoutPayments([{ id: "stripe", is_enabled: true }, { id: "moncash", is_enabled: true }]).map(p => p.id)).toEqual(["moncash"]);
  });
  it("ne répète pas un numéro identique avec espaces", () => {
    expect(paymentCoordinates({ phone_number: "+509 1234 5678", account_number: "+50912345678" })).toEqual(["+509 1234 5678"]);
  });
  it("conserve deux coordonnées réellement différentes", () => {
    expect(paymentCoordinates({ phone_number: "1234", account_number: "5678" })).toEqual(["1234", "5678"]);
  });
});