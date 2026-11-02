import asset from "@/assets/prime_shipping_special_rates.jpeg.asset.json";

export const ANNOUNCEMENT_TEXT = `📦 FRAIS DE PORT SPÉCIAUX – PRIME EXPRESS SHIPPING

Découvrez notre grille tarifaire mise à jour pour les téléphones, appareils électroniques et articles légers.

💵 Taxe générale : 1.75 $ par facture

⏱️ Délai de livraison : 4 à 10 jours ouvrables

🇺🇸➡️🇭🇹 Expédition USA – Haïti

⚠️ Certains appareils ou équipements non listés peuvent être soumis à des frais spéciaux. Contactez-nous avant l’envoi pour confirmation.

✅ PRIME Express Shipping YON livrezon pi rapid ak yon tarif ki pi ba🫂🫂🫂🫂🫂🫂🔥🔥🔥🔥🔥🔥`;

export type SiteAnnouncement = { enabled: boolean; imageUrl: string; title: string; message: string; size: "compact" | "large"; frequency: "session" | "always"; version: string };
export const INITIAL_ANNOUNCEMENT: SiteAnnouncement = {
  enabled: true, imageUrl: asset.url, title: "Frais de port spéciaux – Prime Express Shipping", message: ANNOUNCEMENT_TEXT,
  size: "large", frequency: "session", version: "special-rates-2026-11-02",
};
export function readAnnouncement(value: unknown): SiteAnnouncement | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<SiteAnnouncement>;
  return { enabled: v.enabled === true, imageUrl: typeof v.imageUrl === "string" ? v.imageUrl : "", title: typeof v.title === "string" ? v.title : "", message: typeof v.message === "string" ? v.message : "", size: v.size === "compact" ? "compact" : "large", frequency: v.frequency === "always" ? "always" : "session", version: typeof v.version === "string" ? v.version : "" };
}
export function shouldShowAnnouncement(a: SiteAnnouncement | null, dismissedVersion: string | null) {
  return Boolean(a?.enabled && (a.imageUrl || a.message) && (a.frequency === "always" || dismissedVersion !== a.version));
}
export function absoluteAnnouncementImage(url: string) {
  return url.startsWith("/__l5e/assets-v1/") ? `https://primeshipping.lovable.app${url}` : url;
}