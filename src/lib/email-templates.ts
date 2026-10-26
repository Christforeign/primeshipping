export type EmailKind = "transit" | "arrivee" | "facture" | "commande" | "achat" | "support" | "colis_recu" | "portefeuille" | "panier" | "colis_attente" | "colis_succursale" | "colis_stock" | "colis_livre" | "commande_traitement" | "commande_terminee" | "commande_expediee" | "commande_annulee" | "alerte_admin" | "bienvenue";

export type EmailTemplate = { enabled: boolean; subject: string; body: string; color: string };

export const EMAIL_KINDS: { kind: EmailKind; label: string }[] = [
  { kind: "bienvenue", label: "Bienvenue (nouveau compte)" },
  { kind: "commande_traitement", label: "Commande — Paiement approuvé / traitement" },
  { kind: "commande_terminee", label: "Commande — Terminée" },
  { kind: "commande_expediee", label: "Commande — Expédiée" },
  { kind: "commande_annulee", label: "Commande — Annulée" },
  { kind: "alerte_admin", label: "Alertes administrateurs" },
  { kind: "colis_attente", label: "Colis — En attente" },
  { kind: "colis_succursale", label: "Colis — Transit vers la succursale" },
  { kind: "colis_stock", label: "Colis — En stock" },
  { kind: "colis_livre", label: "Colis — Livré" },
  { kind: "panier", label: "Rappel panier (envoyé par l’admin)" },
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
  bienvenue: { enabled: true, color: "#ea580c", subject: "Bienvenue chez Prime Shipping, {{nom}} !", body: "Bonjour {{nom}},\n\nVotre compte Prime Shipping est prêt. Votre code client est {{code}} : indiquez-le sur chaque colis envoyé à notre entrepôt USA.\n\nDepuis votre espace, vous pouvez déclarer vos colis, suivre leur trajet, acheter dans Prime Store et recharger votre portefeuille.\n\nÀ très vite !" },
  commande_traitement: { enabled: true, color: "#0f766e", subject: "Commande {{reference}} — Paiement approuvé", body: "Bonjour {{nom}},\n\nVotre paiement est approuvé. Votre commande est en cours de traitement.\n{{details}}" },
  commande_terminee: { enabled: true, color: "#15803d", subject: "Commande {{reference}} — Terminée", body: "Bonjour {{nom}},\n\nVotre commande est terminée. Merci de votre confiance !\n{{details}}" },
  commande_expediee: { enabled: true, color: "#0f766e", subject: "Commande {{reference}} — Expédiée", body: "Bonjour {{nom}},\n\nVotre commande a été expédiée.\n{{details}}" },
  commande_annulee: { enabled: true, color: "#b91c1c", subject: "Commande {{reference}} — Annulée", body: "Bonjour {{nom}},\n\nVotre commande a été annulée. Notre équipe reste à votre disposition.\n{{details}}" },
  alerte_admin: { enabled: true, color: "#0f766e", subject: "Nouvelle activité — {{reference}}", body: "Une activité nécessite votre attention.\n{{details}}\n\nConnectez-vous pour consulter et valider cette opération." },
  colis_attente: { enabled: true, color: "#ea580c", subject: "Colis {{tracking}} — En attente", body: "Bonjour {{nom}},\n\nVotre colis est enregistré chez Prime Shipping. Notre équipe attend sa réception.\n{{details}}\n\nNous vous informerons dès sa réception." },
  colis_succursale: { enabled: true, color: "#ea580c", subject: "Colis {{tracking}} — En transit vers la succursale", body: "Bonjour {{nom}},\n\nVotre colis poursuit son trajet vers la succursale.\n{{details}}\n\nNous vous préviendrons dès son entrée en stock." },
  colis_stock: { enabled: true, color: "#0f766e", subject: "Colis {{tracking}} — En stock", body: "Bonjour {{nom}},\n\nVotre colis est désormais en stock à la succursale. Notre équipe prépare sa mise à disposition.\n{{details}}\n\nVeuillez attendre la confirmation Disponible avant de vous déplacer." },
  colis_livre: { enabled: true, color: "#15803d", subject: "Colis {{tracking}} — Livré", body: "Bonjour {{nom}},\n\nVotre colis a été remis au destinataire. Son acheminement est terminé.\n{{details}}\n\nMerci de votre confiance. L’équipe Prime Shipping reste à votre écoute." },
  panier: { enabled: true, color: "#0f766e", subject: "Votre panier Prime Shipping", body: "Bonjour {{nom}},\n\nVous avez des articles en attente dans votre panier. Validez votre commande avant qu’ils ne soient plus disponibles :\n{{details}}\n\nRetrouvez votre panier : {{reference}}\nLes prix et disponibilités sont confirmés au paiement." },
  colis_recu: { enabled: true, color: "#0f766e", subject: "Votre colis {{tracking}} est arrivé à notre entrepôt", body: "Bonjour {{nom}},\n\nNous avons reçu votre colis {{tracking}} à notre entrepôt USA.\n{{details}}\n\nCode client : {{code}}" },
  transit: { enabled: true, color: "#1d4ed8", subject: "Votre colis {{tracking}} est en route vers Haïti", body: "Bonjour {{nom}},\n\nVotre colis {{tracking}} est en transit.\n{{details}}" },
  arrivee: { enabled: true, color: "#15803d", subject: "Votre colis {{tracking}} est disponible", body: "Bonjour {{nom}},\n\nBonne nouvelle : votre colis {{tracking}} est arrivé et peut être retiré.\n{{details}}" },
  facture: { enabled: true, color: "#b45309", subject: "Votre facture {{reference}}", body: "Bonjour {{nom}},\n\nVoici votre facture {{reference}} d'un montant de {{montant}}.\n{{details}}" },
  commande: { enabled: true, color: "#7c2d12", subject: "Commande {{reference}} — mise à jour", body: "Bonjour {{nom}},\n\nMerci pour votre commande {{reference}} ({{montant}}).\n{{details}}" },
  achat: { enabled: true, color: "#9d174d", subject: "Mise à jour de votre achat assisté", body: "Bonjour {{nom}},\n\nVotre demande d'achat assisté a été mise à jour.\n{{details}}" },
  portefeuille: { enabled: true, color: "#0e7490", subject: "Mouvement sur votre portefeuille", body: "Bonjour {{nom}},\n\nUn mouvement de {{montant}} a été enregistré sur votre portefeuille.\n{{details}}" },
  support: { enabled: true, color: "#334155", subject: "Réponse du support Prime Express Shipping", body: "Bonjour {{nom}},\n\n{{details}}" },
};

export type EmailVars = Partial<Record<"nom" | "code" | "tracking" | "reference" | "montant" | "details" | "statut" | "prochaine_etape" | "date" | "produit" | "image_produit" | "quantite" | "paiement" | "livraison" | "lien" | "brand", string>>;

export function mergeTemplates(saved: unknown): Record<EmailKind, EmailTemplate> {
  const s = (saved && typeof saved === "object" ? saved : {}) as Partial<Record<EmailKind, Partial<EmailTemplate>>>;
  const out = {} as Record<EmailKind, EmailTemplate>;
  for (const { kind } of EMAIL_KINDS) out[kind] = { ...DEFAULT_TEMPLATES[kind], ...(s[kind] || {}) };
  return out;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
export const fill = (t: string, v: EmailVars) => t.replace(/\{\{(\w+)\}\}/g, (_, k) => (v as Record<string, string>)[k] ?? "");

export function renderEmail(t: EmailTemplate, v: EmailVars, company: string, logoUrl?: string, siteUrl = "https://primeshipping.net") {
  const color = /^#[0-9a-f]{3,8}$/i.test(t.color) ? t.color : "#ea580c";
  const body = esc(fill(t.body, v)).replace(/\n/g, "<br>");
  const safeUrl = (url: string) => /^https:\/\//i.test(url) ? url : "";
  const brandName = v.brand === "store" ? "Prime Store" : "Prime Shipping";
  const logo = safeUrl(logoUrl || "") || `${siteUrl}/logos/${v.brand === "store" ? "prime-store-email.png" : "prime-shipping-email.png"}`;
  const glass = "background:rgba(255,255,255,0.62);border:1px solid rgba(255,255,255,0.85);border-radius:22px;box-shadow:0 10px 30px -12px rgba(31,21,12,0.25),inset 0 1px 0 rgba(255,255,255,0.9)";
  const btn = (href: string, label: string) => `<a href="${esc(href)}" style="display:inline-block;background:${color};background-image:linear-gradient(135deg,#f59e0b,${color});color:#ffffff;padding:14px 26px;border-radius:999px;text-decoration:none;font-weight:800;font-size:15px;box-shadow:0 8px 20px -8px ${color},inset 0 1px 0 rgba(255,255,255,0.45);border:1px solid rgba(255,255,255,0.5);margin:6px 6px 0 0">${label}</a>`;
  const row = (label: string, value?: string) => value ? `<tr><td style="padding:9px 0;border-bottom:1px solid rgba(31,21,12,0.08);font-size:13px;color:#7a6a58">${label}</td><td style="padding:9px 0;border-bottom:1px solid rgba(31,21,12,0.08);font-size:14px;font-weight:700;color:#1f150c;text-align:right">${esc(value)}</td></tr>` : "";
  const img = safeUrl(v.image_produit || "");
  const orderSummary = v.produit ? `<div style="${glass};padding:20px;margin-bottom:22px">${img ? `<img src="${esc(img)}" alt="${esc(v.produit)}" width="200" style="display:block;max-width:100%;height:auto;border-radius:16px;margin:0 auto 16px">` : ""}<div style="font-size:19px;font-weight:800;color:#1f150c;margin:0 0 10px">${esc(v.produit)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${row("Commande", v.reference)}${row("Statut", v.statut)}${row("Quantité", v.quantite)}${row("Total", v.montant)}${row("Paiement", v.paiement)}${row("Réception", v.livraison)}${row("Date", v.date)}</table></div>` : "";
  const summary = v.statut && !v.produit ? `<div style="${glass};padding:20px;margin-bottom:22px;border-left:5px solid ${color}"><div style="font-size:11px;letter-spacing:1.5px;font-weight:700;color:#7a6a58">COLIS ${esc(v.tracking || "")}</div><div style="font-size:26px;font-weight:900;color:${color};margin:6px 0">${esc(v.statut)}</div><div style="font-size:13px;color:#7a6a58">${esc(v.date || "")}</div>${v.prochaine_etape ? `<div style="margin-top:12px;font-size:14px;color:#1f150c">Prochaine étape : <strong>${esc(v.prochaine_etape)}</strong></div>` : ""}</div>` : "";
  const actionUrl = safeUrl(v.lien || "");
  const trackingUrl = `${siteUrl}/suivi?n=${encodeURIComponent(v.tracking || "")}`;
  const buttons = [actionUrl ? btn(actionUrl, v.produit ? "Voir ma commande" : "Consulter sur le site") : "", v.tracking ? btn(trackingUrl, "Suivre mon colis") : "", !actionUrl && !v.tracking ? btn(`${siteUrl}/compte`, "Ouvrir mon espace") : ""].join("");
  const html = `<div style="margin:0;padding:28px 12px;background:#fbf7f1;background-image:radial-gradient(circle at 15% 10%,rgba(245,158,11,0.35),transparent 45%),radial-gradient(circle at 85% 30%,rgba(234,88,12,0.28),transparent 45%),radial-gradient(circle at 40% 95%,rgba(251,191,36,0.3),transparent 50%);font-family:'Segoe UI',Helvetica,Arial,sans-serif">
<div style="max-width:600px;margin:auto">
<div style="text-align:center;padding:6px 0 18px"><div style="display:inline-block;width:96px;height:96px;border-radius:999px;${glass};padding:8px;box-sizing:border-box"><img src="${esc(logo)}" alt="${brandName}" width="80" height="80" style="display:block;width:80px;height:80px;border-radius:999px;object-fit:contain"></div><div style="margin-top:10px;font-size:20px;font-weight:900;color:#1f150c;letter-spacing:-0.3px">${esc(company)}</div><div style="font-size:11px;letter-spacing:2px;font-weight:700;color:${color}">FAST • RELIABLE • GLOBAL</div></div>
<div style="${glass};background:rgba(255,255,255,0.72);padding:28px;color:#1f150c;font-size:15px;line-height:1.7"><div style="height:4px;border-radius:999px;background:${color};background-image:linear-gradient(90deg,#f59e0b,${color});margin:-6px 0 22px"></div>${summary}${orderSummary}${body}<div style="margin-top:22px">${buttons}</div></div>
<div style="text-align:center;padding:18px 10px;color:#7a6a58;font-size:12px">${esc(company)}${v.code ? ` · Code client ${esc(v.code)}` : ""}<br><a href="${esc(siteUrl)}" style="color:${color};text-decoration:none;font-weight:700">${esc(siteUrl.replace(/^https:\/\//, ""))}</a></div>
</div></div>`;
  return { subject: fill(t.subject, v), html };
}
