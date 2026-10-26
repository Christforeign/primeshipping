import { canonicalStatus, type PackageStatus } from "./labels";
import type { EmailKind } from "./email-templates";

export function packageEmailKind(status: PackageStatus): EmailKind {
  const kinds: Partial<Record<PackageStatus, EmailKind>> = {
    declare: "colis_attente", recu_entrepot: "colis_recu", en_transit: "transit",
    livraison_locale: "colis_succursale", arrive_haiti: "colis_stock",
    disponible_retrait: "arrivee", livre: "colis_livre",
  };
  return kinds[canonicalStatus(status)] ?? "support";
}