import { toast } from "sonner";
import type { CartSelection } from "@/lib/cart";

/** Lien public absolu vers la fiche d'un produit. */
export function productShareUrl(productId: string): string {
  return `${window.location.origin}/boutique/${productId}`;
}

/** Partage natif du téléphone (WhatsApp, TikTok, Messages…) quand il est disponible. */
export async function nativeShare(title: string, url: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.share) return false;
  try {
    await navigator.share({ title, text: title, url });
    return true;
  } catch {
    return false; // partage annulé ou indisponible
  }
}

/** Ouvre WhatsApp avec le message pré-rempli. */
export function shareOnWhatsApp(text: string, url: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, "_blank", "noopener,noreferrer");
}

/** Copie un lien dans le presse-papiers (utilisé aussi pour TikTok, qui n'a pas de lien de partage direct). */
export async function copyShareLink(url: string, label = "Lien copié ! Collez-le où vous voulez (TikTok, messages…)") {
  try {
    await navigator.clipboard.writeText(url);
    toast.success(label);
  } catch {
    toast.error("Impossible de copier le lien sur cet appareil.");
  }
}

// ---------- Partage du panier ----------

type SharedCartItem = { p: string; v: string | null; q: number; a?: number };

/** Réduit le panier aux informations nécessaires au partage. */
function toSharedItems(items: CartSelection[]): SharedCartItem[] {
  return items.map((item) => ({
    p: item.productId,
    v: item.variantId,
    q: item.quantity,
    ...(item.requestedAmountUsd ? { a: item.requestedAmountUsd } : {}),
  }));
}

/** Encode le panier dans un texte compact et sûr pour un lien. */
export function encodeCartShare(items: CartSelection[]): string {
  const json = JSON.stringify(toSharedItems(items));
  return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Décode un panier partagé ; renvoie null si le lien est invalide. */
export function decodeCartShare(encoded: string): CartSelection[] | null {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(escape(atob(base64)));
    const data = JSON.parse(json) as SharedCartItem[];
    if (!Array.isArray(data)) return null;
    const items = data
      .filter((entry) => typeof entry?.p === "string" && Number.isInteger(entry.q) && entry.q > 0 && entry.q <= 999)
      .slice(0, 50)
      .map((entry) => ({
        key: crypto.randomUUID(),
        productId: entry.p,
        variantId: typeof entry.v === "string" ? entry.v : null,
        quantity: entry.q,
        formValues: {},
        ...(typeof entry.a === "number" && entry.a > 0 ? { requestedAmountUsd: entry.a } : {}),
      }));
    return items.length ? items : null;
  } catch {
    return null;
  }
}

/** Lien absolu qui recharge le panier chez la personne qui l'ouvre. */
export function cartShareUrl(items: CartSelection[]): string {
  return `${window.location.origin}/boutique/panier?partage=${encodeCartShare(items)}`;
}
