import { useEffect, useState } from "react";

export type CartSelection = { key: string; productId: string; variantId: string | null; quantity: number; formValues: Record<string, unknown>; requestedAmountUsd?: number };
const STORAGE_KEY = "prime_cart";
export function readCart(): CartSelection[] {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data.filter((item) => typeof item.key === "string" && typeof item.productId === "string" && Number.isInteger(item.quantity) && item.quantity > 0) : [];
  } catch { return []; }
}
export function writeCart(items: CartSelection[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("prime-cart-change"));
  void syncCart(items);
}
/** Copie le panier du client connecté pour que l'équipe puisse lui envoyer un rappel manuel. */
async function syncCart(items: CartSelection[]) {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id;
    if (!uid) return;
    const slim = items.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity }));
    await supabase.from("customer_carts").upsert({ user_id: uid, items: slim as never, updated_at: new Date().toISOString() });
  } catch { /* le panier reste disponible sur l'appareil */ }
}
export function addCartItem(item: Omit<CartSelection, "key">) {
  const items = readCart();
  const existing = items.find((entry) => entry.productId === item.productId && entry.variantId === item.variantId && entry.requestedAmountUsd === item.requestedAmountUsd && JSON.stringify(entry.formValues) === JSON.stringify(item.formValues));
  if (existing && !item.requestedAmountUsd) existing.quantity += item.quantity;
  else items.push({ ...item, key: crypto.randomUUID() });
  writeCart(items);
}
export function useCart() {
  const [items, setItems] = useState<CartSelection[]>([]);
  useEffect(() => {
    const refresh = () => setItems(readCart());
    refresh();
    window.addEventListener("prime-cart-change", refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener("prime-cart-change", refresh); window.removeEventListener("storage", refresh); };
  }, []);
  return { items, update: writeCart };
}