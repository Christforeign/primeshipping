import { describe, expect, it } from "vitest";
import { decodeCartShare, encodeCartShare } from "@/lib/share";
import type { CartSelection } from "@/lib/cart";

const sample: CartSelection[] = [
  { key: "k1", productId: "prod-1", variantId: "var-9", quantity: 2, formValues: { taille: "XL" } },
  { key: "k2", productId: "prod-2", variantId: null, quantity: 1, formValues: {}, requestedAmountUsd: 20 },
];

describe("partage du panier", () => {
  it("encode puis décode les articles sans les perdre", () => {
    const decoded = decodeCartShare(encodeCartShare(sample));
    expect(decoded).not.toBeNull();
    expect(decoded).toHaveLength(2);
    expect(decoded![0]).toMatchObject({ productId: "prod-1", variantId: "var-9", quantity: 2 });
    expect(decoded![1]).toMatchObject({ productId: "prod-2", variantId: null, quantity: 1, requestedAmountUsd: 20 });
  });

  it("produit un lien sûr pour une URL (sans +, / ni =)", () => {
    expect(encodeCartShare(sample)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("refuse un lien invalide ou vide", () => {
    expect(decodeCartShare("nimporte-quoi!!!")).toBeNull();
    expect(decodeCartShare(encodeCartShare([]))).toBeNull();
  });

  it("ignore les quantités impossibles", () => {
    const encoded = btoa(JSON.stringify([{ p: "a", v: null, q: 0 }, { p: "b", v: null, q: 5000 }, { p: "c", v: null, q: 3 }]));
    const decoded = decodeCartShare(encoded);
    expect(decoded).toHaveLength(1);
    expect(decoded?.[0]?.productId).toBe("c");
  });
});
