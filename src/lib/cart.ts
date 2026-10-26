import { useEffect, useState } from "react";

export type CartSelection = { key: string; productId: string; variantId: string | null; quantity: number; formValues: Record<string, unknown> };
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
}
export function addCartItem(item: Omit<CartSelection, "key">) {
  const items = readCart();
  const existing = items.find((entry) => entry.productId === item.productId && entry.variantId === item.variantId && JSON.stringify(entry.formValues) === JSON.stringify(item.formValues));
  if (existing) existing.quantity += item.quantity;
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