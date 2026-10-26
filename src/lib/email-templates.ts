export type EmailKind = "transit" | "arrivee" | "facture" | "commande" | "achat" | "support" | "colis_recu" | "portefeuille";

export type EmailTemplate = { enabled: boolean; subject: string; body: string; color: string };

export const EMAIL_KINDS: { kind: EmailKind; label: string }[] = [
  { kind: "colis_recu", label: "Colis reçu à l'entrepôt" },
  { kind: "transit", label: "Colis en transit" },
  { kind: "arrivee", label: "Colis arrivé / prêt au retrait" },
  { kind: "facture", label: "Facture" },
  { kind: "commande", label: "Commande boutique" },
  { kind: "achat", label: "Achat assisté" },
  { kind: "portefeuille", label: "Portefeuille (crédit / débit)" },
  { kind: "support", label: "Réponse du support" },
];

export const DEFAULT_TEMPLATES: Record<EmailKind, EmailTemplate> = {
  colis_recu: { enabled: true, color: "#0f766e", subject: "Votre colis {{tracking}} est arrivé à notre entrepôt", body: "Bonjour {{nom}},\n\nNous avons reçu votre colis {{tracking}} à notre entrepôt USA.\n{{details}}\n\nCode client : {{code}}" },
  transit: { enabled: true, color: "#1d4ed8", subject: "Votre colis {{tracking}} est en route vers Haïti", body: "Bonjour {{nom}},\n\nVotre colis {{tracking}} est en transit.\n{{details}}" },
  arrivee: { enabled: true, color: "#15803d", subject: "Votre colis {{tracking}} est disponible", body: "Bonjour {{nom}},\n\nBonne nouvelle : votre colis {{tracking}} est arrivé et peut être retiré.\n{{details}}" },
  facture: { enabled: true, color: "#b45309", subject: "Votre facture {{reference}}", body: "Bonjour {{nom}},\n\nVoici votre facture {{reference}} d'un montant de {{montant}}.\n{{details}}" },
  commande: { enabled: true, color: "#7c2d12", subject: "Commande {{reference}} — mise à jour", body: "Bonjour {{nom}},\n\nMerci pour votre commande {{reference}} ({{montant}}).\n{{details}}" },
  achat: { enabled: true, color: "#9d174d", subject: "Mise à jour de votre achat assisté", body: "Bonjour {{nom}},\n\nVotre demande d'achat assisté a été mise à jour.\n{{details}}" },
  portefeuille: { enabled: true, color: "#0e7490", subject: "Mouvement sur votre portefeuille", body: "Bonjour {{nom}},\n\nUn mouvement de {{montant}} a été enregistré sur votre portefeuille.\n{{details}}" },
  support: { enabled: true, color: "#334155", subject: "Réponse du support Prime Express Shipping", body: "Bonjour {{nom}},\n\n{{details}}" },
};

export type EmailVars = Partial<Record<"nom" | "code" | "tracking" | "reference" | "montant" | "details", string>>;

export function mergeTemplates(saved: unknown): Record<EmailKind, EmailTemplate> {
  const s = (saved && typeof saved === "object" ? saved : {}) as Partial<Record<EmailKind, Partial<EmailTemplate>>>;
  const out = {} as Record<EmailKind, EmailTemplate>;
  for (const { kind } of EMAIL_KINDS) out[kind] = { ...DEFAULT_TEMPLATES[kind], ...(s[kind] || {}) };
  return out;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
export const fill = (t: string, v: EmailVars) => t.replace(/\{\{(\w+)\}\}/g, (_, k) => (v as Record<string, string>)[k] ?? "");

export function renderEmail(t: EmailTemplate, v: EmailVars, company: string, logoUrl?: string) {
  const color = /^#[0-9a-f]{3,8}$/i.test(t.color) ? t.color : "#0f766e";
  const body = esc(fill(t.body, v)).replace(/\n/g, "<br>");
  const html = `<div style="background:#f4f4f5;padding:24px;font-family:Arial,sans-serif"><div style="max-width:560px;margin:auto;background:#fff;border-radius:10px;overflow:hidden"><div style="background:${color};color:#fff;padding:18px 22px;font-size:18px;font-weight:bold">${logoUrl ? `<img src="${esc(logoUrl)}" alt="" height="32" style="vertical-align:middle;margin-right:8px">` : ""}${esc(company)}</div><div style="padding:22px;color:#18181b;font-size:15px;line-height:1.6">${body}</div><div style="padding:14px 22px;color:#71717a;font-size:12px;border-top:1px solid #eee">${esc(company)}</div></div></div>`;
  return { subject: fill(t.subject, v), html };
}
