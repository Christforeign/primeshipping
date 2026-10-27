import { describe, expect, it } from "vitest";
import { parseAssistedGuestInput } from "./assisted-purchase";

describe("Demandes d'achat assisté sans compte", () => {
  it("refuse un montant invalide", () => {
    expect(parseAssistedGuestInput({ exact_price_usd: -5, customer_phone: "+509 1" }).ok).toBe(false);
    expect(parseAssistedGuestInput({ exact_price_usd: 999999, customer_phone: "+509 1" }).ok).toBe(false);
    expect(parseAssistedGuestInput({ exact_price_usd: "abc", customer_phone: "+509 1" }).ok).toBe(false);
  });
  it("exige un contact e-mail ou téléphone", () => {
    expect(parseAssistedGuestInput({ exact_price_usd: 20, customer_email: "", customer_phone: "" }).ok).toBe(false);
  });
  it("refuse un e-mail mal formé", () => {
    expect(parseAssistedGuestInput({ exact_price_usd: 20, customer_email: "pas-un-email" }).ok).toBe(false);
  });
  it("accepte une demande valide avec téléphone seul et borne le prix à 2 décimales", () => {
    const r = parseAssistedGuestInput({ exact_price_usd: 19.999, customer_phone: "+509 37112233" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.exact_price_usd).toBe(20);
      expect(r.value.customer_name).toBe("Client Prime");
      expect(r.value.store_name).toBe("Multi-sites / À identifier");
    }
  });
  it("refuse une image qui n'est pas une data-URL d'image", () => {
    expect(parseAssistedGuestInput({ exact_price_usd: 20, customer_phone: "1", image_data_url: "http://x" }).ok).toBe(false);
  });
});
