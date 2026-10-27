// @ts-nocheck
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Copy, MapPin, Upload, Wallet, Warehouse, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/lib/settings";
import { useUser, profileQuery } from "@/lib/session";
import { clientStore } from "@/lib/store";
import { sendClientEmail } from "@/lib/email.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNumber } from "@/lib/utils";
import { readCart, writeCart } from "@/lib/cart";
import { fixedProductTotals, deliveryQuoteNotice, productExchangeRate, productCurrency } from "@/lib/product-commerce";
import { topupPrice } from "@/lib/product-pricing";
import { DEFAULT_ORDER_NOTICE, orderMinimumError } from "@/lib/order-minimums";
import { deliveryChoices } from "@/lib/delivery-options";
import { checkoutPayments, paymentCoordinates, paymentDisplayAmount } from "@/lib/checkout-display";

export const Route = createFileRoute("/boutique/commande")({
  head: () => ({
    meta: [
      { title: "Paiement de la commande — Prime Shipping" },
      { name: "description", content: "Finalisez votre commande Prime Shipping : livraison et mode de paiement." },
      { property: "og:title", content: "Paiement de la commande — Prime Shipping" },
      { property: "og:description", content: "Finalisez votre commande Prime Shipping en toute sécurité." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CheckoutPage,
});

type Selection = { productId: string; variantId: string | null; quantity: number; formValues: Record<string, unknown>; requestedAmountUsd?: number; cartKey?: string };

function CheckoutPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const s = useSettings();
  const { user } = useUser();
  const rate = Number(s?.usd_to_htg) || 0;
  const sendEmail = useServerFn(sendClientEmail);

  const [sel, setSel] = useState<Selection | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("prime_checkout");
      if (raw) setSel(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const productQ = useQuery({
    queryKey: ["product", sel?.productId],
    enabled: !!sel?.productId,
    queryFn: async () => {
      if (!sel) return null;
      const { data, error } = await supabase.from("products").select("*").eq("id", sel.productId).eq("is_active", true).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const profile = useQuery(profileQuery(user?.id)).data;
  const walletQ = useQuery({
    queryKey: ["my-wallet", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return 0;
      const { data, error } = await supabase.from("wallets").select("balance_usd").eq("user_id", user.id).maybeSingle();
      if (error) throw error;
      return Number(data?.balance_usd) || 0;
    },
  });
  const walletBalance = Number(walletQ.data) || 0;

  const [payments, setPayments] = useState<any[]>([]);
  useEffect(() => {
    const configured = Array.isArray(s?.payment_configs) ? s.payment_configs : clientStore.getPaymentConfigs();
    setPayments(checkoutPayments(configured));
  }, [s?.payment_configs]);
  const [method, setMethod] = useState<string>("wallet");
  const [deliveryMode, setDeliveryMode] = useState<"pickup" | "home">("home");
  const [address, setAddress] = useState("");
  const [reference, setReference] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [proofName, setProofName] = useState("");
  const proofRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ order_number: string; amount: number; currency: string } | null>(null);

  useEffect(() => {
    if (profile && !address) {
      setAddress([profile.address_line, profile.address_line2, profile.city].filter(Boolean).join(", "));
    }
  }, [profile]);

  const pickupAddress = String(s?.pickup_address || "").trim();
  const choices = deliveryChoices(productQ.data?.delivery_options);
  useEffect(() => {
    if (!choices.home) setDeliveryMode("pickup");
    else if (!choices.pickup) setDeliveryMode("home");
  }, [choices.home, choices.pickup]);

  if (!ready || (sel && productQ.isPending)) {
    return <div className="mx-auto max-w-3xl px-4 py-24 text-center text-muted-foreground">Chargement…</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center space-y-4">
        <h1 className="text-2xl font-black">Connectez-vous pour commander</h1>
        <p className="text-sm text-muted-foreground">Votre commande sera liée à votre compte et vous recevrez la confirmation par e-mail.</p>
        <Button asChild><Link to="/auth">Se connecter</Link></Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-3xl border bg-card p-8 text-center space-y-4">
          <CheckCircle2 className="h-14 w-14 mx-auto text-primary" />
          <h1 className="text-2xl font-black">Merci pour votre commande !</h1>
          <p className="font-mono text-xl font-bold text-primary">Commande {done.order_number}</p>
          <p className="text-sm text-muted-foreground">
            Total : {formatNumber(done.amount)} {done.currency}. La confirmation et les mises à jour de statut sont envoyées à {profile?.email || user.email}.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button asChild variant="outline"><Link to="/boutique">Continuer mes achats</Link></Button>
            <Button asChild variant="outline"><Link to="/boutique/panier">Retour au panier</Link></Button>
            <Button asChild><Link to="/compte/commandes">Mes commandes</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  const product = productQ.data;
  if (!sel || !product) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center space-y-4">
        <h1 className="text-2xl font-black">Aucun article à payer</h1>
        <p className="text-sm text-muted-foreground">Choisissez d'abord un article dans la boutique.</p>
        <Button asChild><Link to="/boutique">Aller à la boutique</Link></Button>
      </div>
    );
  }

  const variant = (product.variants || []).find((v) => v.id === sel.variantId) || null;
  const unit = Number(variant ? (variant.promo_price_usd ?? variant.price_usd) : (product.promo_price_usd ?? product.price_usd)) || 0;
  const freeAmount = product.extra?.amount_mode === "custom_usd";
  const validRate = rate > 0 && (freeAmount ? Number(product.extra?.product_rate_htg) > 0 : productExchangeRate(product.extra, rate) > 0);
  let amountPrice = { totalHtg: 0, walletUsd: 0 };
  if (freeAmount) { try { amountPrice = topupPrice(Number(sel.requestedAmountUsd), Number(product.extra?.product_rate_htg), rate); } catch { /* invalid selection cannot be submitted */ } }
  const qty = freeAmount ? 1 : Math.max(1, Number(sel.quantity) || 1);
  const subtotal = freeAmount ? amountPrice.walletUsd : +(unit * qty).toFixed(2);
  const minimumError = orderMinimumError(product.extra, qty, freeAmount ? Number(sel.requestedAmountUsd) : unit * qty, freeAmount);
  const taxRate = product.apply_tax ? Number(product.tax_rate_override ?? (s?.tax_enabled ? s?.tax_rate || 0 : 0)) : 0;
  const pay = payments.find((p) => p.id === method);
  const needsShipping = !!product.requires_shipping_address;
  const fixed = fixedProductTotals(unit, qty, product.extra, rate, taxRate, Number(pay?.fee_percentage) || 0, Number(pay?.fee_fixed_usd) || 0, needsShipping && deliveryMode === "home");
  const lineSubtotal = freeAmount ? subtotal : fixed.subtotalUsd;
  const tax = freeAmount ? +((subtotal * taxRate) / 100).toFixed(2) : fixed.taxUsd;
  const fee = freeAmount ? (pay ? +(((subtotal + tax) * (Number(pay.fee_percentage) || 0)) / 100 + (Number(pay.fee_fixed_usd) || 0)).toFixed(2) : 0) : fixed.feeUsd;
  const total = freeAmount ? +(subtotal + tax + fee).toFixed(2) : fixed.totalUsd;
  const totalHtg = freeAmount ? (!tax && !fee ? amountPrice.totalHtg : Math.round(total * rate * 100) / 100) : fixed.totalHtg;
  const quoteDelivery = needsShipping && deliveryMode === "home" && fixed.quote;
  const walletShort = method === "wallet" && walletBalance < total;
  const gourdes = !freeAmount && productCurrency(product.extra) === "GDS";
  const displayedTotal = paymentDisplayAmount(method, total, totalHtg, gourdes);
  const displayMoney = (usd: number, htg = Math.round(usd * rate * 100) / 100) => {
    const value = paymentDisplayAmount(method, usd, htg, gourdes);
    return `${formatNumber(value.amount)} ${value.currency}`;
  };

  const onProof = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setProofName(f.name);
    const r = new FileReader();
    r.onload = () => setProofUrl(String(r.result));
    r.readAsDataURL(f);
  };

  const submit = async () => {
    if (!validRate) return toast.error("Le taux de change n’est pas encore disponible. Réessayez dans un instant.");
    if (minimumError) return toast.error(minimumError);
    if (freeAmount && !amountPrice.walletUsd) return toast.error("Revenez au produit pour saisir le montant à recharger.");
    if (needsShipping && deliveryMode === "pickup" && !pickupAddress) return toast.error("L'adresse de la succursale doit être renseignée par l'équipe avant de commander en retrait.");
    if (needsShipping && deliveryMode === "home" && !address.trim()) return toast.error("Indiquez votre adresse de livraison en Haïti.");
    if (walletShort) return toast.error("Solde du portefeuille insuffisant.");
    if (method !== "wallet" && pay?.require_proof && !proofUrl) return toast.error("Ajoutez la capture de votre paiement.");
    setSubmitting(true);
    try {
      const delivery = !needsShipping
        ? "Produit numérique / service (aucune livraison)"
        : deliveryMode === "pickup"
          ? `Retrait : ${pickupAddress}`
          : `Livraison : ${address.trim()}`;
      const { data, error } = await supabase.rpc("place_shop_order", {
        _order: {
          product_id: product.id,
          requested_amount_usd: freeAmount ? sel.requestedAmountUsd : null,
          product_title: product.title,
          product_kind: product.kind,
          variant_id: variant?.id || null,
          variant_name: variant?.name || null,
          quantity: qty,
          unit_price_usd: unit,
          subtotal_usd: lineSubtotal,
          tax_amount_usd: tax,
          service_fee_usd: fee,
          total_usd: total,
          total_htg: totalHtg,
          delivery_address: delivery,
          delivery_mode: needsShipping ? deliveryMode : null,
          custom_field_responses: sel.formValues || {},
          payment_method: method,
          payment_reference: method === "wallet" ? null : reference || null,
          payment_proof_url: method === "wallet" ? null : proofUrl || null,
        },
      });
      if (error) throw error;
      if (quoteDelivery) toast.info(deliveryQuoteNotice);
      const order = data as { id: string; order_number: string; status: string; total_usd: number };
      sessionStorage.removeItem("prime_checkout");
      if (sel.cartKey) writeCart(readCart().filter((item) => item.key !== sel.cartKey));
      qc.invalidateQueries({ queryKey: ["my-wallet"] });
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      try {
        const result = await sendEmail({ data: { kind: "commande", orderId: order.id } });
        void result;
      } catch { /* journalisé côté serveur */ }
      setDone({ order_number: order.order_number, ...displayedTotal });
      window.scrollTo({ top: 0 });
    } catch (e: any) {
      toast.error(e?.message || "La commande n'a pas pu être enregistrée.");
    } finally {
      setSubmitting(false);
    }
  };

  const opt = (active: boolean) =>
    `w-full p-3 rounded-2xl border text-left text-xs transition-all ${active ? "border-primary bg-primary/10 font-bold" : "border-border hover:bg-muted"}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-black min-w-0">Paiement de la commande</h1>
        <Button variant="ghost" size="icon" aria-label="Fermer" onClick={() => navigate({ to: "/boutique/$id", params: { id: product.id } })}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <section className="rounded-3xl border bg-card p-5 space-y-2 text-sm">
        <h2 className="text-xs font-black uppercase">Votre article</h2>
        <div className="flex justify-between gap-3">
          <span className="min-w-0">{product.title}{variant ? ` — ${variant.name}` : ""} × {qty}</span>
          <span className="font-bold shrink-0">{freeAmount ? `${sel.requestedAmountUsd} USD` : displayMoney(lineSubtotal, fixed.subtotalHtg)}</span>
        </div>
        {freeAmount && <p className="text-muted-foreground">Taux produit : {product.extra?.product_rate_htg} GDS/USD</p>}
      </section>

      <section className="rounded-3xl border bg-card p-5 space-y-1 text-sm">
        <h2 className="text-xs font-black uppercase">Facturation</h2>
        <p className="font-semibold">{profile?.full_name || "—"} {profile?.client_code ? `(${profile.client_code})` : ""}</p>
        <p className="text-muted-foreground break-all">{profile?.email || user.email}{profile?.phone ? ` · ${profile.phone}` : ""}</p>
        <Link to="/compte/profil" className="text-xs text-primary underline">Modifier mon profil</Link>
      </section>

      {needsShipping && (
        <section className="rounded-3xl border bg-card p-5 space-y-3">
          <h2 className="text-xs font-black uppercase">Réception en Haïti</h2>
          <div className={`grid gap-2 ${choices.home && choices.pickup ? "sm:grid-cols-2" : "grid-cols-1"}`}>
            {choices.home && <Button type="button" variant="outline" className={`${opt(deliveryMode === "home")} h-auto whitespace-normal justify-start`} onClick={() => setDeliveryMode("home")}>
              <MapPin className="h-4 w-4 mb-1" /> Livraison à mon adresse
            </Button>}
            {choices.pickup && (
              <Button type="button" variant="outline" className={`${opt(deliveryMode === "pickup")} h-auto whitespace-normal justify-start`} onClick={() => setDeliveryMode("pickup")}>
                <Warehouse className="h-4 w-4 mb-1" /> Retrait en succursale — Gratuit
              </Button>
            )}
          </div>
          {deliveryMode === "pickup" ? (
            <p className={`text-sm ${pickupAddress ? "text-muted-foreground" : "text-destructive"}`}>{pickupAddress || "L'adresse de retrait n'est pas encore renseignée. Contactez l'équipe."}</p>
          ) : (
            <div className="space-y-1">
              <Label className="text-xs">Adresse de livraison *</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rue, numéro, ville" />
            </div>
          )}
          {deliveryMode === "home" && <p className="text-sm text-muted-foreground">{quoteDelivery ? deliveryQuoteNotice : `Livraison : ${formatNumber(fixed.deliveryFeeHtg)} GDS`}</p>}
        </section>
      )}

      <section className="rounded-3xl border bg-card p-5 space-y-3">
        <h2 className="text-xs font-black uppercase">Mode de paiement</h2>
        <Button type="button" variant="outline" className={`${opt(method === "wallet")} h-auto block whitespace-normal`} onClick={() => setMethod("wallet")}>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2"><Wallet className="h-4 w-4" /> Portefeuille Prime</span>
            <span className="font-mono">{walletQ.isPending ? "…" : `${walletBalance.toFixed(2)} USD`}</span>
          </div>
        </Button>
        {payments.map((p) => (
          <Button key={p.id} type="button" variant="outline" className={`${opt(method === p.id)} h-auto block whitespace-normal`} onClick={() => setMethod(p.id)}>
            <div className="flex justify-between gap-2">
              <span>{p.name}</span>
              {Number(p.fee_percentage) > 0 && <span className="text-muted-foreground">+{p.fee_percentage}%</span>}
            </div>
          </Button>
        ))}

        {method === "wallet" ? (
          walletShort ? (
            <p className="text-xs text-destructive">
              Solde insuffisant : il manque {(total - walletBalance).toFixed(2)} USD.{" "}
              <Link to="/compte/portefeuille" className="underline">Recharger mon portefeuille</Link>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">{gourdes ? `${formatNumber(totalHtg)} GDS = ${total.toFixed(2)} USD débités automatiquement de votre portefeuille à la validation.` : "Le montant sera débité automatiquement de votre portefeuille à la validation."}</p>
          )
        ) : (
          pay && (
            <div className="p-4 rounded-2xl bg-secondary/60 border space-y-2 text-xs">
              {paymentCoordinates(pay).map((v) => (
                <div key={v} className="flex items-center justify-between gap-2 bg-background p-2 rounded-xl border">
                  <span className="font-mono font-bold break-all">{v}</span>
                  <Button type="button" variant="ghost" size="sm" className="flex items-center gap-1 text-primary" onClick={() => { navigator.clipboard.writeText(v); toast.success("Copié"); }}>
                    <Copy className="h-3 w-3" /> Copier
                  </Button>
                </div>
              ))}
              {pay.instructions && <p className="text-muted-foreground">{pay.instructions}</p>}
              <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="N° de transaction" />
              {pay.require_proof && (
                <>
                  <input ref={proofRef} type="file" accept="image/*,.pdf" className="hidden" onChange={onProof} />
                  <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => proofRef.current?.click()}>
                    <Upload className="h-3.5 w-3.5 mr-2" /> {proofName || "Ajouter la capture du paiement"}
                  </Button>
                </>
              )}
            </div>
          )
        )}
      </section>

      <section className="rounded-3xl border bg-card p-5 space-y-2 text-sm">
        <div className="flex justify-between"><span>Sous-total</span><span>{displayMoney(lineSubtotal, freeAmount ? amountPrice.totalHtg : fixed.subtotalHtg)}</span></div>
        {tax > 0 && <div className="flex justify-between"><span>Taxe ({taxRate}%)</span><span>{displayMoney(tax, freeAmount ? undefined : fixed.taxHtg)}</span></div>}
        {fee > 0 && <div className="flex justify-between"><span>Frais de paiement</span><span>{displayMoney(fee, freeAmount ? undefined : fixed.feeHtg)}</span></div>}
        {!freeAmount && needsShipping && <div className="flex justify-between gap-3"><span>Livraison / retrait</span><span>{quoteDelivery ? "À confirmer, non inclus" : deliveryMode === "pickup" ? "Gratuit" : `${formatNumber(fixed.deliveryFeeHtg)} GDS`}</span></div>}
        <div className="flex justify-between font-black text-base border-t pt-2">
          <span>{quoteDelivery ? "Total hors livraison" : "Total"}</span>
          <span className="text-right">{displayMoney(total, totalHtg)}</span>
        </div>
        {minimumError && <div role="alert" className="text-sm text-destructive">{minimumError} <Link to="/boutique/$id" params={{ id: product.id }} className="underline">Modifier ma sélection</Link></div>}
        {product.extra?.order_notice && <p className="text-sm text-muted-foreground whitespace-pre-line pt-3">{product.extra.order_notice}</p>}
        {!validRate && <p role="alert" className="text-destructive">Le taux de change n’est pas encore disponible.</p>}
        <Button className="w-full h-12 mt-2 font-black" disabled={submitting || walletShort || !!minimumError || !validRate} onClick={submit}>
          {submitting ? "Validation…" : "Valider ma commande"}
        </Button>
      </section>
    </div>
  );
}
