import { describe, expect, it } from "vitest";
import { deliveryPricing, fixedProductTotals, productCurrency } from "./product-commerce";
describe("Product currency and delivery", () => {
  it("keeps a 1500 gourde product exactly 1500 gourdes", () => {
    const total = fixedProductTotals(1500, 1, { price_currency: "HTG" }, 135);
    expect(total.totalHtg).toBe(1500);
    expect(total.totalUsd).toBe(11.12);
  });
  it("retains USD prices", () => { expect(fixedProductTotals(15, 2, {}, 135).totalHtg).toBe(4050); });
  it("makes pickup free despite configured delivery fees", () => { expect(deliveryPricing({ delivery_pricing: "fixed", delivery_fee_htg: 500 }, false)).toEqual({ quote: false, feeHtg: 0 }); });
  it("adds the product delivery fee once per order", () => { expect(fixedProductTotals(1500, 2, { price_currency: "HTG", delivery_pricing: "fixed", delivery_fee_htg: 500 }, 135, 0, 0, 0, true).totalHtg).toBe(3500); });
  it("does not charge an unknown delivery fee", () => { expect(deliveryPricing({ delivery_pricing: "quote", delivery_fee_htg: 500 }, true)).toEqual({ quote: true, feeHtg: 0 }); });
  it("keeps free amount products in USD", () => { expect(productCurrency({ price_currency: "HTG", amount_mode: "custom_usd" })).toBe("USD"); });
});describe("Gourdes to USD wallet debit", () => {
  it("rounds 2250 GDS at rate 135 up to 16.67 USD, never losing a centime", () => {
    const total = fixedProductTotals(2250, 1, { price_currency: "HTG" }, 135);
    expect(total.totalHtg).toBe(2250);
    expect(total.totalUsd).toBe(16.67);
    expect(total.totalUsd * 135).toBeGreaterThanOrEqual(2250);
  });
  it("never debits less than the exact gourde value", () => {
    const total = fixedProductTotals(1000, 3, { price_currency: "HTG" }, 135);
    expect(total.totalUsd * 135).toBeGreaterThanOrEqual(3000 - 0.001);
  });
});
