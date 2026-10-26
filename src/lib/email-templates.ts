export type EmailKind = "transit" | "arrivee" | "facture" | "commande" | "achat" | "support" | "colis_recu" | "portefeuille" | "panier" | "colis_attente" | "colis_succursale" | "colis_stock" | "colis_livre";

export type EmailTemplate = { enabled: boolean; subject: string; body: string; color: string };

export const EMAIL_KINDS: { kind: EmailKind; label: string }[] = [
  { kind: "colis_attente", label: "Colis — En attente" },
  { kind: "colis_succursale", label: "Colis — Transit vers la succursale" },
  { kind: "colis_stock", label: "Colis — En stock" },
  { kind: "colis_livre", label: "Colis — Livré" },
  { kind: "panier", label: "Panier demandé par le client" },
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
  colis_attente: { enabled: true, color: "#ea580c", subject: "Colis {{tracking}} — En attente", body: "Bonjour {{nom}},\n\nVotre colis est enregistré chez Prime Shipping. Notre équipe attend sa réception.\n{{details}}\n\nNous vous informerons dès sa réception." },
  colis_succursale: { enabled: true, color: "#ea580c", subject: "Colis {{tracking}} — En transit vers la succursale", body: "Bonjour {{nom}},\n\nVotre colis poursuit son trajet vers la succursale.\n{{details}}\n\nNous vous préviendrons dès son entrée en stock." },
  colis_stock: { enabled: true, color: "#0f766e", subject: "Colis {{tracking}} — En stock", body: "Bonjour {{nom}},\n\nVotre colis est désormais en stock à la succursale. Notre équipe prépare sa mise à disposition.\n{{details}}\n\nVeuillez attendre la confirmation Disponible avant de vous déplacer." },
  colis_livre: { enabled: true, color: "#15803d", subject: "Colis {{tracking}} — Livré", body: "Bonjour {{nom}},\n\nVotre colis a été remis au destinataire. Son acheminement est terminé.\n{{details}}\n\nMerci de votre confiance. L’équipe Prime Shipping reste à votre écoute." },
  panier: { enabled: true, color: "#0f766e", subject: "Votre panier Prime Shipping", body: "Bonjour {{nom}},\n\nVoici le panier que vous avez demandé à recevoir par e-mail.\n{{details}}\n\nRetrouvez votre panier sur le même appareil : {{reference}}\nLes prix et disponibilités sont confirmés au paiement." },
  colis_recu: { enabled: true, color: "#0f766e", subject: "Votre colis {{tracking}} est arrivé à notre entrepôt", body: "Bonjour {{nom}},\n\nNous avons reçu votre colis {{tracking}} à notre entrepôt USA.\n{{details}}\n\nCode client : {{code}}" },
  transit: { enabled: true, color: "#1d4ed8", subject: "Votre colis {{tracking}} est en route vers Haïti", body: "Bonjour {{nom}},\n\nVotre colis {{tracking}} est en transit.\n{{details}}" },
  arrivee: { enabled: true, color: "#15803d", subject: "Votre colis {{tracking}} est disponible", body: "Bonjour {{nom}},\n\nBonne nouvelle : votre colis {{tracking}} est arrivé et peut être retiré.\n{{details}}" },
  facture: { enabled: true, color: "#b45309", subject: "Votre facture {{reference}}", body: "Bonjour {{nom}},\n\nVoici votre facture {{reference}} d'un montant de {{montant}}.\n{{details}}" },
  commande: { enabled: true, color: "#7c2d12", subject: "Commande {{reference}} — mise à jour", body: "Bonjour {{nom}},\n\nMerci pour votre commande {{reference}} ({{montant}}).\n{{details}}" },
  achat: { enabled: true, color: "#9d174d", subject: "Mise à jour de votre achat assisté", body: "Bonjour {{nom}},\n\nVotre demande d'achat assisté a été mise à jour.\n{{details}}" },
  portefeuille: { enabled: true, color: "#0e7490", subject: "Mouvement sur votre portefeuille", body: "Bonjour {{nom}},\n\nUn mouvement de {{montant}} a été enregistré sur votre portefeuille.\n{{details}}" },
  support: { enabled: true, color: "#334155", subject: "Réponse du support Prime Express Shipping", body: "Bonjour {{nom}},\n\n{{details}}" },
};

export type EmailVars = Partial<Record<"nom" | "code" | "tracking" | "reference" | "montant" | "details" | "statut" | "prochaine_etape" | "date", string>>;

export function mergeTemplates(saved: unknown): Record<EmailKind, EmailTemplate> {
  const s = (saved && typeof saved === "object" ? saved : {}) as Partial<Record<EmailKind, Partial<EmailTemplate>>>;
  const out = {} as Record<EmailKind, EmailTemplate>;
  for (const { kind } of EMAIL_KINDS) out[kind] = { ...DEFAULT_TEMPLATES[kind], ...(s[kind] || {}) };
  return out;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
export const fill = (t: string, v: EmailVars) => t.replace(/\{\{(\w+)\}\}/g, (_, k) => (v as Record<string, string>)[k] ?? "");

export function renderEmail(t: EmailTemplate, v: EmailVars, company: string, logoUrl?: string, siteUrl = "https://primeshipping.net") {
  const color = /^#[0-9a-f]{3,8}$/i.test(t.color) ? t.color : "#0f766e";
  const body = esc(fill(t.body, v)).replace(/\n/g, "<br>");
  const logo = logoUrl || `${siteUrl}/icon-192.png`;
  const trackingUrl = `${siteUrl}/suivi?n=${encodeURIComponent(v.tracking || "")}`;
  const summary = v.statut ? `<div style="padding:20px;background:#f8fafc;border-left:4px solid ${color};margin-bottom:24px"><div style="font-size:12px;color:#64748b">COLIS ${esc(v.tracking || "")}</div><div style="font-size:24px;font-weight:bold;margin:8px 0">${esc(v.statut)}</div><div style="font-size:13px;color:#64748b">${esc(v.date || "")}</div>${v.prochaine_etape ? `<div style="margin-top:14px;font-size:14px">Prochaine étape : <strong>${esc(v.prochaine_etape)}</strong></div>` : ""}</div>` : "";
  const html = `<div style="background:#f1f5f9;padding:24px 12px;font-family:Arial,sans-serif"><div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;overflow:hidden;border-top:5px solid ${color}"><div style="padding:24px 28px;border-bottom:1px solid #e2e8f0"><img src="${esc(logo)}" alt="Prime Shipping" width="64" height="64" style="display:block;object-fit:contain;margin-bottom:12px"><div style="font-size:20px;font-weight:bold;color:#18181b">${esc(company)}</div></div><div style="padding:28px;color:#18181b;font-size:15px;line-height:1.7">${summary}${body}${v.tracking ? `<div style="margin-top:28px"><a href="${esc(trackingUrl)}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:bold">Suivre mon colis</a></div>` : ""}</div><div style="padding:20px 28px;color:#64748b;font-size:12px;border-top:1px solid #e2e8f0">${esc(company)}${v.code ? ` · ${esc(v.code)}` : ""}</div></div></div>`;
  return { subject: fill(t.subject, v), html };
}
