import { describe, expect, it } from "vitest";
import { orderMinimumError } from "./order-minimums";

describe("Minimums administrables par produit", () => {
  it("refuse la quantité inférieure au minimum choisi", () => {
    expect(orderMinimumError({ minimum_quantity: 3 }, 2, 30)).not.toBeNull();
    expect(orderMinimumError({ minimum_quantity: 3 }, 3, 30)).toBeNull();
  });
  it("refuse le montant inférieur au minimum choisi et accepte le seuil", () => {
    expect(orderMinimumError({ minimum_order_usd: 10 }, 1, 9.99)).not.toBeNull();
    expect(orderMinimumError({ minimum_order_usd: 10 }, 1, 10)).toBeNull();
  });
  it("compare le montant libre demandé sans imposer une quantité de recharge", () => {
    expect(orderMinimumError({ minimum_quantity: 3, minimum_order_usd: 20 }, 1, 19.99, true)).not.toBeNull();
    expect(orderMinimumError({ minimum_quantity: 3, minimum_order_usd: 20 }, 1, 20, true)).toBeNull();
  });
  it("ne restreint pas les produits sans minimum", () => {
    expect(orderMinimumError(null, 1, 0.01)).toBeNull();
  });
});