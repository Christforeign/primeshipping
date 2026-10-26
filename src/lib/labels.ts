import type { Database } from "@/integrations/supabase/types";

export type PackageStatus = Database["public"]["Enums"]["package_status"];
export type AppRole = Database["public"]["Enums"]["app_role"];
export type AddressKind = Database["public"]["Enums"]["address_kind"];

export const PACKAGE_STATUSES: {
  value: PackageStatus;
  label: string;
  tone: "muted" | "progress" | "ready" | "done" | "alert";
}[] = [
  { value: "declare", label: "En attente", tone: "muted" },
  { value: "recu_entrepot", label: "Reçu", tone: "progress" },
  { value: "en_transit", label: "En transit", tone: "progress" },
  { value: "livraison_locale", label: "En transit vers la succursale", tone: "progress" },
  { value: "arrive_haiti", label: "En stock", tone: "progress" },
  { value: "disponible_retrait", label: "Disponible", tone: "ready" },
  { value: "livre", label: "Livré", tone: "done" },
];

// Keep historical database values readable without altering existing records.
export const canonicalStatus = (s: PackageStatus): PackageStatus =>
  ({ attente_reception: "declare", preparation: "recu_entrepot", expedie: "en_transit", douane: "arrive_haiti" } as Partial<Record<PackageStatus, PackageStatus>>)[s] ?? s;
export const statusLabel = (s: PackageStatus) =>
  PACKAGE_STATUSES.find((x) => x.value === canonicalStatus(s))?.label ?? ({ incident: "Incident", retourne: "Retourné" } as Partial<Record<PackageStatus, string>>)[s] ?? s;
export const statusTone = (s: PackageStatus) =>
  PACKAGE_STATUSES.find((x) => x.value === canonicalStatus(s))?.tone ?? (s === "incident" || s === "retourne" ? "alert" : "muted");

export function nextPackageStep(s: PackageStatus): string {
  const index = PACKAGE_STATUSES.findIndex((step) => step.value === canonicalStatus(s));
  return index < 0 ? "Contactez notre équipe pour la suite" : PACKAGE_STATUSES[index + 1]?.label ?? "Acheminement terminé";
}

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Administrateur principal",
  admin: "Administrateur",
  agent_colis: "Agent colis",
  agent_finance: "Agent financier",
  agent_support: "Agent support",
};

export const ADDRESS_KIND_LABELS: Record<AddressKind, string> = {
  etranger: "Réception à l'étranger",
  retrait: "Bureau de retrait",
  livraison: "Livraison locale",
};

export const formatDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }) : "—";
