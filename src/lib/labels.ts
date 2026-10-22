import type { Database } from "@/integrations/supabase/types";

export type PackageStatus = Database["public"]["Enums"]["package_status"];
export type AppRole = Database["public"]["Enums"]["app_role"];
export type AddressKind = Database["public"]["Enums"]["address_kind"];

export const PACKAGE_STATUSES: {
  value: PackageStatus;
  label: string;
  tone: "muted" | "progress" | "ready" | "done" | "alert";
}[] = [
  { value: "declare", label: "Déclaré", tone: "muted" },
  { value: "attente_reception", label: "En attente de réception", tone: "muted" },
  { value: "recu_entrepot", label: "Reçu à l'entrepôt", tone: "progress" },
  { value: "preparation", label: "En préparation", tone: "progress" },
  { value: "expedie", label: "Expédié", tone: "progress" },
  { value: "en_transit", label: "En transit", tone: "progress" },
  { value: "arrive_haiti", label: "Arrivé en Haïti", tone: "progress" },
  { value: "douane", label: "En traitement douanier", tone: "progress" },
  { value: "disponible_retrait", label: "Disponible au retrait", tone: "ready" },
  { value: "livraison_locale", label: "En cours de livraison locale", tone: "ready" },
  { value: "livre", label: "Livré", tone: "done" },
  { value: "incident", label: "Incident", tone: "alert" },
  { value: "retourne", label: "Retourné", tone: "alert" },
];

export const statusLabel = (s: PackageStatus) =>
  PACKAGE_STATUSES.find((x) => x.value === s)?.label ?? s;
export const statusTone = (s: PackageStatus) =>
  PACKAGE_STATUSES.find((x) => x.value === s)?.tone ?? "muted";

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
