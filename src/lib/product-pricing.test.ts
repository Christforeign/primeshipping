import { describe, it, expect } from "vitest";
import { topupPrice } from "./product-pricing";
describe("Recharge au taux spécifique", () => {
  it("20 USD à 148 HTG valent 2960 HTG", () => expect(topupPrice(20, 148, 135).totalHtg).toBe(2960));
  it("débite 21,93 USD au taux portefeuille 135", () => expect(topupPrice(20, 148, 135).walletUsd).toBe(21.93));
  it("utilise le taux administré plutôt qu'une constante", () => expect(topupPrice(20, 150, 125).walletUsd).toBe(24));
  it("refuse un montant négatif", () => expect(() => topupPrice(-20, 148, 135)).toThrow());
});