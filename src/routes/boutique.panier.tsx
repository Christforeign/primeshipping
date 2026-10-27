import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ShoppingBag, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/lib/settings";
import { productCurrency } from "@/lib/product-commerce";
import { topupPrice } from "@/lib/product-pricing";
import { readCart, useCart, writeCart, type CartSelection } from "@/lib/cart";
import { cartShareUrl, decodeCartShare } from "@/lib/share";
import { ShareButtons } from "@/components/ShareButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductItem } from "@/lib/types-store";

export const Route = createFileRoute("/boutique/panier")({
  validateSearch: (search: Record<string, unknown>) => ({ partage: typeof search.partage === "string" ? search.partage : undefined }),
  head: () => ({ meta: [
    { title: "Mon panier — Prime Shipping" },
    { name: "description", content: "Retrouvez vos articles et finalisez vos commandes Prime Shipping." },
    { property: "og:title", content: "Mon panier — Prime Shipping" },
    { property: "og:description", content: "Vos articles et options de commande Prime Shipping." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: CartPage,
});

function CartPage() {
  const { items, update } = useCart();
  const settings = useSettings();
  const navigate = useNavigate();
  const { partage } = Route.useSearch();

  // Un lien de panier partagé remplace le panier de l'appareil qui l'ouvre.
  useEffect(() => {
    if (!partage) return;
    const shared = decodeCartShare(partage);
    if (shared) {
      writeCart(shared);
      toast.success("Panier partagé chargé ! Vous pouvez finaliser vos commandes.");
    } else {
      toast.error("Ce lien de panier est invalide ou expiré.");
    }
    void navigate({ to: "/boutique/panier", search: {}, replace: true });
  }, [partage, navigate]);
  const productsQ = useQuery({
    queryKey: ["cart-products", items.map((item) => item.productId).sort().join(",")],
    enabled: items.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("is_active", true).in("id", items.map((item) => item.productId));
      if (error) throw error;
      return (data || []) as unknown as ProductItem[];
    },
  });
  const checkout = (item: CartSelection) => {
    sessionStorage.setItem("prime_checkout", JSON.stringify({ ...item, cartKey: item.key }));
    navigate({ to: "/boutique/commande" });
  };
  return <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
    <div className="flex items-center justify-between gap-3"><h1 className="text-2xl font-bold">Mon panier</h1><Button asChild variant="ghost" size="icon" aria-label="Fermer le panier"><Link to="/boutique"><X className="h-5 w-5" /></Link></Button></div>
    {!items.length ? <div className="py-16 text-center space-y-4"><ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground" /><p>Votre panier est vide.</p><Button asChild><Link to="/boutique">Continuer mes achats</Link></Button></div> : <>
      {productsQ.isError ? <div role="alert" className="space-y-3"><p>Impossible de charger les articles.</p><Button variant="outline" onClick={() => productsQ.refetch()}>Réessayer</Button></div> : productsQ.isPending ? <p>Chargement…</p> : items.map((item) => {
        const product = productsQ.data?.find((entry) => entry.id === item.productId);
        const variant = product?.variants?.find((entry) => entry.id === item.variantId);
        const available = Boolean(product) && (!item.variantId || Boolean(variant));
        let recharge = 0;
        if (item.requestedAmountUsd && product?.extra?.amount_mode === "custom_usd") { try { recharge = topupPrice(item.requestedAmountUsd, Number(product.extra.product_rate_htg), Number(settings?.usd_to_htg)).totalHtg; } catch { /* invalid prices are rejected at checkout */ } }
        const unit = recharge || Number(variant ? variant.promo_price_usd ?? variant.price_usd : product?.promo_price_usd ?? product?.price_usd) || 0;
        return <article key={item.key} className="border-b pb-6 space-y-3">
          <div className="flex gap-4 items-start">
            {product?.media_urls?.[0] && <img src={product.media_urls[0]} alt="" className="h-20 w-20 rounded-lg object-contain bg-muted shrink-0" />}
            <div className="min-w-0 flex-1"><h2 className="font-semibold break-words">{product?.title || "Article indisponible"}</h2>{variant && <p className="text-sm text-muted-foreground">{variant.name}</p>}<p className="mt-2 font-semibold">{product?.extra?.amount_mode === "custom_usd" ? `${recharge.toFixed(2)} GDS` : `${(unit * item.quantity).toFixed(2)} ${productCurrency(product?.extra)}`}</p></div>
            <Button variant="ghost" size="icon" aria-label="Retirer l'article" onClick={() => update(items.filter((entry) => entry.key !== item.key))}><Trash2 className="h-4 w-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-3 items-center justify-between">{item.requestedAmountUsd ? <span className="text-sm">Recharge : {item.requestedAmountUsd} USD</span> : <label className="flex items-center gap-2 text-sm">Quantité<Input aria-label={`Quantité ${product?.title || "article"}`} type="number" min={1} max={999} className="w-20" value={item.quantity} onChange={(event) => { const quantity = Math.max(1, Math.min(999, Math.floor(Number(event.target.value) || 1))); update(items.map((entry) => entry.key === item.key ? { ...entry, quantity } : entry)); }} /></label>}<Button disabled={!available} onClick={() => checkout(item)}>Commander cet article</Button></div>
          {Object.entries(item.formValues).map(([key, value]) => <p key={key} className="text-sm text-muted-foreground break-words">{product?.custom_fields?.find((field) => field.id === key)?.label || key} : {Array.isArray(value) ? value.join(", ") : String(value)}</p>)}
        </article>;
      })}
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <Button asChild variant="outline"><Link to="/boutique">Continuer mes achats</Link></Button>
        <ShareButtons
          title="Mon panier Prime Store"
          url={cartShareUrl(items)}
          whatsappText="Voici mon panier Prime Store — ouvre ce lien pour le retrouver tel quel :"
        />
      </div>
    </>}
  </div>;
}