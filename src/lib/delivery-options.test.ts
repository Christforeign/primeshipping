import { describe, expect, it } from "vitest";
import { deliveryChoices } from "./delivery-options";
describe("product reception options", () => {
  it("offers delivery and branch pickup for both", () => expect(deliveryChoices("both")).toEqual({ home: true, pickup: true }));
  it("limits delivery-only products to home", () => expect(deliveryChoices("home")).toEqual({ home: true, pickup: false }));
  it("limits pickup-only products to the branch", () => expect(deliveryChoices("pickup")).toEqual({ home: false, pickup: true }));
});