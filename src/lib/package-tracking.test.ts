import { describe, expect, it } from "vitest";
import { PACKAGE_STATUSES, nextPackageStep } from "./labels";
import { packageEmailKind } from "./package-email";

describe("package lifecycle", () => {
  it("keeps the seven requested stages in their order", () => {
    expect(PACKAGE_STATUSES.map((s) => s.value)).toEqual(["declare", "recu_entrepot", "en_transit", "livraison_locale", "arrive_haiti", "disponible_retrait", "livre"]);
  });
  it("uses one specific email kind for every stage", () => {
    expect(PACKAGE_STATUSES.map((s) => packageEmailKind(s.value))).toEqual(["colis_attente", "colis_recu", "transit", "colis_succursale", "colis_stock", "arrivee", "colis_livre"]);
  });
  it("does not treat entry into stock as available", () => {
    expect(nextPackageStep("arrive_haiti")).toBe("Disponible");
    expect(packageEmailKind("arrive_haiti")).toBe("colis_stock");
  });
});