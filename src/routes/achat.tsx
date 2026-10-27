// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect, Component, type ReactNode } from "react";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Upload,
  MessageCircle,
  X,
  Camera,
  Check,
  DollarSign,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/lib/settings";
import { useUser } from "@/lib/session";
import { clientStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { sendClientEmail } from "@/lib/email.functions";
import { uploadImage } from "@/lib/upload";
import { notificationService } from "@/lib/notifications";
import { sendLocalPush } from "@/lib/push-notifications";
import type { AssistedPurchaseRequest } from "@/lib/types-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { formatNumber } from "@/lib/utils";
import { PartnerBrandsBar, PaymentMethodsBar } from "@/components/BrandLogos";

// Safe Error Boundary to prevent any crash
class SafeAchatBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: any }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    console.error("Achat error caught:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-xl px-4 py-16 text-center space-y-4">
          <div className="rounded-xl border border-border bg-card p-8 shadow-xs">
            <ShoppingBag className="h-10 w-10 text-primary mx-auto opacity-80" />
            <h2 className="text-xl font-bold text-foreground mt-3">Service d'Achat Assisté</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Une erreur temporaire est survenue lors du chargement des demandes.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                onClick={() => this.setState({ hasError: false })}
                className="bg-primary text-primary-foreground font-bold rounded-lg"
              >
                <RefreshCw className="h-4 w-4 mr-2" /> Réessayer
              </Button>
              <Link to="/">
                <Button variant="outline" className="rounded-lg">
                  Retour à l'accueil
                </Button>
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const Route = createFileRoute("/achat")({
  head: () => ({
    meta: [
      { title: "Achetez pour moi — Service d'achat assisté | Prime Express Shipping" },
      {
        name: "description",
        content:
          "Commandez sur n'importe quel site mondial (Amazon, Shein, eBay). Téléversez votre image ou lien, indiquez votre prix estimé. Prise en charge rapide et livraison en Haïti.",
      },
      {
        property: "og:title",
        content: "Achetez pour moi — Service d'achat assisté | Prime Express Shipping",
      },
    ],
  }),
  errorComponent: ({ error, reset }) => (
    <div className="mx-auto max-w-xl px-4 py-16 text-center space-y-4">
      <div className="rounded-xl border border-border bg-card p-8 shadow-xs">
        <ShoppingBag className="h-10 w-10 text-primary mx-auto" />
        <h2 className="text-xl font-bold text-foreground mt-3">Page Achat Assisté</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Le formulaire d'achat assisté se prépare. Cliquez sur réessayer pour recharger vos données.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={() => reset()} className="bg-primary text-primary-foreground font-bold rounded-lg">
            <RefreshCw className="h-4 w-4 mr-2" /> Recharger la page
          </Button>
          <Link to="/">
            <Button variant="outline" className="rounded-lg">
              Accueil
            </Button>
          </Link>
        </div>
      </div>
    </div>
  ),
  component: () => (
    <SafeAchatBoundary>
      <AssistedPurchasePage />
    </SafeAchatBoundary>
  ),
});

const QUICK_STORES = [
  "Amazon",
  "Shein",
  "eBay",
  "AliExpress",
  "Walmart",
  "Zara",
  "Apple",
  "Temu",
  "Nike",
  "Best Buy",
];

function safeNumber(val: any, fallback = 0): number {
  if (typeof val === "number" && !isNaN(val)) return val;
  const parsed = parseFloat(String(val || "0"));
  return isNaN(parsed) ? fallback : parsed;
}

function formatDateSafe(val?: string): string {
  if (!val) return "Récemment";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return "Récemment";
    return d.toLocaleDateString("fr-FR");
  } catch {
    return "Récemment";
  }
}

export function AssistedPurchasePage() {
  const s = useSettings();
  const { user } = useUser();
  const rate = safeNumber(s?.usd_to_htg, 132);

  // Global admin configured fee
  const feeType = s?.assisted_purchase_fee_type || "fixed";
  const defaultFeeValue = safeNumber(s?.assisted_purchase_fee_usd, 5);
  const defaultFeePercent = safeNumber(s?.assisted_purchase_fee_percent, 5);

  // Form State
  const [storeName, setStoreName] = useState("");
  const [productLink, setProductLink] = useState("");
  const [productImageUrl, setProductImageUrl] = useState("");
  const [imageBase64, setImageBase64] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [clientPriceInput, setClientPriceInput] = useState("");

  // Customer & Delivery Address
  const [customerName, setCustomerName] = useState(user?.email ? user.email.split("@")[0] : "");
  const [customerPhone, setCustomerPhone] = useState("+509 ");
  const [customerEmail, setCustomerEmail] = useState(user?.email || "");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  // Option: Déduire du solde dès vérification admin
  const [deductFromWallet, setDeductFromWallet] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved Haitian profile if exists
  useEffect(() => {
    if (user?.id || user?.email) {
      try {
        const id = user.id || user.email || "";
        const p = clientStore.getHaitiProfile ? clientStore.getHaitiProfile(id) : null;
        if (p) {
          if (p.full_name && !customerName) setCustomerName(p.full_name);
          if (p.phone && customerPhone === "+509 ") setCustomerPhone(p.phone);
          if (p.city) setDeliveryCity(p.city);
          if (p.delivery_address) setDeliveryAddress(p.delivery_address);
        }
      } catch {
        // safe guard
      }
    }
  }, [user]);

  // Queries
  const walletQuery = useQuery({
    queryKey: ["wallet-balance", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("wallets")
        .select("balance_usd")
        .eq("user_id", user!.id)
        .maybeSingle();
      return safeNumber(data?.balance_usd, 0);
    },
  });
  const walletBalance = safeNumber(walletQuery.data, 0);

  const purchasesQuery = useQuery({
    queryKey: ["my-assisted-purchases", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assisted_purchases")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as AssistedPurchaseRequest[];
    },
  });
  const myPurchases = Array.isArray(purchasesQuery.data) ? purchasesQuery.data : [];

  // Handle Real File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user) {
      return toast.error("Connectez-vous pour joindre une image à votre demande.");
    }

    if (!file.type.startsWith("image/")) {
      return toast.error("Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).");
    }

    if (file.size > 5 * 1024 * 1024) {
      return toast.error("L'image ne doit pas dépasser 5 Mo.");
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setImageBase64((uploadEvent.target?.result as string) || "");
    };
    reader.readAsDataURL(file);
  };

  const removeUploadedImage = () => {
    setImageBase64("");
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Calculations
  const numericPrice = safeNumber(clientPriceInput, 0);
  const calculatedFee =
    numericPrice > 0
      ? feeType === "percent"
        ? Number(((numericPrice * defaultFeePercent) / 100).toFixed(2))
        : defaultFeeValue
      : 0;
  const totalUsd = Number((numericPrice + calculatedFee).toFixed(2));
  const totalHtg = Math.round(totalUsd * rate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() && !customerPhone.trim()) {
      return toast.error("Veuillez au moins indiquer votre nom ou numéro de téléphone de contact.");
    }

    setIsSubmitting(true);
    try {
      let imageUrl = productImageUrl.trim();
      if (imageFile) {
        try {
          imageUrl = await uploadImage(`assisted/${user?.id || "invites"}`, imageFile);
        } catch {
          toast.warning("Image non envoyée — la demande partira sans image.");
        }
      }

      const payload = {
        store_name: storeName.trim() || "Multi-sites / À identifier",
        product_link: productLink.trim(),
        description: description.trim() || "Article soumis par le client pour vérification",
        exact_price_usd: numericPrice,
        customer_name: customerName || "Client Prime",
        customer_phone: customerPhone || "",
        customer_email: customerEmail || user?.email || "",
        delivery_city: deliveryCity,
        delivery_address: deliveryAddress,
      };

      let requestNumber = "";
      let assistedId: string | undefined;
      let debited = false;

      if (user?.id) {
        const { data: created, error } = await supabase.rpc("create_assisted_purchase", {
          p_exact_price_usd: numericPrice,
          p_store_name: payload.store_name,
          p_product_link: payload.product_link,
          p_product_image_url: imageUrl,
          p_description: payload.description,
          p_customer_name: payload.customer_name,
          p_customer_phone: payload.customer_phone,
          p_delivery_city: payload.delivery_city,
          p_delivery_address: payload.delivery_address,
          p_deduct_from_wallet: deductFromWallet,
        });
        if (error) throw new Error(error.message);
        const result = (created || {}) as { id?: string; request_number?: string; payment_status?: string };
        requestNumber = String(result.request_number || "");
        assistedId = result.id;
        debited = result.payment_status === "verified_paid";
      } else {
        const res = await fetch("/api/public/assisted-purchase", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...payload, product_image_url: imageUrl }),
        });
        const out = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) throw new Error(out.error || "Envoi impossible. Vérifiez votre connexion et réessayez.");
      }

      if (assistedId) {
        try {
          await sendClientEmail({ data: { kind: "achat", assistedId } });
        } catch {
          // L'e-mail ne doit pas bloquer l'enregistrement de la demande
        }
      }

      purchasesQuery.refetch();
      walletQuery.refetch();

      // In-App Notification
      try {
        notificationService.addNotification({
          title: `Demande d'achat soumise : #${requestNumber}`,
          message: `Votre demande d'achat sur ${payload.store_name} a été transmise. L'administration va vérifier le produit et les taxes.`,
          type: "achat",
          link: "/achat",
        });
      } catch (err) {
        console.error(err);
      }

      // Native Push Notification
      try {
        sendLocalPush(`Demande d'achat #${requestNumber} enregistrée !`, {
          body: `Votre demande pour ${payload.store_name} est bien reçue et en cours de vérification par Prime Express Shipping.`,
          url: "/achat",
        });
      } catch (err) {
        console.error(err);
      }

      toast.success(`Demande d'achat #${requestNumber} enregistrée avec succès !`, {
        description: debited
          ? "Le montant a été déduit de votre portefeuille Prime."
          : "L'administration examine votre produit. Vous recevrez une notification dès validation.",
      });

      // Reset form
      setStoreName("");
      setProductLink("");
      setProductImageUrl("");
      setImageBase64("");
      setImageFile(null);
      setDescription("");
      setClientPriceInput("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : "Erreur réseau. Vérifiez votre connexion puis réessayez.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: AssistedPurchaseRequest["status"]) => {
    switch (status) {
      case "en_attente":
      case "en_attente_validation":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
            <Clock className="h-3 w-3" /> En attente de vérification
          </span>
        );
      case "validee":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3" /> Validée par l'admin
          </span>
        );
      case "payee":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-900 text-white border border-slate-700">
            <Check className="h-3 w-3 text-orange-400" /> Payée
          </span>
        );
      case "achetee":
      case "en_cours_achat":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-800 text-white border border-slate-700">
            <ShoppingBag className="h-3 w-3 text-orange-400" /> Achetée & En cours
          </span>
        );
      case "recu_entrepot":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
            <Check className="h-3 w-3" /> Reçue en entrepôt Miami
          </span>
        );
      case "en_vol":
      case "expedie":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <ShieldCheck className="h-3 w-3" /> En vol vers Haïti
          </span>
        );
      case "disponible":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <CheckCircle2 className="h-3 w-3" /> Prêt pour retrait en Haïti
          </span>
        );
      case "annulee":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30">
            <AlertCircle className="h-3 w-3" /> Annulée
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-muted text-foreground border border-border">
            <Clock className="h-3 w-3" /> En cours
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* Hero Banner - Clean ps-invoice Corporate Styling, No Bubbles */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 sm:p-10 text-white shadow-xs relative overflow-hidden">
        <div className="max-w-3xl relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-md bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" /> Service Achetez Pour Moi
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Achat Assisté sur Tous Sites Mondiaux
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Vous avez repéré un article sur{" "}
            <strong className="text-white">Amazon, Shein, eBay, AliExpress, Walmart, Zara</strong> ou tout autre site ? Pas
            besoin de carte bancaire étrangère : téléversez l'image, collez le lien ou décrivez votre article.
            Indiquez votre prix estimé : l'administrateur confirme les taxes et le montant, puis nous achetons et livrons pour vous en Haïti !
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-orange-500" /> Téléversement réel de capture ou photo
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-orange-500" /> Déduction solde portefeuille ou MonCash
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-orange-500" /> Acheminement et livraison sécurisée en Haïti
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Form + Summary */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: The Form */}
        <div className="lg:col-span-7 rounded-xl border border-border bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
            <div>
              <h2 className="text-lg font-bold text-foreground">Nouvelle demande d'achat</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Remplissez les informations de votre produit (photo, capture ou lien).
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-muted-foreground block">Votre solde portefeuille :</span>
              <span className="text-sm font-extrabold text-orange-500">
                ${walletBalance.toFixed(2)} USD
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Real Image Upload Button */}
            <div className="space-y-2 rounded-lg bg-muted/40 p-3.5 border border-dashed border-border">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-orange-500" />
                  1. Image ou capture d'écran du produit
                  <span className="text-muted-foreground font-normal text-[11px]">(Optionnel)</span>
                </Label>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="real-file-upload"
              />

              {!imageBase64 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer py-5 px-4 rounded-lg border border-dashed border-orange-500/40 hover:border-orange-500 bg-background text-center flex flex-col items-center justify-center gap-2 transition-all group"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground hover:underline">
                      Cliquez pour choisir une photo ou capture d'écran
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Fichiers JPG, PNG, WebP (Prenez directement une photo depuis votre smartphone ou PC)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-lg border border-border bg-background p-3 flex items-center gap-4">
                  <img
                    src={imageBase64}
                    alt="Image téléversée"
                    className="h-16 w-16 rounded-md object-cover border"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Image prête
                    </span>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      L'image sera attachée à votre demande d'achat
                    </p>
                    <div className="mt-1.5 flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] font-semibold text-orange-500 hover:underline"
                      >
                        Changer l'image
                      </button>
                      <span className="text-muted-foreground text-xs">•</span>
                      <button
                        type="button"
                        onClick={removeUploadedImage}
                        className="text-[11px] font-semibold text-destructive hover:underline flex items-center gap-1"
                      >
                        <X className="h-3 w-3" /> Retirer
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Or image link */}
              <div className="pt-1 flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground flex-shrink-0">
                  Ou lien image :
                </span>
                <Input
                  value={productImageUrl}
                  onChange={(e) => setProductImageUrl(e.target.value)}
                  placeholder="https://... (Lien d'image direct optionnel)"
                  className="text-xs h-7 rounded-md"
                />
              </div>
            </div>

            {/* 2. Optional Product Link */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground">
                  2. Lien web du produit{" "}
                  <span className="text-muted-foreground font-normal">(Optionnel)</span>
                </Label>
                <span className="text-[11px] text-muted-foreground">Amazon, Shein, eBay...</span>
              </div>
              <Input
                type="url"
                value={productLink}
                onChange={(e) => setProductLink(e.target.value)}
                placeholder="Ex : https://www.amazon.com/dp/... ou lien Shein"
                className="text-xs h-9 rounded-md"
              />
            </div>

            {/* 3. Site web ou enseigne marchande */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                3. Site marchand ou boutique{" "}
                <span className="text-muted-foreground font-normal">(Optionnel)</span>
              </Label>
              <Input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Ex : Amazon, Shein, eBay, AliExpress, Walmart, Zara..."
                className="text-xs h-9 rounded-md"
              />
              <div className="flex flex-wrap gap-1 pt-1">
                <span className="text-[10px] text-muted-foreground self-center mr-1">
                  Raccourcis :
                </span>
                {QUICK_STORES.map((sName) => (
                  <button
                    key={sName}
                    type="button"
                    onClick={() => setStoreName(sName)}
                    className="text-[11px] px-2 py-0.5 rounded-md border border-border bg-muted/60 hover:bg-muted font-medium transition-colors"
                  >
                    {sName}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Description ou Panier */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-foreground">
                4. Description, taille, couleur ou détails du panier{" "}
                <span className="text-muted-foreground font-normal">(Optionnel)</span>
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez votre article (taille, couleur, modèle, options, ou copiez votre liste de panier)..."
                rows={3}
                className="text-xs resize-none rounded-md"
              />
            </div>

            {/* 5. Client sets their own price */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground">
                  5. Votre prix estimé ou budget (USD $){" "}
                  <span className="text-muted-foreground font-normal">(Optionnel)</span>
                </Label>
                <span className="text-[11px] text-emerald-600 font-medium">
                  Vérification finale par l'admin
                </span>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={clientPriceInput}
                  onChange={(e) => setClientPriceInput(e.target.value)}
                  placeholder="Ex : 25.00 (ou laissez vide si à évaluer)"
                  className="text-sm font-bold pl-7 h-9 rounded-md"
                />
                <span className="absolute left-2.5 top-2 text-muted-foreground font-bold text-xs">
                  $
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Indiquez votre prix indicatif. L'administration vérifiera le montant exact et appliquera les taxes applicables.
              </p>
            </div>

            {/* 6. Coordonnées & Ville de réception */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Votre nom *</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nom & prénom"
                  required
                  className="text-xs h-9 rounded-md"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Téléphone / WhatsApp *</Label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Votre numéro de téléphone"
                  required
                  className="text-xs h-9 rounded-md"
                />
              </div>
            </div>

            {!user && (
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Votre e-mail (pour recevoir la confirmation)</Label>
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="vous@exemple.com"
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Ville en Haïti</Label>
                <Input
                  value={deliveryCity}
                  onChange={(e) => setDeliveryCity(e.target.value)}
                  placeholder="Delmas, Pétion-Ville, etc."
                  className="text-xs h-9 rounded-md"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Adresse de livraison</Label>
                <Input
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Quartier, Rue, Repère..."
                  className="text-xs h-9 rounded-md"
                />
              </div>
            </div>

            {/* 7. Déduction sur solde portefeuille */}
            <div className="space-y-2 pt-2 border-t border-border rounded-lg bg-muted/30 p-3.5 border">
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="deduct-wallet"
                  checked={deductFromWallet}
                  onCheckedChange={(v) => setDeductFromWallet(v === true)}
                  className="mt-0.5 rounded-sm"
                />
                <div className="space-y-0.5">
                  <label
                    htmlFor="deduct-wallet"
                    className="text-xs font-bold text-foreground cursor-pointer block"
                  >
                    Déduire de mon solde portefeuille dès vérification par l'admin
                  </label>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Si votre solde est suffisant (${walletBalance.toFixed(2)} USD disponible), le montant vérifié sera automatiquement prélevé pour commander immédiatement.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-md font-bold text-sm bg-orange-600 hover:bg-orange-700 text-white shadow-xs"
            >
              {isSubmitting ? (
                "Enregistrement de la demande…"
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Valider ma demande d'achat
                </span>
              )}
            </Button>
          </form>
        </div>

        {/* Right Column: Financial Summary & Explanations */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-orange-500" />
              Récapitulatif Financier
            </h3>

            <div className="space-y-2 text-xs divide-y divide-border">
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Prix estimé par vous :</span>
                <span className="font-bold">
                  {numericPrice > 0 ? `$${numericPrice.toFixed(2)} USD` : "À évaluer"}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Frais d'achat assisté :</span>
                <span className="font-semibold text-muted-foreground">
                  {numericPrice > 0 ? `$${calculatedFee.toFixed(2)} USD` : "Optionnel"}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Taxes applicables :</span>
                <span className="text-orange-500 font-semibold">Vérifiées par l'admin</span>
              </div>
              <div className="flex justify-between py-2 text-sm font-extrabold text-foreground pt-2">
                <span>Total estimé :</span>
                <span className="text-orange-500">
                  {numericPrice > 0 ? `$${totalUsd.toFixed(2)} USD` : "Calculé après vérification"}
                </span>
              </div>
              {numericPrice > 0 && (
                <div className="flex justify-between py-1 text-xs text-muted-foreground">
                  <span>En Gourdes (Taux {rate} HTG) :</span>
                  <span className="font-bold">{formatNumber(totalHtg)} HTG</span>
                </div>
              )}
            </div>

            <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground space-y-1.5 border border-border">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <ShieldCheck className="h-4 w-4 text-orange-500" />
                Comment se déroule votre commande ?
              </div>
              <p className="text-[11px] leading-relaxed">
                1. Vous soumettez le lien ou la capture de votre article.
                <br />
                2. L'administrateur confirme la disponibilité et valide le tarif final.
                <br />
                3. Dès confirmation, le colis est acheté et acheminé vers notre hub de Miami puis vers Haïti !
              </p>
            </div>
          </div>

          {/* Quick Chat with Support Assistant */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 text-white shadow-xs space-y-2.5">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-orange-400" />
              <h4 className="font-bold text-sm">Une question sur un achat ?</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Discutez directement avec un conseiller ou notre support en direct pour obtenir une assistance sur votre panier.
            </p>
            <Button
              size="sm"
              className="w-full rounded-md font-bold bg-orange-600 hover:bg-orange-700 text-white"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("prime_open_chat", {
                    detail: {
                      dossierId: "DOSSIER-ACHAT-ASSISTE",
                      dossierTitle: "Achat assisté sur-mesure",
                    },
                  }),
                );
              }}
            >
              Ouvrir le chat du support
            </Button>
          </div>
        </div>
      </div>

      {/* Mes Demandes d'Achat Assisté (Historique) */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">Vos demandes d'achats en cours</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Suivez l'état d'avancement et l'acheminement de vos articles.
            </p>
          </div>
          <span className="text-xs font-bold bg-muted px-2.5 py-1 rounded-md border border-border">
            {myPurchases.length} demande{myPurchases.length > 1 ? "s" : ""}
          </span>
        </div>

        {myPurchases.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-xs space-y-2">
            <ShoppingBag className="h-8 w-8 mx-auto opacity-30 text-orange-500" />
            <p>
              {user
                ? "Vous n'avez pas encore de demande d'achat assisté."
                : "Connectez-vous pour suivre vos demandes d'achat assisté."}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {myPurchases.map((req) => {
              const reqTotalUsd = safeNumber(req?.total_usd, 0);
              const reqTaxUsd = req?.tax_usd !== undefined ? safeNumber(req.tax_usd, 0) : null;
              return (
                <div
                  key={req.id || Math.random().toString()}
                  className="rounded-lg border border-border p-4 bg-card hover:bg-muted/30 transition-colors space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-black text-orange-500">
                      {req.request_number || "ACH"}
                    </span>
                    {getStatusBadge(req.status)}
                  </div>

                  <div className="flex items-start gap-3">
                    {req.image_base64 || req.product_image_url ? (
                      <img
                        src={req.image_base64 || req.product_image_url}
                        alt={req.store_name || "Produit"}
                        className="h-14 w-14 rounded-md object-cover border flex-shrink-0"
                      />
                    ) : (
                      <div className="grid h-14 w-14 place-items-center rounded-md bg-muted text-muted-foreground flex-shrink-0">
                        <ShoppingBag className="h-5 w-5 opacity-40" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-orange-500 uppercase">
                        {req.store_name || "Site marchand"}
                      </span>
                      <p className="text-xs font-semibold text-foreground truncate mt-0.5">
                        {req.description || "Article d'achat assisté"}
                      </p>
                      <div className="text-xs font-extrabold text-foreground mt-1">
                        {reqTotalUsd > 0
                          ? `$${reqTotalUsd.toFixed(2)} USD`
                          : "En cours d'évaluation"}
                        {reqTaxUsd ? ` (dont $${reqTaxUsd.toFixed(2)} taxe)` : ""}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">
                      {formatDateSafe(req.created_at)}
                    </span>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Partner Brands & Payment Methods Showcase */}
      <div className="rounded-xl bg-card border border-border p-6 shadow-xs space-y-6">
        <PartnerBrandsBar />
        <div className="pt-6 border-t border-border">
          <PaymentMethodsBar />
        </div>
      </div>
    </div>
  );
}
