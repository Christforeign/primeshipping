import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Mail, ShoppingBag, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCart, type CartSelection } from "@/lib/cart";
import { useUser } from "@/lib/session";
import { sendClientEmail } from "@/lib/email.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductItem } from "@/lib/types-store";

export const Route = createFileRoute("/boutique/panier")({
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
  const { user } = useUser();
  const navigate = useNavigate();
  const sendEmail = useServerFn(sendClientEmail);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
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
  const remind = async () => {
    setSending(true);
    try {
      const result = await sendEmail({ data: { kind: "panier", cart: items.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity })) } });
      if (!result.sent) throw new Error(result.reason || "Le rappel n'a pas été envoyé.");
      setSent(true);
      toast.success("Votre panier a été envoyé à l'adresse de votre compte.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Impossible d'envoyer le rappel."); }
    finally { setSending(false); }
  };
  return <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
    <div className="flex items-center justify-between gap-3"><h1 className="text-2xl font-bold">Mon panier</h1><Button asChild variant="ghost" size="icon" aria-label="Fermer le panier"><Link to="/boutique"><X className="h-5 w-5" /></Link></Button></div>
    {!items.length ? <div className="py-16 text-center space-y-4"><ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground" /><p>Votre panier est vide.</p><Button asChild><Link to="/boutique">Continuer mes achats</Link></Button></div> : <>
      {productsQ.isError ? <div role="alert" className="space-y-3"><p>Impossible de charger les articles.</p><Button variant="outline" onClick={() => productsQ.refetch()}>Réessayer</Button></div> : productsQ.isPending ? <p>Chargement…</p> : items.map((item) => {
        const product = productsQ.data?.find((entry) => entry.id === item.productId);
        const variant = product?.variants?.find((entry) => entry.id === item.variantId);
        const available = Boolean(product) && (!item.variantId || Boolean(variant));
        const unit = Number(variant ? variant.promo_price_usd ?? variant.price_usd : product?.promo_price_usd ?? product?.price_usd) || 0;
        return <article key={item.key} className="border-b pb-6 space-y-3">
          <div className="flex gap-4 items-start">
            {product?.media_urls?.[0] && <img src={product.media_urls[0]} alt="" className="h-20 w-20 rounded-lg object-contain bg-muted shrink-0" />}
            <div className="min-w-0 flex-1"><h2 className="font-semibold break-words">{product?.title || "Article indisponible"}</h2>{variant && <p className="text-sm text-muted-foreground">{variant.name}</p>}<p className="mt-2 font-semibold">{(unit * item.quantity).toFixed(2)} USD</p></div>
            <Button variant="ghost" size="icon" aria-label="Retirer l'article" onClick={() => update(items.filter((entry) => entry.key !== item.key))}><Trash2 className="h-4 w-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-3 items-center justify-between"><label className="flex items-center gap-2 text-sm">Quantité<Input aria-label={`Quantité ${product?.title || "article"}`} type="number" min={1} max={999} className="w-20" value={item.quantity} onChange={(event) => { const quantity = Math.max(1, Math.min(999, Math.floor(Number(event.target.value) || 1))); update(items.map((entry) => entry.key === item.key ? { ...entry, quantity } : entry)); }} /></label><Button disabled={!available} onClick={() => checkout(item)}>Commander cet article</Button></div>
          {Object.entries(item.formValues).map(([key, value]) => <p key={key} className="text-sm text-muted-foreground break-words">{product?.custom_fields?.find((field) => field.id === key)?.label || key} : {Array.isArray(value) ? value.join(", ") : String(value)}</p>)}
        </article>;
      })}
      <div className="flex flex-wrap gap-3 justify-between"><Button asChild variant="outline"><Link to="/boutique">Continuer mes achats</Link></Button>{user ? <Button variant="outline" onClick={remind} disabled={sending || sent || productsQ.isError}><Mail className="h-4 w-4 mr-2" />{sending ? "Envoi…" : sent ? "Panier envoyé" : "Recevoir mon panier par e-mail"}</Button> : <Button asChild variant="outline"><Link to="/auth">Se connecter pour recevoir mon panier</Link></Button>}</div>
    </>}
  </div>;
}