// @ts-nocheck
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Warehouse,
  Wallet,
  Play,
  Share2,
  Clock,
  ArrowRight,
  Package,
  Layers,
  FileText,
  Upload,
  CreditCard,
  Check,
  AlertCircle,
  Copy,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/lib/settings";
import { useUser } from "@/lib/session";
import { clientStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { topupPrice } from "@/lib/product-pricing";
import { DEFAULT_ORDER_NOTICE, minimumQuantity, orderMinimumError } from "@/lib/order-minimums";
import { addCartItem } from "@/lib/cart";
import { DynamicProductForm } from "@/components/DynamicProductForm";
import type {
  ProductItem,
  ProductVariant,
  OrderItem,
  AdminPaymentConfig,
  PaymentMethodId,
} from "@/lib/types-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNumber } from "@/lib/utils";
import { HAITI_CITIES, PRIME_PICKUP_AGENCIES } from "@/lib/cities-haiti";

export const Route = createFileRoute("/boutique/$id")({
  head: () => ({
    meta: [
      { title: "Détail du Produit — Prime Store Haïti" },
      {
        name: "description",
        content: "Commandez directement vos articles et services numériques sur Prime Store.",
      },
      { property: "og:title", content: "Fiche produit — Prime Shipping" },
      { property: "og:description", content: "Choisissez votre article, ses options et son mode de commande sur Prime Shipping." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductDetailPage,
});

export function ProductDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const s = useSettings();
  const { user } = useUser();
  const rate = s?.usd_to_htg || 132;
  const defaultTaxRate = s?.tax_enabled ? s?.tax_rate || 10 : 0;

  const productQuery = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as ProductItem | null;
    },
  });
  const product = productQuery.data;
  const productLoading = productQuery.isPending;

  // Gallery Active Media
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  // Selected Variant
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  // Quantity
  const [quantity, setQuantity] = useState(1);
  const [requestedAmount, setRequestedAmount] = useState("");

  // Custom Form Field Values
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Customer Checkout Details
  const customerFieldsConfig = clientStore.getCustomerFieldsConfig();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState(user?.email || "");
  const [city, setCity] = useState("Port-au-Prince");
  const [addressDetails, setAddressDetails] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<"pickup" | "home">("pickup");
  const [pickupAgency, setPickupAgency] = useState("agence-pap");

  // Payment Options from CMS
  const [paymentConfigs, setPaymentConfigs] = useState<AdminPaymentConfig[]>(() =>
    clientStore.getPaymentConfigs().filter((p) => p.is_enabled),
  );
  const [selectedPaymentId, setSelectedPaymentId] = useState<PaymentMethodId>(() => {
    const list = clientStore.getPaymentConfigs().filter((p) => p.is_enabled);
    return list[0]?.id || "moncash";
  });
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [paymentProofName, setPaymentProofName] = useState("");
  const proofInputRef = useRef<HTMLInputElement>(null);

  // Order Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderItem | null>(null);

  // User Wallet Balance
  const walletBalance = Number(user ? clientStore.getWalletBalance(user.id) : 0) || 0;

  // Set default variant on product change
  useEffect(() => {
    if (product && product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    } else {
      setSelectedVariant(null);
    }
  }, [product]);
  useEffect(() => {
    if (product) setQuantity(minimumQuantity(product.extra));
  }, [product?.id, product?.extra?.minimum_quantity]);

  if (productLoading) {
    return <div className="mx-auto max-w-4xl px-4 py-24 text-center text-muted-foreground">Chargement…</div>;
  }

  if (productQuery.isError) {
    return (
      <div role="alert" className="mx-auto max-w-4xl px-4 py-24 text-center space-y-4">
        <p className="text-destructive">Impossible de charger cet article pour le moment.</p>
        <Button variant="outline" onClick={() => productQuery.refetch()}>Réessayer</Button>
        <Button asChild variant="outline"><Link to="/boutique">Retour à la boutique</Link></Button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <Package className="mx-auto h-16 w-16 text-muted-foreground opacity-40 mb-4" />
        <h1 className="text-2xl font-black text-foreground">Article ou service introuvable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ce produit n'existe plus ou a été désactivé par l'administration.
        </p>
        <Button
          asChild
          className="mt-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
        >
          <Link to="/boutique">
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour au catalogue Prime Store
          </Link>
        </Button>
      </div>
    );
  }

  // Pricing calculations
  const unitPrice = Number(selectedVariant
    ? (selectedVariant.promo_price_usd ?? selectedVariant.price_usd)
    : (product.promo_price_usd ?? product.price_usd));

  const freeAmount = product.extra?.amount_mode === "custom_usd";
  const minQty = minimumQuantity(product.extra);
  let amountPrice = { totalHtg: 0, walletUsd: 0 };
  if (freeAmount && Number(requestedAmount) > 0) { try { amountPrice = topupPrice(Number(requestedAmount), Number(product.extra?.product_rate_htg), Number(rate)); } catch { /* invalid input is checked at submission */ } }
  const subtotalUsd = freeAmount ? amountPrice.walletUsd : Number((unitPrice * quantity).toFixed(2));
  const activeTaxRate = product.apply_tax ? (product.tax_rate_override ?? defaultTaxRate) : 0;
  const taxAmountUsd = Number(((subtotalUsd * activeTaxRate) / 100).toFixed(2));

  // Payment method fee
  const activePaymentConfig = paymentConfigs.find((p) => p.id === selectedPaymentId);
  const feePercent = activePaymentConfig?.fee_percentage || 0;
  const feeFixed = activePaymentConfig?.fee_fixed_usd || 0;
  const paymentFeeUsd = Number(
    (((subtotalUsd + taxAmountUsd) * feePercent) / 100 + feeFixed).toFixed(2),
  );

  const totalUsd = Number((subtotalUsd + taxAmountUsd + paymentFeeUsd).toFixed(2));
  const totalHtg = Math.round(totalUsd * rate);

  // Custom Form Handler
  const handleFormFieldChange = (fieldId: string, val: any) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: val }));
    if (formErrors[fieldId]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  // Proof File Upload Handler
  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPaymentProofName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setPaymentProofUrl(reader.result as string);
      toast.success("Preuve de paiement attachée avec succès.");
    };
    reader.readAsDataURL(file);
  };

  // Step 1: validate product options then go to the checkout page
  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (freeAmount) { try { topupPrice(Number(requestedAmount), Number(product.extra?.product_rate_htg), Number(rate)); } catch { return toast.error("Saisissez un montant USD valide (deux décimales maximum)."); } }
    const minimumError = orderMinimumError(product.extra, freeAmount ? 1 : quantity, freeAmount ? Number(requestedAmount) : subtotalUsd, freeAmount);
    if (minimumError) return toast.error(minimumError);
    const selection = { productId: product.id, variantId: freeAmount ? null : selectedVariant?.id || null, quantity: freeAmount ? 1 : quantity, formValues, requestedAmountUsd: freeAmount ? Number(requestedAmount) : undefined };
    const newErrors: Record<string, string> = {};
    for (const field of product.custom_fields || []) {
      const val = formValues[field.id];
      if (field.required && (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0))) {
        newErrors[field.id] = `Le champ « ${field.label} » est obligatoire.`;
      }
    }
    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return toast.error(Object.values(newErrors)[0]);
    }
    if (e.nativeEvent?.submitter?.value === "cart") {
      try {
        addCartItem(selection);
        toast.success("Article ajouté au panier");
        navigate({ to: "/boutique/panier" });
      } catch { toast.error("Impossible de sauvegarder le panier sur cet appareil."); }
      return;
    }
    sessionStorage.setItem(
      "prime_checkout",
      JSON.stringify(selection),
    );
    navigate({ to: "/boutique/commande" });
  };

  // SUCCESS CONFIRMATION VIEW
  if (confirmedOrder) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-3xl bg-card border shadow-xl p-8 sm:p-12 text-center space-y-6">
          <div className="h-20 w-20 rounded-full bg-emerald-500/10 text-emerald-500 grid place-items-center mx-auto">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full">
              Commande Enregistrée avec Succès
            </span>
            <h1 className="text-3xl font-black text-foreground mt-3">
              Merci pour votre commande !
            </h1>
            <p className="font-mono text-lg font-bold text-amber-500 mt-1">
              N° {confirmedOrder.order_number}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-secondary/50 border text-left space-y-3 text-xs">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Article commandé :</span>
              <span className="font-bold text-foreground">{confirmedOrder.product_title}</span>
            </div>
            {confirmedOrder.variant_name && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Variante / Formule :</span>
                <span className="font-bold text-foreground">{confirmedOrder.variant_name}</span>
              </div>
            )}
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Quantité :</span>
              <span className="font-bold text-foreground">{confirmedOrder.quantity}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Total à régler :</span>
              <span className="font-extrabold text-foreground text-sm">
                {confirmedOrder.total_usd.toFixed(2)} USD (≈{" "}
                {formatNumber(confirmedOrder.total_htg)} HTG)
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Mode de paiement :</span>
              <span className="font-bold uppercase text-foreground">
                {confirmedOrder.payment_method}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Destinataire :</span>
              <span className="font-bold text-foreground">
                {confirmedOrder.customer_name} ({confirmedOrder.customer_phone})
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            Notre équipe logistique traite immédiatement votre demande. Un message de confirmation
            vous sera envoyé par SMS / WhatsApp au {confirmedOrder.customer_phone}.
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="rounded-2xl text-xs font-bold"
            >
              <Printer className="h-4 w-4 mr-1.5" /> Imprimer le reçu
            </Button>
            <Button
              asChild
              className="rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs"
            >
              <Link to="/boutique">Continuer mes achats</Link>
            </Button>
            {user && (
              <Button asChild variant="outline" className="rounded-2xl text-xs font-bold">
                <Link to="/compte/commandes">Mes commandes</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const allMedia =
    product.media_urls && product.media_urls.length > 0
      ? product.media_urls
      : [
          "https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1000&q=80",
        ];

  return (
    <div className="min-h-screen bg-transparent pb-24">
      {/* Breadcrumb Bar */}
      <div className="border-b bg-card/60 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            Accueil
          </Link>
          <span>/</span>
          <Link to="/boutique" className="hover:text-foreground">
            Prime Store
          </Link>
          <span>/</span>
          <span className="text-foreground font-semibold truncate max-w-xs">{product.title}</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-12 items-start">
          {/* ======================================================== */}
          {/* LEFT COLUMN: High-Res Gallery + Complete Product Details */}
          {/* ======================================================== */}
          <div className="lg:col-span-7 space-y-8">
            {/* Gallery Viewer */}
            <div className="space-y-3">
              <div className="relative aspect-video sm:aspect-[4/3] w-full overflow-hidden rounded-3xl border bg-card shadow-md">
                <img
                  src={allMedia[activeMediaIndex] || allMedia[0]}
                  alt={product.title}
                  className="h-full w-full object-cover transition-all duration-300"
                />

                {/* Badge Kind */}
                <div className="absolute top-4 left-4">
                  <span className="rounded-full liquid text-foreground px-3 py-1 text-xs font-black uppercase tracking-wider shadow-sm">
                    {product.kind === "topup"
                      ? "Top Up Direct"
                      : product.kind === "numerique"
                        ? "Service Numérique"
                        : product.kind === "service"
                          ? "Prestation de Service"
                          : "Produit Physique"}
                  </span>
                </div>

                {/* Promo Badge */}
                {!freeAmount && product.promo_price_usd && (
                  <div className="absolute top-4 right-4">
                    <span className="rounded-full bg-red-600 text-white px-3 py-1 text-xs font-black uppercase tracking-wider shadow-lg">
                      PROMO
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {allMedia.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                  {allMedia.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveMediaIndex(idx)}
                      className={`relative h-18 w-24 flex-shrink-0 overflow-hidden rounded-2xl border-2 transition-all ${
                        activeMediaIndex === idx
                          ? "border-amber-500 shadow-md scale-105"
                          : "border-border opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={url}
                        alt={`Vue ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Video Player if available */}
            {product.video_url && (
              <div className="rounded-3xl border bg-card p-6 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-foreground">
                  <Play className="h-4 w-4 text-amber-500" /> Vidéo de présentation officielle
                </div>
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
                  <iframe
                    src={product.video_url.replace("watch?v=", "embed/")}
                    title="Présentation produit"
                    className="h-full w-full border-0"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Comprehensive Description */}
            <div className="rounded-3xl border bg-card p-6 sm:p-8 shadow-sm space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                {product.category} {product.subcategory && `• ${product.subcategory}`}
              </span>
              <h2 className="text-2xl font-black text-foreground">{product.title}</h2>
              {product.short_description && (
                <p className="text-sm font-semibold text-muted-foreground leading-relaxed">
                  {product.short_description}
                </p>
              )}
              <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed pt-2 border-t whitespace-pre-line">
                {product.description}
              </div>
            </div>

          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: Dedicated Checkout, Form Builder & Payment */}
          {/* ======================================================== */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            {product.extra?.order_mode && product.extra.order_mode !== "site" && product.extra.order_link ? (
              <div className="rounded-3xl border bg-card p-6 sm:p-8 shadow-xl space-y-4">
                <h2 className="text-lg font-bold">Commander cet article</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{product.extra?.order_notice ?? DEFAULT_ORDER_NOTICE}</p>
                <Button asChild size="lg" className="w-full h-12 rounded-2xl font-black">
                  <a
                    href={
                      product.extra.order_mode === "whatsapp"
                        ? `https://wa.me/${product.extra.order_link.replace(/\D/g, "")}?text=${encodeURIComponent(`Bonjour, je souhaite commander : ${product.title}`)}`
                        : product.extra.order_link
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {product.extra.order_label || (product.extra.order_mode === "whatsapp" ? "Commander sur WhatsApp" : "Commander")}
                  </a>
                </Button>
              </div>
            ) : (
            <form
              onSubmit={handleOrderSubmit}
              className="rounded-3xl border bg-card p-6 sm:p-8 shadow-xl space-y-6 border-border"
            >
              {/* Header Pricing Card */}
              {!freeAmount && <div className="pb-4 border-b">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Tarif de l'article
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-3xl sm:text-4xl font-black text-foreground">
                    {(freeAmount ? subtotalUsd : unitPrice).toFixed(2)}{" "}
                    <span className="text-sm font-bold text-muted-foreground">USD</span>
                  </span>
                  <span className="text-sm font-bold text-amber-500 font-mono">
                    ≈ {formatNumber(Math.round(unitPrice * rate))} HTG
                  </span>
                </div>
                {product.promo_price_usd && (
                  <p className="text-xs text-red-600 font-bold mt-1">
                    Prix promotionnel spécial en vigueur !
                  </p>
                )}
              </div>}

              {/* 1. VARIANTS SELECTOR (If product has variants) */}
              {!freeAmount && product.variants && product.variants.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground">
                      Choisissez votre formule / variante *
                    </Label>
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {product.variants.length} options disponibles
                    </span>
                  </div>

                  <div className="grid gap-2">
                    {product.variants.map((v) => {
                      const isSelected = selectedVariant?.id === v.id;
                      const vPrice = Number(v.promo_price_usd ?? v.price_usd);
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVariant(v)}
                          className={`flex items-center justify-between p-3 rounded-2xl border text-left text-xs transition-all ${
                            isSelected
                              ? "border-amber-500 bg-amber-500/10 shadow-sm"
                              : "border-border hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`h-4 w-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                                isSelected ? "border-amber-500 bg-amber-500" : "border-border"
                              }`}
                            >
                              {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                            </div>
                            <div>
                              <span className="font-bold text-foreground block">{v.name}</span>
                              {v.stock !== null && v.stock !== undefined && (
                                <span className="text-[10px] text-muted-foreground">
                                  En stock ({v.stock} disp.)
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-black text-foreground block">
                              {vPrice.toFixed(2)} USD
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              ≈ {formatNumber(Math.round(vPrice * rate))} HTG
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {freeAmount && <div className="space-y-2"><Label htmlFor="recharge-amount">Montant à recharger (USD)</Label><Input id="recharge-amount" type="number" min={Math.max(0.01, Number(product.extra?.minimum_order_usd) || 0)} step="0.01" required value={requestedAmount} onChange={(e) => setRequestedAmount(e.target.value)} /><p className="text-sm text-muted-foreground">Taux : {product.extra?.product_rate_htg} GDS/USD{amountPrice.totalHtg > 0 && ` · ${formatNumber(amountPrice.totalHtg)} GDS`}</p></div>}
              {/* 2. QUANTITY SELECTOR */}
              {!freeAmount && <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Quantité</Label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(minQty, quantity - 1))}
                    className="h-9 w-9 rounded-xl border bg-background font-black hover:bg-muted text-base flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="font-black text-base w-8 text-center">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(999, quantity + 1))}
                    className="h-9 w-9 rounded-xl border bg-background font-black hover:bg-muted text-base flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              }
              {/* 3. DYNAMIC CUSTOM FORM FIELDS (All 16 field types supported!) */}
              {product.custom_fields && product.custom_fields.length > 0 && (
                <div className="pt-4 border-t space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                      Informations nécessaires pour cet article
                    </h3>
                  </div>

                  <DynamicProductForm
                    fields={product.custom_fields}
                    values={formValues}
                    onChange={handleFormFieldChange}
                    errors={formErrors}
                  />
                </div>
              )}

              {!freeAmount && <div className="pt-4 border-t space-y-2 text-xs">
                <div className="flex justify-between items-baseline text-sm font-black text-foreground">
                  <span>Sous-total ({quantity}) :</span>
                  <div className="text-right">
                    <span className="text-xl text-amber-500 block">{subtotalUsd.toFixed(2)} USD</span>
                    <span className="text-xs font-semibold text-muted-foreground font-mono">≈ {formatNumber(Math.round(subtotalUsd * rate))} HTG</span>
                  </div>
                </div>
              </div>}
              <div className="text-sm text-muted-foreground space-y-2">
                {!freeAmount && minQty > 1 && <p>Quantité minimum : {minQty}</p>}
                {Number(product.extra?.minimum_order_usd) > 0 && <p>Montant minimum : {Number(product.extra.minimum_order_usd).toFixed(2)} USD{!freeAmount && " (hors frais)"}</p>}
                <p className="whitespace-pre-line">{product.extra?.order_notice ?? DEFAULT_ORDER_NOTICE}</p>
              </div>
              <Button type="submit" name="action" value="cart" size="lg" variant="outline" className="w-full h-12">
                <ShoppingBag className="h-4 w-4 mr-2" /> Ajouter au panier
              </Button>
              <Button asChild variant="ghost" className="w-full"><Link to="/boutique/panier">Voir mon panier</Link></Button>
              <Button type="submit" size="lg" className="w-full h-12 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm">
                Continuer vers le paiement <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
