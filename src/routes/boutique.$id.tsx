// @ts-nocheck
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingBag,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Truck,
  MapPin,
  Warehouse,
  Wallet,
  Play,
  Share2,
  Phone,
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
import { clientStore, DEFAULT_PRODUCTS } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
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
import { PaymentMethodsBar } from "@/components/BrandLogos";

export const Route = createFileRoute("/boutique/$id")({
  head: () => ({
    meta: [
      { title: "Détail du Produit — Prime Store Haïti" },
      {
        name: "description",
        content: "Commandez directement vos articles et services numériques sur Prime Store.",
      },
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

  // Load product from clientStore or Supabase
  const [product, setProduct] = useState<ProductItem | null>(() => {
    return clientStore.getProduct(id) || DEFAULT_PRODUCTS.find((p) => p.id === id) || null;
  });

  useEffect(() => {
    const p = clientStore.getProduct(id) || DEFAULT_PRODUCTS.find((item) => item.id === id);
    if (p) setProduct(p);
  }, [id]);

  // Gallery Active Media
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  // Selected Variant
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  // Quantity
  const [quantity, setQuantity] = useState(1);

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
  const walletBalance = user ? clientStore.getWalletBalance(user.id) : 0;

  // Set default variant on product change
  useEffect(() => {
    if (product && product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    } else {
      setSelectedVariant(null);
    }
  }, [product]);

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
  const unitPrice = selectedVariant
    ? (selectedVariant.promo_price_usd ?? selectedVariant.price_usd)
    : (product.promo_price_usd ?? product.price_usd);

  const subtotalUsd = Number((unitPrice * quantity).toFixed(2));
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

  // Handle Order Submit
  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate custom form fields
    const newErrors: Record<string, string> = {};
    if (product.custom_fields) {
      for (const field of product.custom_fields) {
        if (field.required) {
          const val = formValues[field.id];
          if (
            val === undefined ||
            val === null ||
            val === "" ||
            (Array.isArray(val) && val.length === 0)
          ) {
            newErrors[field.id] = `Le champ « ${field.label} » est obligatoire.`;
          }
        }
      }
    }

    // 2. Validate customer info
    if (customerFieldsConfig.require_first_name && !firstName.trim()) {
      newErrors["first_name"] = "Veuillez renseigner votre prénom.";
    }
    if (customerFieldsConfig.require_last_name && !lastName.trim()) {
      newErrors["last_name"] = "Veuillez renseigner votre nom.";
    }
    if (customerFieldsConfig.require_phone && !customerPhone.trim()) {
      newErrors["phone"] = "Veuillez indiquer votre numéro de téléphone ou WhatsApp.";
    }
    if (customerFieldsConfig.require_email && !customerEmail.trim()) {
      newErrors["email"] = "Veuillez indiquer votre adresse e-mail.";
    }

    if (product.requires_shipping_address && deliveryMode === "home" && !addressDetails.trim()) {
      newErrors["address"] = "Veuillez indiquer votre adresse exacte de livraison en Haïti.";
    }

    // 3. Validate payment proof if required
    if (activePaymentConfig?.require_proof && !paymentProofUrl) {
      newErrors["proof"] = "Veuillez téléverser la preuve ou capture de votre transaction.";
    }

    if (selectedPaymentId === "wallet" && walletBalance < totalUsd) {
      return toast.error("Solde de portefeuille insuffisant pour régler cette commande.");
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      const firstError = Object.values(newErrors)[0];
      return toast.error(firstError);
    }

    setIsSubmitting(true);

    try {
      const fullCustomerName = `${firstName} ${lastName}`.trim() || user?.email || "Client Prime";
      const deliveryString = product.requires_shipping_address
        ? deliveryMode === "pickup"
          ? `Retrait Agence : ${PRIME_PICKUP_AGENCIES.find((a) => a.id === pickupAgency)?.name || pickupAgency} (${city})`
          : `Livraison à Domicile : ${addressDetails} (${city}, Haïti)`
        : "Produit Numérique / Service en ligne (Aucune livraison physique)";

      const orderData: Partial<OrderItem> = {
        user_id: user?.id || "guest",
        product_id: product.id,
        product_title: product.title,
        product_kind: product.kind || "physique",
        variant_id: selectedVariant?.id || null,
        variant_name: selectedVariant?.name || null,
        quantity,
        unit_price_usd: unitPrice,
        subtotal_usd: subtotalUsd,
        tax_amount_usd: taxAmountUsd,
        service_fee_usd: paymentFeeUsd,
        total_usd: totalUsd,
        total_htg: totalHtg,
        customer_first_name: firstName,
        customer_last_name: lastName,
        customer_name: fullCustomerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        customer_city: city,
        customer_country: "Haïti",
        delivery_address: deliveryString,
        custom_field_responses: formValues,
        payment_method: selectedPaymentId,
        payment_reference: paymentReference || null,
        payment_proof_url: paymentProofUrl || null,
        payment_proof_name: paymentProofName || null,
        status: selectedPaymentId === "wallet" ? "payee" : "en_attente",
      };

      const created = clientStore.createOrder(orderData);

      // Debit wallet if paid by wallet
      if (selectedPaymentId === "wallet" && user) {
        clientStore.addWalletTransaction({
          wallet_id: `wal-${user.id}`,
          user_id: user.id,
          type: "debit",
          amount_usd: totalUsd,
          amount_htg: totalHtg,
          method: "wallet",
          description: `Paiement Commande ${created.order_number} (${product.title})`,
          status: "approved",
          order_id: created.id,
        });
      }

      setConfirmedOrder(created);
      toast.success(`Commande #${created.order_number} validée avec succès !`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      toast.error(
        err?.message || "Une erreur est survenue lors de l'enregistrement de votre commande.",
      );
    } finally {
      setIsSubmitting(false);
    }
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
    <div className="min-h-screen bg-slate-50/50 pb-24">
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
                  <span className="rounded-full bg-slate-950/80 backdrop-blur text-amber-400 border border-amber-400/30 px-3 py-1 text-xs font-black uppercase tracking-wider shadow-sm">
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
                {product.promo_price_usd && (
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

            {/* Guarantees & Service in Haiti */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border bg-card p-4 shadow-sm space-y-1">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                <h4 className="font-bold text-xs text-foreground">Authenticité Certifiée</h4>
                <p className="text-[11px] text-muted-foreground">
                  Articles 100% neufs et officiels sous garantie constructeur.
                </p>
              </div>
              <div className="rounded-2xl border bg-card p-4 shadow-sm space-y-1">
                <Truck className="h-5 w-5 text-amber-500" />
                <h4 className="font-bold text-xs text-foreground">Livraison Partout en Haïti</h4>
                <p className="text-[11px] text-muted-foreground">
                  Retrait sécurisé en agence ou livraison à votre porte.
                </p>
              </div>
              <div className="rounded-2xl border bg-card p-4 shadow-sm space-y-1">
                <Phone className="h-5 w-5 text-blue-500" />
                <h4 className="font-bold text-xs text-foreground">Support Local Dédié</h4>
                <p className="text-[11px] text-muted-foreground">
                  Équipe joignable du lundi au samedi sur WhatsApp.
                </p>
              </div>
            </div>

            {/* Payment Methods Info */}
            <div className="rounded-3xl border bg-card p-6 shadow-sm">
              <PaymentMethodsBar />
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: Dedicated Checkout, Form Builder & Payment */}
          {/* ======================================================== */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            <form
              onSubmit={handleOrderSubmit}
              className="rounded-3xl border bg-card p-6 sm:p-8 shadow-xl space-y-6 border-slate-200"
            >
              {/* Header Pricing Card */}
              <div className="pb-4 border-b">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Tarif de l'article
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-3xl sm:text-4xl font-black text-foreground">
                    {unitPrice.toFixed(2)}{" "}
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
              </div>

              {/* 1. VARIANTS SELECTOR (If product has variants) */}
              {product.variants && product.variants.length > 0 && (
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
                      const vPrice = v.promo_price_usd ?? v.price_usd;
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
                                isSelected ? "border-amber-500 bg-amber-500" : "border-slate-400"
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

              {/* 2. QUANTITY SELECTOR */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Quantité</Label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-9 w-9 rounded-xl border bg-background font-black hover:bg-muted text-base flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="font-black text-base w-8 text-center">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-9 w-9 rounded-xl border bg-background font-black hover:bg-muted text-base flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

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

              {/* 4. CUSTOMER CONTACT INFO (Configured by Admin) */}
              <div className="pt-4 border-t space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  Vos Coordonnées de Livraison
                </h3>

                <div className="grid gap-3 sm:grid-cols-2">
                  {customerFieldsConfig.require_first_name && (
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Prénom *</Label>
                      <Input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Ex : Jean"
                        className="rounded-xl text-xs h-10"
                        required
                      />
                      {formErrors["first_name"] && (
                        <p className="text-[11px] text-destructive">{formErrors["first_name"]}</p>
                      )}
                    </div>
                  )}

                  {customerFieldsConfig.require_last_name && (
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Nom *</Label>
                      <Input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Ex : Baptiste"
                        className="rounded-xl text-xs h-10"
                        required
                      />
                      {formErrors["last_name"] && (
                        <p className="text-[11px] text-destructive">{formErrors["last_name"]}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {customerFieldsConfig.require_phone && (
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Téléphone / WhatsApp *</Label>
                      <Input
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Votre numéro"
                        className="rounded-xl text-xs h-10 font-mono"
                        required
                      />
                      {formErrors["phone"] && (
                        <p className="text-[11px] text-destructive">{formErrors["phone"]}</p>
                      )}
                    </div>
                  )}

                  {customerFieldsConfig.require_email && (
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">E-mail *</Label>
                      <Input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="nom@exemple.com"
                        className="rounded-xl text-xs h-10"
                        required
                      />
                      {formErrors["email"] && (
                        <p className="text-[11px] text-destructive">{formErrors["email"]}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Delivery Mode if Physical */}
                {product.requires_shipping_address && (
                  <div className="space-y-3 pt-2">
                    <Label className="text-xs font-semibold">Mode de réception en Haïti</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryMode("pickup")}
                        className={`p-3 rounded-2xl border text-left text-xs transition-all ${
                          deliveryMode === "pickup"
                            ? "border-amber-500 bg-amber-500/10 font-bold text-foreground"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        <Warehouse className="h-4 w-4 text-amber-500 mb-1" />
                        <span className="block font-bold">Retrait en succursale</span>
                        <span className="text-[10px] text-muted-foreground">
                          Gratuit sans frais
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryMode("home")}
                        className={`p-3 rounded-2xl border text-left text-xs transition-all ${
                          deliveryMode === "home"
                            ? "border-amber-500 bg-amber-500/10 font-bold text-foreground"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        <MapPin className="h-4 w-4 text-orange-500 mb-1" />
                        <span className="block font-bold">Livraison à domicile</span>
                        <span className="text-[10px] text-muted-foreground">Partout en Haïti</span>
                      </button>
                    </div>

                    {deliveryMode === "pickup" ? (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Choisir l'agence de retrait</Label>
                        <select
                          value={pickupAgency}
                          onChange={(e) => setPickupAgency(e.target.value)}
                          className="w-full rounded-xl border border-input bg-background p-2.5 text-xs font-semibold"
                        >
                          {PRIME_PICKUP_AGENCIES.map((agency) => (
                            <option key={agency.id} value={agency.id}>
                              {agency.name} — {agency.address}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs font-semibold">Ville</Label>
                            <select
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              className="w-full rounded-xl border border-input bg-background p-2.5 text-xs font-semibold"
                            >
                              {HAITI_CITIES.map((c) => (
                                <option key={c.name} value={c.name}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <Label className="text-xs font-semibold">Pays</Label>
                            <Input
                              value="Haïti"
                              disabled
                              className="rounded-xl text-xs h-10 bg-muted"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs font-semibold">
                            Adresse exacte de livraison *
                          </Label>
                          <Input
                            value={addressDetails}
                            onChange={(e) => setAddressDetails(e.target.value)}
                            placeholder="Rue, numéro de maison, repères connus..."
                            className="rounded-xl text-xs h-10"
                          />
                          {formErrors["address"] && (
                            <p className="text-[11px] text-destructive mt-0.5">
                              {formErrors["address"]}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 5. FLEXIBLE PAYMENT METHODS SELECTOR (Admin Configurable) */}
              <div className="pt-4 border-t space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                    Mode de Règlement
                  </h3>
                  {user && (
                    <span className="text-[11px] text-emerald-600 font-bold">
                      Solde : {walletBalance.toFixed(2)}$
                    </span>
                  )}
                </div>

                <div className="grid gap-2">
                  {paymentConfigs.map((pay) => {
                    const isSelected = selectedPaymentId === pay.id;
                    return (
                      <button
                        key={pay.id}
                        type="button"
                        onClick={() => setSelectedPaymentId(pay.id)}
                        className={`p-3 rounded-2xl border text-left text-xs transition-all ${
                          isSelected
                            ? "border-amber-500 bg-amber-500/10 font-bold text-foreground shadow-sm"
                            : "border-border hover:bg-muted/40 text-muted-foreground"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`h-4 w-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                                isSelected ? "border-amber-500 bg-amber-500" : "border-slate-400"
                              }`}
                            >
                              {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                            </div>
                            <span className="font-bold text-foreground">{pay.name}</span>
                          </div>
                          {pay.fee_percentage ? (
                            <span className="text-[10px] text-muted-foreground">
                              +{pay.fee_percentage}% frais
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-semibold">
                              Sans frais
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Instructions for Selected Method */}
                {activePaymentConfig && (
                  <div className="p-4 rounded-2xl bg-secondary/70 border space-y-2 text-xs">
                    <p className="font-bold text-foreground">{activePaymentConfig.name}</p>
                    {activePaymentConfig.phone_number && (
                      <div className="flex items-center justify-between bg-background p-2 rounded-xl border">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {activePaymentConfig.phone_number}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(activePaymentConfig.phone_number!);
                            toast.success("Numéro copié !");
                          }}
                          className="text-[10px] font-bold text-amber-600 hover:underline flex items-center gap-1"
                        >
                          <Copy className="h-3 w-3" /> Copier
                        </button>
                      </div>
                    )}
                    {activePaymentConfig.account_number && (
                      <div className="flex items-center justify-between bg-background p-2 rounded-xl border">
                        <span className="font-mono text-xs font-bold text-foreground truncate max-w-[200px]">
                          {activePaymentConfig.account_number}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(activePaymentConfig.account_number!);
                            toast.success("Identifiant copié !");
                          }}
                          className="text-[10px] font-bold text-amber-600 hover:underline flex items-center gap-1"
                        >
                          <Copy className="h-3 w-3" /> Copier
                        </button>
                      </div>
                    )}
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {activePaymentConfig.instructions}
                    </p>

                    {/* Reference input */}
                    <div className="pt-2">
                      <Label className="text-[11px] font-semibold">
                        Numéro de référence / transaction
                      </Label>
                      <Input
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder="Ex : N° transaction MonCash ou ID transfert"
                        className="rounded-xl text-xs h-9 font-mono mt-1"
                      />
                    </div>

                    {/* 6. PROOF OF PAYMENT UPLOAD */}
                    {activePaymentConfig.require_proof && (
                      <div className="pt-2 space-y-1.5">
                        <Label className="text-[11px] font-bold flex items-center gap-1 text-foreground">
                          Preuve de paiement (Capture / Reçu) *
                        </Label>
                        <input
                          ref={proofInputRef}
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleProofUpload}
                          className="hidden"
                        />
                        {paymentProofUrl ? (
                          <div className="flex items-center justify-between p-2 rounded-xl bg-background border">
                            <span className="text-xs font-semibold truncate max-w-[180px] text-emerald-600 flex items-center gap-1">
                              <Check className="h-3.5 w-3.5" />{" "}
                              {paymentProofName || "Preuve attachée"}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentProofUrl("");
                                setPaymentProofName("");
                              }}
                              className="text-[11px] text-destructive font-bold hover:underline"
                            >
                              Supprimer
                            </button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => proofInputRef.current?.click()}
                            className="w-full rounded-xl text-xs font-bold"
                          >
                            <Upload className="h-3.5 w-3.5 mr-2 text-amber-500" /> Téléverser la
                            capture d'écran
                          </Button>
                        )}
                        {formErrors["proof"] && (
                          <p className="text-[11px] text-destructive">{formErrors["proof"]}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Order Summary & Final Total */}
              <div className="pt-4 border-t space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>
                    Sous-total ({quantity} {quantity > 1 ? "articles" : "article"}) :
                  </span>
                  <span className="font-semibold">{subtotalUsd.toFixed(2)} USD</span>
                </div>
                {taxAmountUsd > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>TVA / Taxe ({activeTaxRate}%) :</span>
                    <span className="font-semibold">{taxAmountUsd.toFixed(2)} USD</span>
                  </div>
                )}
                {paymentFeeUsd > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Frais passerelle de paiement :</span>
                    <span className="font-semibold">{paymentFeeUsd.toFixed(2)} USD</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 border-t text-sm font-black text-foreground">
                  <span>Montant total :</span>
                  <div className="text-right">
                    <span className="text-xl sm:text-2xl text-amber-500 block">
                      {totalUsd.toFixed(2)} USD
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground font-mono">
                      ≈ {formatNumber(totalHtg)} HTG
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-sm shadow-xl"
              >
                {isSubmitting ? "Traitement en cours..." : "Valider ma commande"}
              </Button>

              <p className="text-[10px] text-center text-muted-foreground">
                En confirmant cette commande, vous acceptez les conditions de service de Prime
                Entreprise.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
