import { describe, it, expect } from "vitest";
import { productPreview } from "./text-preview";
describe("productPreview", () => {
  it("raccourcit une longue description", () => {
    const out = productPreview({ description: "mot ".repeat(100) }, 90);
    expect(out.length).toBeLessThanOrEqual(91);
    expect(out.endsWith("…")).toBe(true);
  });
  it("préfère la description courte", () => {
    expect(productPreview({ short_description: "Court", description: "Long texte" })).toBe("Court");
  });
});
