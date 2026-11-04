import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sendLocalPush } from "@/lib/push-notifications";

const KEY = "prime_random_product_push_at";
const EVERY_MS = 6 * 60 * 60 * 1000; // at most one product highlight every 6 hours

/** While the site is open and notifications are allowed, highlights random available products. */
export function RandomProductNotifier() {
  useEffect(() => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    let last = 0;
    try { last = Number(localStorage.getItem(KEY) || 0); } catch { /* storage denied */ }
    if (Date.now() - last < EVERY_MS) return;
    const timer = setTimeout(async () => {
      const { data } = await supabase.from("products").select("id,title,category,media_urls").eq("is_active", true).limit(50);
      if (!data?.length) return;
      const picks = [...data].sort(() => Math.random() - 0.5).slice(0, 3);
      const first = picks[0];
      if (!first) return;
      const body = picks.length > 1
        ? `${picks.map((p) => p.title).join(" • ")} — disponibles maintenant.`
        : `${first.title} (${first.category}) est disponible.`;
      if (sendLocalPush("🛍️ À découvrir sur Prime Store", { body, icon: first.media_urls?.[0] || "/favicon.ico", url: picks.length > 1 ? "/boutique" : `/boutique/${first.id}`, tag: "random-product" })) {
        try { localStorage.setItem(KEY, String(Date.now())); } catch { /* ignore */ }
      }
    }, 20000);
    return () => clearTimeout(timer);
  }, []);
  return null;
}
