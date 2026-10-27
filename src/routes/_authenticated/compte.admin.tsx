// @ts-nocheck — legacy pages pending migration to real tables
import { saveExtraSettings } from "@/lib/admin-settings";
import { DEFAULT_ORDER_NOTICE } from "@/lib/order-minimums";
import { sendClientEmail } from "@/lib/email.functions";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Settings,
  Sliders,
  DollarSign,
  Palette,
  Megaphone,
  CreditCard,
  Plus,
  Trash2,
  Edit3,
  Copy,
  CheckCircle2,
  XCircle,
  Eye,
  ShoppingBag,
  Wallet,
  Clock,
  Layers,
  Save,
  Upload,
  Globe,
  ExternalLink,
  MessageCircle,
  UserCheck,
  Bot,
  FileText,
  Check,
  Sparkles,
  ArrowUp,
  ArrowDown,
  HelpCircle,
  ShieldCheck,
  CheckSquare,
  List,
  Hash,
  Calendar,
  Paperclip,
  Image as ImageIcon,
  Video,
  File,
  Printer,
  BellRing,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/lib/settings";
import { useRoles, useUser } from "@/lib/session";
import { clientStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { AdminInvoiceBuilder } from "@/components/AdminInvoiceBuilder";
import { AdminWalletAdjust } from "@/components/AdminWalletAdjust";
import { AdminEmailTemplates } from "@/components/AdminEmailTemplates";
import { AdminErrorLogs } from "@/components/AdminErrorLogs";
import { AdminWhatsAppContacts } from "@/components/AdminWhatsAppContacts";
import { AdminSiteLinks } from "@/components/AdminSiteLinks";
import { broadcastPushNotification } from "@/lib/push-notifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getUsaAddress, type UsaAddress } from "@/lib/usa-address";
import type {
  ProductItem,
  ProductVariant,
  ProductKind,
  CustomFormField,
  CustomFieldType,
  AdminPaymentConfig,
  CheckoutCustomerFieldsConfig,
  WalletTransaction,
  OrderItem,
  OrderStatus,
  AssistedPurchaseRequest,
  AssistedPurchaseStatus,
  SupportThread,
  ChatMessage,
} from "@/lib/types-store";

export const Route = createFileRoute("/_authenticated/compte/admin")({
  head: () => ({ meta: [
    { title: "Administration — Prime Shipping" },
    { name: "description", content: "Gestion des commandes, produits et e-mails Prime Shipping." },
    { property: "og:title", content: "Administration — Prime Shipping" },
    { property: "og:description", content: "Espace de gestion sécurisé Prime Shipping." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AdminGate,
});

function AdminGate() {
  const { user, ready } = useUser();
  const { isAdmin, loading } = useRoles(user?.id);
  if (!ready || loading) return <p className="p-8 text-muted-foreground">Chargement…</p>;
  if (!isAdmin) return <p className="p-8 text-muted-foreground">Accès refusé.</p>;
  return <AdminHubPage />;
}

function AdminHubPage() {
  const qc = useQueryClient();
  const s = useSettings();
  const [tab, setTab] = useState<
    | "settings"
    | "products"
    | "payments"
    | "customer_fields"
    | "pos"
    | "achats"
    | "wallet_approvals"
    | "contacts"
    | "orders"
    | "chats"
    | "emails"
    | "logs"
  >("settings");

  // -------------------------------------------------------------
  // TAB 1: Global Company Settings & White Label State
  // -------------------------------------------------------------
  const [rateHtg, setRateHtg] = useState<number>(s?.usd_to_htg || 132);
  const [taxRate, setTaxRate] = useState<number>(s?.tax_rate || 10);
  const [taxEnabled, setTaxEnabled] = useState<boolean>(s?.tax_enabled ?? true);
  const [bgType, setBgType] = useState<"default" | "solid" | "gradient" | "texture">(
    s?.bg_type || "default",
  );
  const [bgValue, setBgValue] = useState<string>(s?.bg_value || "");
  const [bannerActive, setBannerActive] = useState<boolean>(s?.promo_banner_active ?? true);
  const [bannerText, setBannerText] = useState<string>(s?.promo_banner_text || "");
  const [bannerLink, setBannerLink] = useState<string>(s?.promo_banner_link || "/boutique");
  const [moncashMerchant, setMoncashMerchant] = useState<string>(s?.moncash_merchant_number || "");
  const [moncashPhone, setMoncashPhone] = useState<string>(s?.moncash_phone || "");
  const [moncashInstructions, setMoncashInstructions] = useState<string>(
    s?.moncash_instructions || "",
  );
  const [natcashPhone, setNatcashPhone] = useState<string>(s?.natcash_phone || "");
  const [natcashInstructions, setNatcashInstructions] = useState<string>(
    s?.natcash_instructions || "",
  );
  const [bankAccounts, setBankAccounts] = useState<string>(s?.bank_accounts || "");
  // Assisted purchase settings
  const [assistedFeeUsd, setAssistedFeeUsd] = useState<number>(s?.assisted_purchase_fee_usd ?? 5);
  const [assistedFeePercent, setAssistedFeePercent] = useState<number>(
    s?.assisted_purchase_fee_percent ?? 5,
  );
  const [assistedFeeType, setAssistedFeeType] = useState<"fixed" | "percent">(
    s?.assisted_purchase_fee_type || "fixed",
  );

  // Configuration IA Assistante dans le Chat
  const [aiEnabled, setAiEnabled] = useState<boolean>(s?.ai_assistant_enabled ?? true);
  const [aiName, setAiName] = useState<string>(s?.ai_assistant_name || "Prime Assistant IA");
  const [aiRole, setAiRole] = useState<string>(
    s?.ai_assistant_role || "Conseiller Clientèle & Logistique",
  );
  const [aiPrompt, setAiPrompt] = useState<string>(
    s?.ai_assistant_prompt ||
      `Tu es le conseiller officiel de Prime Shipping en Haïti. Ton travail est d'assister les clients pour le suivi de leurs colis internationaux, leurs demandes d'achats assistés (« Achetez pour moi »), les tarifs (4.50 USD / lb), les recharges MonCash/Natcash et les livraisons en Haïti. Sois précis, chaleureux et professionnel.`,
  );

  // Conditions d'utilisation & Politiques
  const [termsConditions, setTermsConditions] = useState<string>(
    s?.terms_and_conditions || s?.terms || "",
  );
  const [shippingPolicy, setShippingPolicy] = useState<string>(s?.shipping_policy || "");
  const [privacyPolicy, setPrivacyPolicy] = useState<string>(s?.privacy_policy || s?.privacy || "");
  const [returnPolicy, setReturnPolicy] = useState<string>(
    s?.return_policy || s?.refund_policy || "",
  );

  const [hqAddress, setHqAddress] = useState<string>(s?.hq_address || "");
  const [ratePerLb, setRatePerLb] = useState<string>(
    s?.shipping_rate_per_lb != null ? String(s.shipping_rate_per_lb) : "",
  );
  const [loadedFromDb, setLoadedFromDb] = useState(false);
  useEffect(() => {
    if (!s || loadedFromDb || !(s as any).id) return;
    setLoadedFromDb(true);
    setHqAddress(s.hq_address || "");
    setCPhone(s.phone || "");
    setCEmail(s.email || "");
    setCWhatsapp((s as any).whatsapp || "");
    setCPickup((s as any).pickup_address || "");
    setCHours((s as any).opening_hours || "");
    setMapLat(String((s as any).map_lat || ""));
    setMapLng(String((s as any).map_lng || ""));
    setRatePerLb(s.shipping_rate_per_lb != null ? String(s.shipping_rate_per_lb) : "");
    setInvFooter((s as any).invoice_footer || "");
    setInvLogoShip((s as any).invoice_logo_shipping || "");
    setInvLogoStore((s as any).invoice_logo_store || "");
    setUsaAddr(getUsaAddress(s));
    setPickupBranches((s as any).pickup_branches || "");
    if (s.usd_to_htg) setRateHtg(Number(s.usd_to_htg));
  }, [s, loadedFromDb]);
  const [cPhone, setCPhone] = useState<string>(s?.phone || "");
  const [cEmail, setCEmail] = useState<string>(s?.email || "");
  const [cWhatsapp, setCWhatsapp] = useState<string>((s as any)?.whatsapp || "");
  const [cPickup, setCPickup] = useState<string>((s as any)?.pickup_address || "");
  const [cHours, setCHours] = useState<string>((s as any)?.opening_hours || "");
  const [mapLat, setMapLat] = useState<string>((s as any)?.map_lat || "");
  const [mapLng, setMapLng] = useState<string>((s as any)?.map_lng || "");
  const [invFooter, setInvFooter] = useState<string>((s as any)?.invoice_footer || "");
  const [invLogoShip, setInvLogoShip] = useState<string>((s as any)?.invoice_logo_shipping || "");
  const [invLogoStore, setInvLogoStore] = useState<string>((s as any)?.invoice_logo_store || "");
  const [usaAddr, setUsaAddr] = useState<UsaAddress>(() => getUsaAddress(s));
  const [pickupBranches, setPickupBranches] = useState<string>((s as any)?.pickup_branches || "");
  const uploadLogo = async (file: File, setter: (v: string) => void) => {
    const r = new FileReader();
    r.onload = () => setter(String(r.result));
    r.readAsDataURL(file);
  };
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    const settingsPayload = {
      usd_to_htg: rateHtg,
      tax_rate: taxRate,
      tax_enabled: taxEnabled,
      bg_type: bgType,
      bg_value: bgValue,
      promo_banner_active: bannerActive,
      promo_banner_text: bannerText,
      promo_banner_link: bannerLink,
      moncash_merchant_number: moncashMerchant,
      moncash_phone: moncashPhone,
      moncash_instructions: moncashInstructions,
      natcash_phone: natcashPhone,
      natcash_instructions: natcashInstructions,
      bank_accounts: bankAccounts,
      assisted_purchase_fee_usd: assistedFeeUsd,
      assisted_purchase_fee_percent: assistedFeePercent,
      assisted_purchase_fee_type: assistedFeeType,
      // IA Assistante
      ai_assistant_enabled: aiEnabled,
      ai_assistant_name: aiName,
      ai_assistant_role: aiRole,
      ai_assistant_prompt: aiPrompt,
      // Conditions et Politiques
      terms_and_conditions: termsConditions,
      shipping_policy: shippingPolicy,
      privacy_policy: privacyPolicy,
      return_policy: returnPolicy,
      map_lat: mapLat,
      map_lng: mapLng,
      invoice_footer: invFooter,
      invoice_logo_shipping: invLogoShip,
      invoice_logo_store: invLogoStore,
      usa_address: usaAddr,
      pickup_branches: pickupBranches,
    };

    // 1. Immediately save to local reactive store
    clientStore.saveSettings(settingsPayload);

    // 2. Also persist to Supabase if available
    try {
      const { data: cur } = await supabase
        .from("company_settings")
        .select("extra")
        .eq("id", 1)
        .maybeSingle();
      const mergedExtra = {
        ...((cur?.extra as Record<string, unknown>) || {}),
        ...settingsPayload,
        shipping_rate_per_lb: Number(ratePerLb) || null,
      };
      const { error } = await supabase
        .from("company_settings")
        .update({
          extra: mergedExtra as never,
          usd_to_htg: rateHtg,
          shipping_rate_per_lb: Number(ratePerLb) || null,
          hq_address: hqAddress || null,
          phone: cPhone || null,
          email: cEmail || null,
          whatsapp: cWhatsapp || null,
          pickup_address: cPickup || null,
          opening_hours: cHours.trim() || null,
        })
        .eq("id", 1);
      if (error) throw error;
    } catch (err) {
      toast.error("Échec de l'enregistrement.");
      setIsSavingSettings(false);
      return;
    }

    qc.invalidateQueries({ queryKey: ["company_settings"] });
    toast.success("Paramètres et IA enregistrés avec succès !");
    setIsSavingSettings(false);
  };

  // Broadcast push notification state & action
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastLink, setBroadcastLink] = useState("/suivi");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      return toast.error("Veuillez renseigner un titre et un message pour la diffusion.");
    }
    setIsBroadcasting(true);
    try {
      await broadcastPushNotification(
        broadcastTitle.trim(),
        broadcastMessage.trim(),
        broadcastLink.trim() || "/suivi",
      );
      toast.success("Notification push générale diffusée à tous les clients !", {
        description: `Titre : ${broadcastTitle}`,
      });
      setBroadcastTitle("");
      setBroadcastMessage("");
    } catch {
      toast.error("Erreur lors de la diffusion de la notification.");
    } finally {
      setIsBroadcasting(false);
    }
  };

  // -------------------------------------------------------------
  // TAB 2: Products & Custom Form Fields (Google Forms / Take App)
  // -------------------------------------------------------------
  const productsQuery = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => clientStore.syncProductsFromCloud(),
  });

  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  // Form builder fields state
  const [prodTitle, setProdTitle] = useState("");
  const [prodShortDesc, setProdShortDesc] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodCategory, setProdCategory] = useState("Demande spéciale");
  const [prodSubcategory, setProdSubcategory] = useState("");
  const [prodKind, setProdKind] = useState<ProductKind>("physique");
  const [prodPriceUsd, setProdPriceUsd] = useState("15");
  const [prodCurrency, setProdCurrency] = useState<"USD" | "HTG">("USD");
  const [prodDeliveryPricing, setProdDeliveryPricing] = useState<"fixed" | "quote">("quote");
  const [prodDeliveryFee, setProdDeliveryFee] = useState("0");
  const [prodPromoPriceUsd, setProdPromoPriceUsd] = useState("");
  const [prodApplyTax, setProdApplyTax] = useState(false);
  const [prodTaxRateOverride, setProdTaxRateOverride] = useState("");
  const [prodRequiresShipping, setProdRequiresShipping] = useState<boolean>(true);
  const [prodDeliveryOptions, setProdDeliveryOptions] = useState<"both" | "home" | "pickup">(
    "both",
  );
  const [prodMediaUrls, setProdMediaUrls] = useState<string>("");
  const [prodVideoUrl, setProdVideoUrl] = useState<string>("");
  const [prodOrderMode, setProdOrderMode] = useState<"site" | "link" | "whatsapp">("site");
  const [prodOrderLink, setProdOrderLink] = useState("");
  const [prodAmountMode, setProdAmountMode] = useState(false);
  const [prodSpecificRate, setProdSpecificRate] = useState("");
  const [prodMinimumQuantity, setProdMinimumQuantity] = useState("1");
  const [prodMinimumOrderUsd, setProdMinimumOrderUsd] = useState("");
  const [prodOrderNotice, setProdOrderNotice] = useState(DEFAULT_ORDER_NOTICE);
  const [prodVariants, setProdVariants] = useState<ProductVariant[]>([]);
  const [prodCustomFields, setProdCustomFields] = useState<CustomFormField[]>([]);

  // Payment methods management state
  const [paymentConfigs, setPaymentConfigs] = useState<AdminPaymentConfig[]>(() =>
    clientStore.getPaymentConfigs(),
  );

  useEffect(() => { if (Array.isArray(s?.payment_configs)) { clientStore.savePaymentConfigs(s.payment_configs); setPaymentConfigs(s.payment_configs); } }, [s?.payment_configs]);

  const handleUpdatePayment = async (id: string, updates: Partial<AdminPaymentConfig>) => {
    clientStore.updatePaymentConfig(id, updates);
    setPaymentConfigs([...clientStore.getPaymentConfigs()]);
    try { await saveExtraSettings({ payment_configs: clientStore.getPaymentConfigs() }); qc.invalidateQueries({ queryKey: ["company_settings"] }); toast.success("Moyen de paiement mis à jour !"); } catch (e) { toast.error(e instanceof Error ? e.message : "Enregistrement impossible"); }
  };

  // Customer Checkout fields management state
  const [customerFieldsConfig, setCustomerFieldsConfig] = useState<CheckoutCustomerFieldsConfig>(
    () => clientStore.getCustomerFieldsConfig(),
  );

  const handleToggleCustomerField = (key: keyof CheckoutCustomerFieldsConfig) => {
    const updated = { ...customerFieldsConfig, [key]: !customerFieldsConfig[key] };
    clientStore.saveCustomerFieldsConfig(updated);
    setCustomerFieldsConfig({ ...updated });
    toast.success("Exigences client checkout mises à jour !");
  };

  const handleStartCreateProduct = () => {
    setIsCreatingProduct(true);
    setEditingProduct(null);
    setProdTitle("");
    setProdShortDesc("");
    setProdDesc("");
    setProdCategory("Demande spéciale");
    setProdSubcategory("");
    setProdKind("physique");
    setProdPriceUsd("15");
    setProdCurrency("USD"); setProdDeliveryPricing("quote"); setProdDeliveryFee("0");
    setProdPromoPriceUsd("");
    setProdApplyTax(false);
    setProdTaxRateOverride("");
    setProdRequiresShipping(true);
    setProdDeliveryOptions("both");
    setProdMediaUrls("");
    setProdVideoUrl("");
    setProdOrderMode("site");
    setProdOrderLink("");
    setProdAmountMode(false);
    setProdSpecificRate("");
    setProdMinimumQuantity("1");
    setProdMinimumOrderUsd("");
    setProdOrderNotice(DEFAULT_ORDER_NOTICE);
    setProdVariants([
      { id: `v-${Date.now()}-1`, name: "Option Standard", price_usd: 15, stock: 100 },
    ]);
    setProdCustomFields([
      {
        id: "cf-1",
        label: "Lien ou référence du produit",
        type: "textarea",
        required: true,
        placeholder: "https://...",
        help_text:
          "Collez le lien direct de l'article sur Amazon, Shein, eBay ou le site marchand.",
      },
      {
        id: "cf-2",
        label: "Taille / Variante",
        type: "text",
        required: true,
        placeholder: "Ex: M, XL, 42...",
      },
      {
        id: "cf-3",
        label: "Couleur souhaitée",
        type: "text",
        required: false,
        placeholder: "Ex: Noir, Blanc...",
      },
    ]);
  };

  const handleStartEditProduct = (prod: ProductItem) => {
    setEditingProduct(prod);
    setIsCreatingProduct(false);
    setProdTitle(prod.title);
    setProdShortDesc(prod.short_description || "");
    setProdDesc(prod.description);
    setProdCategory(prod.category);
    setProdSubcategory(prod.subcategory || "");
    setProdKind(prod.kind || "physique");
    setProdPriceUsd(String(prod.price_usd));
    setProdCurrency(prod.extra?.price_currency === "HTG" ? "HTG" : "USD");
    setProdDeliveryPricing(prod.extra?.delivery_pricing === "fixed" ? "fixed" : "quote");
    setProdDeliveryFee(String(prod.extra?.delivery_fee_htg || 0));
    setProdPromoPriceUsd(prod.promo_price_usd ? String(prod.promo_price_usd) : "");
    setProdApplyTax(prod.apply_tax);
    setProdTaxRateOverride(prod.tax_rate_override ? String(prod.tax_rate_override) : "");
    setProdRequiresShipping(prod.requires_shipping_address ?? true);
    setProdDeliveryOptions(prod.delivery_options ?? "both");
    setProdMediaUrls((prod.media_urls || []).join("\n"));
    setProdVideoUrl(prod.video_url || "");
    setProdOrderMode(prod.extra?.order_mode ?? "site");
    setProdOrderLink(prod.extra?.order_link ?? "");
    setProdAmountMode(prod.extra?.amount_mode === "custom_usd");
    setProdSpecificRate(String(prod.extra?.product_rate_htg || ""));
    setProdMinimumQuantity(String(prod.extra?.minimum_quantity || 1));
    setProdMinimumOrderUsd(String(prod.extra?.minimum_order_usd || ""));
    setProdOrderNotice(prod.extra?.order_notice ?? DEFAULT_ORDER_NOTICE);
    setProdVariants(prod.variants || []);
    setProdCustomFields(prod.custom_fields || []);
  };

  // Variants handlers
  const handleAddVariant = () => {
    const newVariant: ProductVariant = {
      id: `v-${Date.now()}`,
      name: `Nouvelle option ${prodVariants.length + 1}`,
      price_usd: parseFloat(prodPriceUsd) || 10,
      promo_price_usd: null,
      stock: 100,
    };
    setProdVariants([...prodVariants, newVariant]);
  };

  const handleRemoveVariant = (index: number) => {
    setProdVariants(prodVariants.filter((_, i) => i !== index));
  };

  const handleUpdateVariant = (index: number, updates: Partial<ProductVariant>) => {
    setProdVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...updates } : v)));
  };

  // Dynamic Form Field handlers
  const handleAddCustomField = () => {
    const newField: CustomFormField = {
      id: `cf-${Date.now()}`,
      label: "Nouveau champ personnalisé",
      type: "text",
      required: true,
      placeholder: "",
      help_text: "",
    };
    setProdCustomFields([...prodCustomFields, newField]);
  };

  const handleRemoveCustomField = (index: number) => {
    setProdCustomFields(prodCustomFields.filter((_, i) => i !== index));
  };

  const handleUpdateCustomField = (index: number, updates: Partial<CustomFormField>) => {
    setProdCustomFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  };

  const handleMoveCustomField = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= prodCustomFields.length) return;
    const updated = [...prodCustomFields];
    const temp = updated[index]!;
    updated[index] = updated[targetIndex]!;
    updated[targetIndex] = temp;
    setProdCustomFields(updated);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const mediaArray = prodMediaUrls
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (prodAmountMode && !(Number(prodSpecificRate) > 0)) return toast.error("Indiquez le taux spécifique du produit.");
    if (prodSpecificRate.trim() && (!Number.isFinite(Number(prodSpecificRate)) || Number(prodSpecificRate) <= 0)) return toast.error("Indiquez un taux de change supérieur à zéro.");
    if (!Number.isFinite(Number(prodDeliveryFee)) || Number(prodDeliveryFee) < 0) return toast.error("Indiquez un tarif de livraison positif ou nul.");
    const minimumQty = Number(prodMinimumQuantity);
    const minimumUsd = Number(prodMinimumOrderUsd);
    if (!Number.isInteger(minimumQty) || minimumQty < 1 || minimumQty > 999 || !Number.isFinite(minimumUsd) || minimumUsd < 0 || Math.abs(minimumUsd * 100 - Math.round(minimumUsd * 100)) > 0.000001) return toast.error("Indiquez une quantité minimum de 1 à 999 et un montant positif à deux décimales maximum.");
    const payload = {
      title: prodTitle,
      short_description: prodShortDesc.trim() || undefined,
      description: prodDesc,
      category: prodCategory,
      subcategory: prodSubcategory.trim() || undefined,
      kind: prodKind,
      price_usd: parseFloat(prodPriceUsd) || 0,
      promo_price_usd: prodPromoPriceUsd ? parseFloat(prodPromoPriceUsd) : null,
      apply_tax: prodApplyTax,
      tax_rate_override: prodTaxRateOverride ? parseFloat(prodTaxRateOverride) : null,
      requires_shipping_address: prodRequiresShipping,
      delivery_options: prodDeliveryOptions,
      variants: prodVariants,
      media_urls: mediaArray,
      video_url: prodVideoUrl.trim() || null,
      custom_fields: prodCustomFields.map((f) =>
        f.options ? { ...f, options: f.options.map((o) => o.trim()).filter(Boolean) } : f,
      ),
      is_active: true,
      extra: { ...(editingProduct?.extra || {}), price_currency: prodAmountMode ? "USD" : prodCurrency, delivery_pricing: prodDeliveryPricing, delivery_fee_htg: Number(prodDeliveryFee), order_mode: prodOrderMode, order_link: prodOrderLink.trim(), amount_mode: prodAmountMode ? "custom_usd" : "fixed", product_rate_htg: prodSpecificRate.trim() ? Number(prodSpecificRate) : null, minimum_quantity: prodAmountMode ? 1 : minimumQty, minimum_order_usd: minimumUsd, order_notice: prodOrderNotice.trim() },
    };

    try {
      const id = editingProduct?.id || `prod-${Date.now()}`;
      const { error } = await supabase.from("products").upsert({
        ...payload,
        id,
        custom_fields: payload.custom_fields as never,
        variants: payload.variants as never,
        extra: payload.extra as never,
      });
      if (error) throw new Error("Enregistrement impossible : " + error.message);
      try { clientStore.saveProduct({ ...payload, id }); } catch { /* cache local plein : ignoré */ }
      toast.success(
        editingProduct
          ? "Produit, variantes et formulaire mis à jour !"
          : "Nouveau produit, variantes et formulaire créés avec succès !",
      );
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products-list"] });
      setIsCreatingProduct(false);
      setEditingProduct(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur d'enregistrement");
    }
  };

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const handleDeleteProduct = async (id: string) => {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);
      toast("Cliquez encore sur la corbeille pour confirmer la suppression.");
      setTimeout(() => setPendingDeleteId((p) => (p === id ? null : p)), 5000);
      return;
    }
    setPendingDeleteId(null);
    try {
      const { data: deleted, error } = await supabase.from("products").delete().eq("id", id).select("id");
      if (error) throw new Error("Suppression impossible. Réessayez.");
      if (!deleted || deleted.length === 0) throw new Error("Suppression refusée : compte administrateur requis.");
      clientStore.deleteProduct(id);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products-list"] });
      toast.success("Produit supprimé");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur de suppression");
    }
  };

  // -------------------------------------------------------------
  // TAB 3: Wallet Approvals
  // -------------------------------------------------------------
  const approvalsQuery = useQuery({
    queryKey: ["admin-wallet-approvals"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("wallet_transactions")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && data) return data as unknown as WalletTransaction[];
      } catch {
        // ignore
      }
      return [];
    },
  });

  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);

  const handleApproveTx = async (tx: WalletTransaction) => {
    try {
      const { error } = await supabase.rpc("review_wallet_topup", { _tx_id: tx.id, _approve: true });
      if (error) throw new Error(error.message);
      try { const r = await sendClientEmail({ data: { kind: "portefeuille", walletTxId: tx.id } }); if (!r.sent) toast.warning(r.reason); } catch (e) { toast.warning(e instanceof Error ? e.message : "Recharge enregistrée, e-mail non envoyé"); }
      qc.invalidateQueries({ queryKey: ["admin-wallet-approvals"] });
      qc.invalidateQueries({ queryKey: ["my-wallet"] });
      qc.invalidateQueries({ queryKey: ["wallet-balance"] });
      toast.success(`Recharge de ${tx.amount_usd} USD validée et créditée avec succès !`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur de validation");
    }
  };

  const handleRejectTx = async (tx: WalletTransaction) => {
    try {
      const { error } = await supabase.rpc("review_wallet_topup", { _tx_id: tx.id, _approve: false });
      if (error) throw new Error(error.message);
      try { const r = await sendClientEmail({ data: { kind: "portefeuille", walletTxId: tx.id } }); if (!r.sent) toast.warning(r.reason); } catch (e) { toast.warning(e instanceof Error ? e.message : "Recharge enregistrée, e-mail non envoyé"); }
      qc.invalidateQueries({ queryKey: ["admin-wallet-approvals"] });
      toast.error(`Recharge de ${tx.amount_usd} USD rejetée.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  // -------------------------------------------------------------
  // TAB 4: Orders Management
  // -------------------------------------------------------------
  const adminOrdersQuery = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("shop_orders")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && data) {
          return data as unknown as OrderItem[];
        }
      } catch {
        // fallback
      }
      return clientStore.getOrders();
    },
  });

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { data: order, error } = await supabase.from("shop_orders").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", orderId).select("id").single();
      if (error) throw error;
      try {
        const result = await sendClientEmail({ data: { kind: "commande", orderId: order.id } });
        if (!result.sent || result.reason) toast.warning(result.reason || "E-mail non envoyé");
      } catch (error) { toast.warning(error instanceof Error ? error.message : "Statut enregistré, e-mail non envoyé"); }
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      toast.success("Statut de la commande actualisé !");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  // -------------------------------------------------------------
  // TAB 3: Assisted Purchases ("Achetez pour moi" / Demandes d'achat)
  // -------------------------------------------------------------
  const adminAchatsQuery = useQuery({
    queryKey: ["admin-assisted-purchases"],
    queryFn: async () => clientStore.getAssistedPurchases(),
  });

  const [editingAchat, setEditingAchat] = useState<AssistedPurchaseRequest | null>(null);
  const [editAchatPrice, setEditAchatPrice] = useState<string>("");
  const [editAchatFee, setEditAchatFee] = useState<string>("");
  const [editAchatTax, setEditAchatTax] = useState<string>("0");
  const [editAchatStatus, setEditAchatStatus] =
    useState<AssistedPurchaseStatus>("en_attente_validation");
  const [editAchatNotes, setEditAchatNotes] = useState<string>("");
  const [deductFromWalletOption, setDeductFromWalletOption] = useState<boolean>(true);

  const handleStartEditAchat = (ach: AssistedPurchaseRequest) => {
    setEditingAchat(ach);
    setEditAchatPrice(String(ach.exact_price_usd || 0));
    setEditAchatFee(String(ach.fee_usd || 0));
    setEditAchatTax(String(ach.tax_usd || 0));
    setEditAchatStatus(ach.status);
    setEditAchatNotes(ach.admin_notes || "");
    setDeductFromWalletOption(ach.deduct_from_wallet_after_verification ?? true);
  };

  const handleSaveAchatEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAchat) return;
    const priceNum = parseFloat(editAchatPrice) || 0;
    const feeNum = parseFloat(editAchatFee) || 0;
    const taxNum = parseFloat(editAchatTax) || 0;
    const totalUsd = Number((priceNum + feeNum + taxNum).toFixed(2));
    const totalHtg = Math.round(totalUsd * (s?.usd_to_htg || 132));

    let finalPaymentStatus = editingAchat.payment_status;
    let finalStatus = editAchatStatus;

    if (deductFromWalletOption && editAchatStatus === "validee") {
      const success = clientStore.deductWallet(
        editingAchat.user_id,
        totalUsd,
        `Commande achat assisté #${editingAchat.request_number}`,
      );
      if (success) {
        finalPaymentStatus = "paid";
        finalStatus = "payee";
        toast.success(`Montant (${totalUsd}$ USD) déduit du solde du client !`);
      } else {
        toast.warning(
          "Solde insuffisant dans le portefeuille du client. La demande est validée en attente de paiement.",
        );
      }
    }

    clientStore.updateAssistedPurchase(editingAchat.id, {
      exact_price_usd: priceNum,
      fee_usd: feeNum,
      tax_usd: taxNum,
      total_usd: totalUsd,
      total_htg: totalHtg,
      status: finalStatus,
      admin_notes: editAchatNotes,
      payment_status: finalPaymentStatus,
    });

    qc.invalidateQueries({ queryKey: ["admin-assisted-purchases"] });
    qc.invalidateQueries({ queryKey: ["my-assisted-purchases"] });
    qc.invalidateQueries({ queryKey: ["admin-wallets"] });
    setEditingAchat(null);
    toast.success(`Demande ${editingAchat.request_number} mise à jour avec succès !`);
  };

  const handleQuickApproveAchat = (ach: AssistedPurchaseRequest) => {
    const res = clientStore.verifyAndApproveAssistedPurchase(ach.id, {
      tax_usd: ach.tax_usd || 0,
      fee_usd: ach.fee_usd,
      deductFromWallet: true,
      notes: "Produit vérifié et validé par l'administrateur",
    });
    qc.invalidateQueries({ queryKey: ["admin-assisted-purchases"] });
    qc.invalidateQueries({ queryKey: ["my-assisted-purchases"] });
    qc.invalidateQueries({ queryKey: ["admin-wallets"] });
    if (res?.status === "payee") {
      toast.success(`Demande #${ach.request_number} validée et payée via portefeuille !`);
    } else {
      toast.success(`Demande #${ach.request_number} validée !`);
    }
  };

  const handleDeleteAchat = (id: string) => {
    if (confirm("Supprimer cette demande d'achat ?")) {
      clientStore.deleteAssistedPurchase(id);
      qc.invalidateQueries({ queryKey: ["admin-assisted-purchases"] });
      qc.invalidateQueries({ queryKey: ["my-assisted-purchases"] });
      toast.success("Demande d'achat supprimée.");
    }
  };

  // -------------------------------------------------------------
  // TAB 6: Support Threads & Chat Dossiers — retired
  // -------------------------------------------------------------

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administration & Configuration Globale"
        subtitle="Gestion en marque blanche absolue : taux, taxes, vitrine, formulaires, achats assistés, recharges portefeuille."
      />

      {/* Tabs selector */}
      <div className="flex gap-2 border-b pb-3 overflow-x-auto scrollbar-none">
        {(
          [
            {
              key: "settings",
              label: "1. Configuration Globale",
              icon: Settings,
            },
            {
              key: "products",
              label: "2. Formulaires & Variantes",
              icon: Layers,
            },
            {
              key: "payments",
              label: "3. Moyens de Paiement & Preuves",
              icon: CreditCard,
            },
            {
              key: "pos",
              label: "5. Facturation",
              icon: Printer,
            },
            {
              key: "achats",
              label: "6. Achats Assistés",
              icon: Globe,
            },
            {
              key: "wallet_approvals",
              label: "7. Validation Portefeuille",
              icon: Wallet,
            },
            { key: "orders", label: "8. Commandes Produits", icon: ShoppingBag },
            { key: "contacts", label: "9. WhatsApp, réseaux & zones", icon: MessageCircle },
            { key: "emails", label: "10. E-mails Brevo", icon: MessageCircle },
            { key: "logs", label: "11. Journal des erreurs", icon: MessageCircle },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const isActive = tab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
                setTab(item.key);
                setIsCreatingProduct(false);
                setEditingProduct(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-forest text-forest-foreground shadow-sm"
                  : "bg-card border text-muted-foreground hover:text-foreground hover:border-primary/50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* ================================================================= */}
      {/* TAB 1: GLOBAL CONFIGURATION & WHITE LABEL */}
      {/* ================================================================= */}
      {tab === "settings" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Card: Exchange rate & Taxes */}
          <div className="rounded-3xl border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-base font-bold text-forest flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" /> Taux de change dynamique & Taxe
              globale
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Taux de conversion (1 USD = X Gourdes)
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="any"
                    value={rateHtg}
                    onChange={(e) => setRateHtg(parseFloat(e.target.value) || 0)}
                    required
                    className="font-bold text-base h-11 pr-16"
                  />
                  <span className="absolute right-4 top-2.5 text-xs font-bold text-muted-foreground">
                    HTG
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Ce taux s'applique automatiquement sur toute la boutique, le checkout et le
                  portefeuille.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Taux de taxe par défaut (%)</Label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={taxEnabled}
                      onChange={(e) => setTaxEnabled(e.target.checked)}
                      className="rounded text-primary h-4 w-4"
                    />
                    <span>Activer la taxe</span>
                  </label>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    step="any"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    disabled={!taxEnabled}
                    className="font-bold text-base h-11 pr-12"
                  />
                  <span className="absolute right-4 top-2.5 text-xs font-bold text-muted-foreground">
                    %
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {taxEnabled
                    ? `Taxe active à ${taxRate}% sur les articles taxables.`
                    : "Taxe désactivée globalement."}
                </p>
              </div>
            </div>
          </div>

          {/* Card: Configuration Frais d'Achat Assisté (Achetez pour moi) */}
          <div className="rounded-3xl border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-base font-bold text-forest flex items-center gap-2">
              <Globe className="h-5 w-5 text-accent" /> Frais d'Achat Assisté par défaut (Page
              "Achetez pour moi")
            </h3>
            <p className="text-xs text-muted-foreground">
              Configurez le barème de frais de gestion appliqué lorsqu'un client demande à acheter
              sur un site externe (Amazon, Shein, eBay, etc.).
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Mode de tarification des frais</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAssistedFeeType("fixed")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      assistedFeeType === "fixed"
                        ? "bg-forest text-white border-forest"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    }`}
                  >
                    Montant fixe (USD)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssistedFeeType("percent")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      assistedFeeType === "percent"
                        ? "bg-forest text-white border-forest"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    }`}
                  >
                    Pourcentage (%)
                  </button>
                </div>
              </div>

              {assistedFeeType === "fixed" ? (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Frais d'achat fixes (USD)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      value={assistedFeeUsd}
                      onChange={(e) => setAssistedFeeUsd(parseFloat(e.target.value) || 0)}
                      className="font-bold text-base h-11 pl-8"
                    />
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-muted-foreground">
                      $
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Ex: 5.00 USD ajoutés au prix exact de l'article.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Pourcentage de commission (%)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      value={assistedFeePercent}
                      onChange={(e) => setAssistedFeePercent(parseFloat(e.target.value) || 0)}
                      className="font-bold text-base h-11 pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-muted-foreground">
                      %
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Ex: 5% calculé sur le prix exact saisi par le client.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Card: Background Customization */}
          <div className="rounded-3xl border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-base font-bold text-forest flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" /> Personnalisation de l'arrière-plan du
              site
            </h3>

            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(
                  [
                    { key: "default", label: "Défaut (Crème Élégant)" },
                    { key: "solid", label: "Couleur unie" },
                    { key: "gradient", label: "Dégradé fluide" },
                    { key: "texture", label: "Motif / Texture" },
                  ] as const
                ).map((bg) => (
                  <button
                    key={bg.key}
                    type="button"
                    onClick={() => setBgType(bg.key)}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all ${
                      bgType === bg.key
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:border-primary/40 text-muted-foreground"
                    }`}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>

              {bgType !== "default" && (
                <div className="space-y-1.5 animate-in fade-in">
                  <Label className="text-xs font-semibold">
                    {bgType === "solid"
                      ? "Code hexadécimal couleur (ex: #f8fafc)"
                      : bgType === "gradient"
                        ? "CSS Gradient (ex: linear-gradient(135deg, #FAF8F2 0%, #E8F5E9 100%))"
                        : "URL de l'image de texture / fond"}
                  </Label>
                  <Input
                    value={bgValue}
                    onChange={(e) => setBgValue(e.target.value)}
                    placeholder={
                      bgType === "solid"
                        ? "#FAF8F2"
                        : bgType === "gradient"
                          ? "linear-gradient(135deg, #FAF8F2 0%, #E8F5E9 100%)"
                          : "https://images.unsplash.com/..."
                    }
                    className="font-mono text-xs"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Card: Promotional Banner Manager */}
          <div className="rounded-3xl border bg-card p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-forest flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" /> Bannière publicitaire dynamique
              </h3>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={bannerActive}
                  onChange={(e) => setBannerActive(e.target.checked)}
                  className="rounded text-primary h-4 w-4"
                />
                <span>Afficher la bannière</span>
              </label>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Texte de l'annonce</Label>
                <Input
                  value={bannerText}
                  onChange={(e) => setBannerText(e.target.value)}
                  placeholder="Ex: 🎉 Offre spéciale : Achetez sur vos sites préférés, livraison rapide en Haïti !"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Lien optionnel (Boutique, Promo, etc.)
                </Label>
                <Input
                  value={bannerLink}
                  onChange={(e) => setBannerLink(e.target.value)}
                  placeholder="/boutique"
                  className="text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Card: Diffusion Générale & Notifications Push à tous les clients */}
          <div className="rounded-3xl border border-sun/60 bg-gradient-to-br from-card via-card to-sun/5 p-6 shadow-soft space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-base font-bold text-forest flex items-center gap-2">
                <BellRing className="h-5 w-5 text-sun animate-pulse" />
                Message général à tous les clients (Diffusion Push)
              </h3>
              <span className="px-2.5 py-1 rounded-full bg-sun/20 text-forest font-bold text-[11px] border border-sun/40 w-fit">
                Diffusion Immédiate
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Diffusez une alerte instantanée sur les téléphones et navigateurs de tous les clients
              connectés ou abonnés aux notifications (Prime Shipping & Prime Store). L'alerte est
              également consignée dans leur boîte de notifications.
            </p>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Titre de l'alerte générale</Label>
                <Input
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="Ex : ✈️ Arrivée du vol Miami ➔ Haïti ce jeudi !"
                  className="text-xs font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Corps du message général</Label>
                <Textarea
                  rows={2}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Ex : Vos colis reçus à l'entrepôt avant mercredi 18h sont prêts pour la livraison en Haïti. Consultez votre suivi en ligne."
                  className="text-xs"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3 items-end pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Lien de redirection au clic</Label>
                  <Input
                    value={broadcastLink}
                    onChange={(e) => setBroadcastLink(e.target.value)}
                    placeholder="/suivi ou /achat"
                    className="text-xs font-mono"
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleSendBroadcast}
                  disabled={isBroadcasting}
                  className="rounded-2xl bg-forest text-forest-foreground hover:bg-forest/90 font-black text-xs h-10 shadow-sm"
                >
                  <BellRing className="h-4 w-4 mr-2 text-sun" />
                  {isBroadcasting ? "Diffusion en cours..." : "Diffuser la notification à tous"}
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-base font-bold text-forest">Coordonnées, carte & factures</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold">
                  Adresse du bureau (affichée sur la carte)
                </Label>
                <Input value={hqAddress} onChange={(e) => setHqAddress(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Prix par livre (USD / lb) affiché sur l'accueil
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={ratePerLb}
                  onChange={(e) => setRatePerLb(e.target.value)}
                  placeholder="ex. 4.50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Téléphone</Label>
                <Input value={cPhone} onChange={(e) => setCPhone(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">E-mail</Label>
                <Input value={cEmail} onChange={(e) => setCEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">WhatsApp entreprise</Label>
                <Input value={cWhatsapp} onChange={(e) => setCWhatsapp(e.target.value)} placeholder="509XXXXXXXX" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Adresse de retrait (accueil)</Label>
                <Input value={cPickup} onChange={(e) => setCPickup(e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold">Horaires d'ouverture (laisser vide pour masquer)</Label>
                <Textarea rows={3} value={cHours} onChange={(e) => setCHours(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Latitude GPS (optionnel)</Label>
                <Input
                  type="number"
                  step="any"
                  value={mapLat}
                  onChange={(e) => setMapLat(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Longitude GPS (optionnel)</Label>
                <Input
                  type="number"
                  step="any"
                  value={mapLng}
                  onChange={(e) => setMapLng(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigator.geolocation?.getCurrentPosition(
                      (p) => {
                        setMapLat(String(p.coords.latitude));
                        setMapLng(String(p.coords.longitude));
                        toast.success("Position récupérée — enregistrez");
                      },
                      () => toast.error("Position refusée"),
                    )
                  }
                >
                  Utiliser ma position actuelle
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Logo facture Prime Shipping</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files?.[0] && uploadLogo(e.target.files[0], setInvLogoShip)
                  }
                />
                {invLogoShip && <img src={invLogoShip} alt="" className="h-12" />}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Logo facture Prime Store</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files?.[0] && uploadLogo(e.target.files[0], setInvLogoStore)
                  }
                />
                {invLogoStore && <img src={invLogoStore} alt="" className="h-12" />}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold">Texte en bas des factures</Label>
                <Input value={invFooter} onChange={(e) => setInvFooter(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-base font-bold text-forest">Adresse d'achat USA (Box client)</h3>
            <p className="text-xs text-muted-foreground">
              Affichée dans « Mes adresses » de chaque client. Dans le nom, {"{nom}"} = nom du
              client et {"{code}"} = son numéro (ex. PS 0001).
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {(
                [
                  ["name_template", "Nom affiché (modèle)", true],
                  ["line1", "Address Line 1", false],
                  ["line2", "Address Line 2 / Apt", false],
                  ["city", "City", false],
                  ["state", "State", false],
                  ["zip", "ZIP code", false],
                  ["country", "Country", false],
                  ["phone", "Phone", false],
                ] as const
              ).map(([k, label, full]) => (
                <div key={k} className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
                  <Label className="text-xs font-semibold">{label}</Label>
                  <Input
                    value={usaAddr[k]}
                    onChange={(e) => setUsaAddr({ ...usaAddr, [k]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-base font-bold text-forest">Succursales de retrait</h3>
            <p className="text-xs text-muted-foreground">
              Une succursale par ligne : Nom | Adresse | Téléphone. Proposées au client qui choisit
              « Retrait en succursale ». Laissez vide si vous n'avez pas de succursale.
            </p>
            <div className="grid gap-4">
              <Textarea
                rows={4}
                value={pickupBranches}
                onChange={(e) => setPickupBranches(e.target.value)}
                placeholder="Succursale Delmas | Delmas 33, Rue X | +509 ..."
              />
            </div>
          </div>


          {/* Card: Conditions d'utilisation & Politiques (Modifiables dans l'Admin) */}
          <div className="rounded-3xl border bg-card p-6 shadow-soft space-y-4">
            <div>
              <h3 className="text-base font-bold text-forest flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Conditions Générales d'Utilisation &
                Politiques
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Modifiez directement le texte juridique affiché sur le site et lors de l'inscription
                des clients.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Conditions Générales d'Utilisation (CGU)
                </Label>
                <Textarea
                  value={termsConditions}
                  onChange={(e) => setTermsConditions(e.target.value)}
                  placeholder="Texte des conditions d'utilisation..."
                  rows={5}
                  className="text-xs leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Politique d'Expédition & Livraison en Haïti
                </Label>
                <Textarea
                  value={shippingPolicy}
                  onChange={(e) => setShippingPolicy(e.target.value)}
                  placeholder="Détails sur l'acheminement, vols, délais et villes..."
                  rows={3}
                  className="text-xs"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Politique de Confidentialité</Label>
                  <Textarea
                    value={privacyPolicy}
                    onChange={(e) => setPrivacyPolicy(e.target.value)}
                    placeholder="Protection des données..."
                    rows={3}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Politique de Réclamations & Retours
                  </Label>
                  <Textarea
                    value={returnPolicy}
                    onChange={(e) => setReturnPolicy(e.target.value)}
                    placeholder="Délais de réclamation (48h)..."
                    rows={3}
                    className="text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full font-bold" disabled={isSavingSettings}>
            <Save className="h-4 w-4 mr-2" />{" "}
            {isSavingSettings ? "Enregistrement..." : "Enregistrer tous les paramètres"}
          </Button>
        </form>
      )}

      {/* ================================================================= */}
      {/* TAB 2: PRODUCTS & DYNAMIC FORMS (TAKE APP / GOOGLE FORMS) */}
      {/* ================================================================= */}
      {tab === "products" && (
        <div className="space-y-6">
          {!isCreatingProduct && !editingProduct ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-forest">
                    Catalogue & Formulaires de commande
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Créez des produits ou formulaires de commande avec exigences client sur-mesure
                    type Take App.
                  </p>
                </div>
                <Button
                  onClick={handleStartCreateProduct}
                  size="sm"
                  className="rounded-full font-bold"
                >
                  <Plus className="h-4 w-4 mr-1.5" /> Créer un formulaire / produit
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {productsQuery.data?.map((prod) => (
                  <div
                    key={prod.id}
                    className="rounded-2xl border bg-card p-4 space-y-3 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-forest/10 text-forest px-2 py-0.5 rounded-md">
                          {prod.category}
                        </span>
                        <span className="font-extrabold text-sm text-forest">
                          {prod.price_usd} {prod.extra?.price_currency === "HTG" ? "GDS" : "USD"}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-foreground line-clamp-1">
                        {prod.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {prod.description}
                      </p>
                      <div className="mt-2 text-[11px] text-muted-foreground">
                        {prod.custom_fields?.length || 0} champs personnalisés requis
                      </div>
                    </div>

                    <div className="border-t pt-2 flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartEditProduct(prod)}
                        className="text-xs"
                      >
                        <Edit3 className="h-3.5 w-3.5 mr-1" /> Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleStartEditProduct(prod);
                          setEditingProduct(null);
                          setIsCreatingProduct(true);
                          setProdTitle(`${prod.title} (copie)`);
                        }}
                        className="text-xs"
                      >
                        <Copy className="h-3.5 w-3.5 mr-1" /> Dupliquer
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProduct(prod.id)}
                        className="text-destructive hover:bg-destructive/10 text-xs"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {pendingDeleteId === prod.id && <span className="ml-1 font-bold">Confirmer</span>}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSaveProduct}
              className="rounded-3xl border bg-card p-6 shadow-soft space-y-6 animate-in fade-in"
            >
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-lg font-bold text-forest">
                    {editingProduct
                      ? "Modifier le produit / formulaire"
                      : "Nouveau formulaire type Google Forms / Take App"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Définissez les détails de l'article et construisez les champs personnalisés
                    exigés du client.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCreatingProduct(false);
                    setEditingProduct(null);
                  }}
                >
                  Annuler
                </Button>
              </div>

              {/* Product Basic Info */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-semibold">Titre du produit ou service *</Label>
                  <Input
                    value={prodTitle}
                    onChange={(e) => setProdTitle(e.target.value)}
                    required
                    placeholder="Ex : Recharge Diamants Free Fire ou Expédition Express"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Type de produit / Service</Label>
                  <select
                    value={prodKind}
                    onChange={(e) => setProdKind(e.target.value as ProductKind)}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs font-semibold"
                  >
                    <option value="physique">📦 Produit Physique (Livraison postale)</option>
                    <option value="numerique">⚡ Produit Numérique (Codes, streaming, clés)</option>
                    <option value="service">🛠️ Service Logistique / Professionnel</option>
                    <option value="topup">💎 Recharge Top Up Jeu / Crédit direct</option>
                    <option value="sur_mesure">🎯 Commande Sur-Mesure / Devis</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Catégorie</Label>
                  <Input
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    placeholder="Jeux & Top Up, Streaming, Logistique, Électronique..."
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-semibold">
                    Description courte (Accroche catalogue)
                  </Label>
                  <Input
                    value={prodShortDesc}
                    onChange={(e) => setProdShortDesc(e.target.value)}
                    placeholder="Bref résumé en 1 phrase affiché sur la carte..."
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-semibold">
                    Description complète / Explications de commande *
                  </Label>
                  <Textarea
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    required
                    rows={3}
                    placeholder="Expliquez en détail le fonctionnement, les délais, les garanties et conditions..."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Prix de base en {prodCurrency === "HTG" ? "GDS" : "USD"} {prodAmountMode ? "(non utilisé en montant libre)" : "*"}</Label>
                  <select aria-label="Devise du produit" value={prodAmountMode ? "USD" : prodCurrency} disabled={prodAmountMode} onChange={(e) => setProdCurrency(e.target.value as "USD" | "HTG")} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="USD">USD — Dollar américain</option><option value="HTG">GDS — Gourde haïtienne</option></select>
                  <div className="relative">
                    <Input
                      type="number"
                      step="any"
                      value={prodPriceUsd}
                      onChange={(e) => setProdPriceUsd(e.target.value)}
                      required={!prodAmountMode}
                      disabled={prodAmountMode}
                      className="font-bold pr-16"
                    />
                    <span className="absolute right-4 top-2 text-xs font-bold text-muted-foreground">
                      {prodCurrency === "HTG" ? "GDS" : "USD"}
                    </span>
                  </div>
                  {prodCurrency === "USD" && !prodAmountMode && <p className="text-[11px] text-muted-foreground">
                    ≈{" "}
                    {Math.round(
                      (parseFloat(prodPriceUsd) || 0) * (Number(prodSpecificRate) || Number(s?.usd_to_htg) || 0),
                    ).toLocaleString("fr-FR")}{" "}
                    GDS
                  </p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Prix promotionnel en {prodCurrency === "HTG" ? "GDS" : "USD"} (optionnel)
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="any"
                      value={prodPromoPriceUsd}
                      onChange={(e) => setProdPromoPriceUsd(e.target.value)}
                      placeholder="Ex: 12"
                      className="font-bold pr-16"
                    />
                    <span className="absolute right-4 top-2 text-xs font-bold text-amber-500">
                      PROMO
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-3 border-t pt-4">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={prodAmountMode} onChange={(e) => setProdAmountMode(e.target.checked)} /> Montant USD libre choisi par le client</label>
                  <div className="space-y-2"><Label htmlFor="product-exchange-rate">Taux de ce produit (GDS pour 1 USD){!prodAmountMode && " — facultatif"}</Label><Input id="product-exchange-rate" type="number" min="0.01" step="0.01" required={prodAmountMode} placeholder={`Taux général : ${s?.usd_to_htg ?? "non configuré"}`} value={prodSpecificRate} onChange={(e) => setProdSpecificRate(e.target.value)} /></div>
                </div>
                {/* Exigence adresse de livraison (configurable admin) */}
                <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2 border-t pt-4">
                  {!prodAmountMode && <div className="space-y-2"><Label htmlFor="minimum-quantity">Quantité minimum</Label><Input id="minimum-quantity" type="number" min="1" max="999" step="1" required value={prodMinimumQuantity} onChange={(e) => setProdMinimumQuantity(e.target.value)} /></div>}
                  <div className="space-y-2"><Label htmlFor="minimum-order">{prodAmountMode ? "Montant minimum à recharger (USD)" : `Montant minimum de commande (${prodCurrency === "HTG" ? "GDS" : "USD"}, hors frais)`}</Label><Input id="minimum-order" type="number" min="0" step="0.01" value={prodMinimumOrderUsd} onChange={(e) => setProdMinimumOrderUsd(e.target.value)} placeholder="Aucun minimum" /></div>
                  <div className="space-y-2 sm:col-span-2"><Label htmlFor="order-notice">Conditions et délais affichés avant commande</Label><Textarea id="order-notice" rows={4} value={prodOrderNotice} onChange={(e) => setProdOrderNotice(e.target.value)} /></div>
                </div>
                <div className="space-y-1.5 sm:col-span-2 rounded-2xl border p-4 bg-muted/40">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Label className="text-xs font-bold text-foreground">
                        Exigence d'adresse de livraison physique
                      </Label>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Si coché, le client devra renseigner une adresse de livraison en Haïti. Si
                        décoché (numérique, streaming, top up direct), aucune adresse n'est
                        demandée.
                      </p>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer flex-shrink-0 bg-card border px-3 py-1.5 rounded-xl shadow-xs">
                      <input
                        type="checkbox"
                        checked={prodRequiresShipping}
                        onChange={(e) => setProdRequiresShipping(e.target.checked)}
                        className="rounded text-primary h-4 w-4"
                      />
                      <span>
                        {prodRequiresShipping ? "Livraison requise" : "Non requise (Digital)"}
                      </span>
                    </label>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">Mode de commande</Label>
                    <select
                      value={prodOrderMode}
                      onChange={(e) => setProdOrderMode(e.target.value as "site" | "link" | "whatsapp")}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="site">Paiement / commande sur le site</option>
                      <option value="link">Lien externe (boutique officielle, etc.)</option>
                      <option value="whatsapp">Commande par WhatsApp</option>
                    </select>
                    {prodOrderMode !== "site" && (
                      <Input
                        value={prodOrderLink}
                        onChange={(e) => setProdOrderLink(e.target.value)}
                        placeholder={prodOrderMode === "whatsapp" ? "Numéro WhatsApp (ex: 50937000000)" : "https://..."}
                      />
                    )}
                  </div>
                  {prodRequiresShipping && (
                    <div className="mt-3 space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">
                        Mode de réception proposé au client
                      </Label>
                      <select
                        value={prodDeliveryOptions}
                        onChange={(e) =>
                          setProdDeliveryOptions(e.target.value as "both" | "home" | "pickup")
                        }
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="both">
                          Le client choisit : livraison ou retrait en succursale
                        </option>
                        <option value="home">Livraison à domicile uniquement</option>
                        <option value="pickup">Retrait en succursale uniquement</option>
                      </select>
                      <p className="text-[11px] text-muted-foreground">
                        Retrait en succursale gratuit. Les adresses se modifient dans les réglages.
                      </p>
                      {prodDeliveryOptions !== "pickup" && <div className="space-y-2 pt-3"><Label>Tarif de livraison de ce produit</Label><select aria-label="Tarification livraison" value={prodDeliveryPricing} onChange={(e) => setProdDeliveryPricing(e.target.value as "fixed" | "quote")} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="quote">À confirmer par un administrateur selon l’adresse</option><option value="fixed">Tarif fixe par commande</option></select>{prodDeliveryPricing === "fixed" && <><Label htmlFor="delivery-fee">Prix livraison (GDS)</Label><Input id="delivery-fee" type="number" min="0" step="0.01" value={prodDeliveryFee} onChange={(e) => setProdDeliveryFee(e.target.value)} /></>}</div>}
                    </div>
                  )}
                </div>
              </div>

              {/* GESTIONNAIRE DE VARIANTES AVANCÉES (EX: 110 DIAMONDS = 1 USD, 210 = 2 USD...) */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                      <Layers className="h-4 w-4 text-amber-500" /> Variantes du Produit avec Tarifs
                      Différents
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Ajoutez des paliers ou formules (ex : 110 Diamonds = 1$, 530 Diamonds = 5$, ou
                      1 Mois = 4.5$, 3 Mois = 14$).
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddVariant}>
                    <Plus className="h-4 w-4 mr-1" /> Ajouter une variante
                  </Button>
                </div>

                {prodVariants.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic bg-muted/30 p-3 rounded-xl">
                    Aucune variante spécifique. Le prix de base ({prodPriceUsd} {prodCurrency === "HTG" ? "GDS" : "USD"}) s'appliquera.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {prodVariants.map((v, vIdx) => (
                      <div
                        key={v.id || vIdx}
                        className="rounded-2xl border bg-muted/30 p-3 flex flex-col sm:flex-row items-center gap-2 text-xs"
                      >
                        <div className="flex-1 w-full grid sm:grid-cols-4 gap-2">
                          <Input
                            placeholder="Nom de l'option (ex : 530 Diamonds)"
                            value={v.name}
                            onChange={(e) => handleUpdateVariant(vIdx, { name: e.target.value })}
                            className="text-xs font-bold sm:col-span-2"
                          />
                          <div className="relative">
                            <Input
                              type="number"
                              step="any"
                              placeholder={`Prix ${prodCurrency === "HTG" ? "GDS" : "USD"}`}
                              value={v.price_usd}
                              onChange={(e) =>
                                handleUpdateVariant(vIdx, {
                                  price_usd: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="text-xs font-bold pr-10"
                            />
                            <span className="absolute right-2 top-2 text-[10px] text-muted-foreground font-bold">
                              {prodCurrency === "HTG" ? "GDS" : "USD"}
                            </span>
                          </div>
                          <Input
                            type="number"
                            placeholder="Stock (optionnel)"
                            value={v.stock ?? ""}
                            onChange={(e) =>
                              handleUpdateVariant(vIdx, {
                                stock: e.target.value ? parseInt(e.target.value) : null,
                              })
                            }
                            className="text-xs"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveVariant(vIdx)}
                          className="text-destructive h-8 w-8 hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Media Management */}
              <div className="space-y-3 border-t pt-4">
                <h4 className="text-sm font-bold text-foreground">Galerie Photos & Vidéo</h4>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Photos du produit</Label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    aria-label="Ajouter des photos"
                    className="block w-full text-xs file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      e.target.value = "";
                      if (!files.length) return;
                      try {
                        toast.info("Envoi des photos…");
                        const { uploadImage } = await import("@/lib/upload");
                        const urls = [];
                        for (const file of files) urls.push(await uploadImage("products/all", file));
                        setProdMediaUrls((prev) => [prev.trim(), ...urls].filter(Boolean).join("\n"));
                        toast.success("Photos ajoutées");
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Envoi impossible");
                      }
                    }}
                  />
                  <Label className="text-xs text-muted-foreground">Ou liens d'images (un par ligne)</Label>
                  <Textarea
                    value={prodMediaUrls}
                    onChange={(e) => setProdMediaUrls(e.target.value)}
                    rows={2}
                    placeholder="https://images.unsplash.com/..."
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Lien Vidéo optionnel (YouTube / Vimeo / MP4 direct)
                  </Label>
                  <Input
                    value={prodVideoUrl}
                    onChange={(e) => setProdVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              {/* CONSTRUCTEUR DE FORMULAIRE DYNAMIQUE DÉDIÉ (16 TYPES DE CHAMPS) */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-primary" /> Constructeur de Formulaire
                      par Produit (16 Types de Champs)
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Tous les champs peuvent être créés, modifiés, réorganisés (monter / descendre)
                      et supprimés.
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddCustomField}>
                    <Plus className="h-4 w-4 mr-1" /> Ajouter un champ
                  </Button>
                </div>

                <div className="space-y-3">
                  {prodCustomFields.map((cf, idx) => (
                    <div
                      key={cf.id || idx}
                      className="rounded-2xl border bg-muted/40 p-4 space-y-3 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2 border-b pb-2">
                        <div className="flex items-center gap-2 font-bold text-foreground">
                          <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span>
                            Champ {idx + 1} : {cf.label || "Sans libellé"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={idx === 0}
                            onClick={() => handleMoveCustomField(idx, "up")}
                            title="Monter"
                            className="h-7 w-7"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={idx === prodCustomFields.length - 1}
                            onClick={() => handleMoveCustomField(idx, "down")}
                            title="Descendre"
                            className="h-7 w-7"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveCustomField(idx)}
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            title="Supprimer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[11px]">Libellé du champ *</Label>
                          <Input
                            placeholder="Ex : Player ID, Email, Adresse..."
                            value={cf.label}
                            onChange={(e) =>
                              handleUpdateCustomField(idx, { label: e.target.value })
                            }
                            className="text-xs font-semibold"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px]">Type de champ (16 types)</Label>
                          <select
                            value={cf.type}
                            onChange={(e) =>
                              handleUpdateCustomField(idx, {
                                type: e.target.value as CustomFieldType,
                              })
                            }
                            className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs"
                          >
                            <option value="text">Texte court</option>
                            <option value="textarea">Texte long / Paragraphe</option>
                            <option value="number">Nombre / Quantité</option>
                            <option value="email">Adresse E-mail</option>
                            <option value="phone">Téléphone / WhatsApp</option>
                            <option value="url">URL / Lien web</option>
                            <option value="date">Date</option>
                            <option value="time">Heure</option>
                            <option value="checkbox">Case à cocher</option>
                            <option value="radio">Boutons radio (Choix unique)</option>
                            <option value="select">Liste déroulante</option>
                            <option value="multiselect">Sélection multiple</option>
                            <option value="file_image">Upload image</option>
                            <option value="file_doc">Upload document (PDF/Word)</option>
                            <option value="file_video">Upload vidéo</option>
                            <option value="file_any">Upload fichier libre</option>
                          </select>
                        </div>

                        <div className="flex items-center pt-5">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={cf.required}
                              onChange={(e) =>
                                handleUpdateCustomField(idx, { required: e.target.checked })
                              }
                              className="rounded text-primary h-4 w-4"
                            />
                            <span className="font-semibold text-xs">Champ obligatoire</span>
                          </label>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[11px]">Placeholder modifiable</Label>
                          <Input
                            placeholder="Texte d'exemple dans le champ..."
                            value={cf.placeholder || ""}
                            onChange={(e) =>
                              handleUpdateCustomField(idx, { placeholder: e.target.value })
                            }
                            className="text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px]">Description d'aide (help text)</Label>
                          <Input
                            placeholder="Conseil ou consigne sous le champ..."
                            value={cf.help_text || ""}
                            onChange={(e) =>
                              handleUpdateCustomField(idx, { help_text: e.target.value })
                            }
                            className="text-xs"
                          />
                        </div>
                      </div>

                      {(cf.type === "select" ||
                        cf.type === "radio" ||
                        cf.type === "multiselect" ||
                        cf.type === "checkbox") && (
                        <div className="space-y-2 pt-1">
                          <Label className="text-[11px]">Options disponibles</Label>
                          {(cf.options ?? []).map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-2">
                              <Input
                                placeholder={`Option ${String.fromCharCode(65 + (oIdx % 26))}`}
                                value={opt}
                                onChange={(e) => {
                                  const next = [...(cf.options ?? [])];
                                  next[oIdx] = e.target.value;
                                  handleUpdateCustomField(idx, { options: next });
                                }}
                                className="text-xs"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Retirer l'option"
                                onClick={() =>
                                  handleUpdateCustomField(idx, {
                                    options: (cf.options ?? []).filter((_, i) => i !== oIdx),
                                  })
                                }
                                className="text-destructive h-8 w-8 shrink-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleUpdateCustomField(idx, { options: [...(cf.options ?? []), ""] })
                            }
                            className="text-xs"
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter une option
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreatingProduct(false);
                    setEditingProduct(null);
                  }}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="font-bold bg-amber-500 hover:bg-amber-600 text-slate-950"
                >
                  Enregistrer le produit & formulaire
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 3: MOYENS DE PAIEMENT & PREUVES (100% ADMINISTRABLE) */}
      {/* ================================================================= */}
      {tab === "payments" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-amber-500" /> Gestion des Moyens de Paiement &
              Preuves
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Activez ou désactivez les modes de paiement (MonCash, Natcash, Sogexpress, Zelle,
              Wise, PayPal, Stripe, Crypto USDT, Cash), personnalisez les numéros de compte, QR
              codes, frais supplémentaires et l'exigence de preuve de paiement.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paymentConfigs.map((pay) => (
              <div
                key={pay.id}
                className={`rounded-3xl border p-5 space-y-4 transition-all ${
                  pay.is_enabled
                    ? "bg-card border-slate-700/80 shadow-md"
                    : "bg-muted/40 border-dashed border-border opacity-70"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-extrabold text-sm text-foreground flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${pay.is_enabled ? "bg-emerald-500" : "bg-slate-400"}`}
                    />
                    {pay.name}
                  </div>
                  <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer bg-muted px-2.5 py-1 rounded-xl">
                    <input
                      type="checkbox"
                      checked={pay.is_enabled}
                      onChange={(e) =>
                        handleUpdatePayment(pay.id, { is_enabled: e.target.checked })
                      }
                      className="rounded text-primary h-4 w-4"
                    />
                    <span>{pay.is_enabled ? "Actif" : "Désactivé"}</span>
                  </label>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">
                      Numéro de compte / Téléphone marchand
                    </Label>
                    <Input
                      value={pay.account_number || pay.phone_number || ""}
                      onChange={(e) =>
                        handleUpdatePayment(pay.id, {
                          account_number: e.target.value,
                          phone_number: e.target.value,
                        })
                      }
                      placeholder="Ex : 3700-1122 ou adresse Zelle/Wise"
                      className="font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Instructions au client</Label>
                    <Textarea
                      value={pay.instructions || ""}
                      onChange={(e) =>
                        handleUpdatePayment(pay.id, { instructions: e.target.value })
                      }
                      rows={2}
                      placeholder="Indiquez comment effectuer le versement..."
                      className="text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Frais suppl. (%)</Label>
                      <Input
                        type="number"
                        step="any"
                        value={pay.fee_percentage ?? 0}
                        onChange={(e) =>
                          handleUpdatePayment(pay.id, {
                            fee_percentage: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="text-xs font-bold"
                      />
                    </div>
                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pay.require_proof ?? true}
                          onChange={(e) =>
                            handleUpdatePayment(pay.id, { require_proof: e.target.checked })
                          }
                          className="rounded text-primary h-4 w-4"
                        />
                        <span className="text-[11px] font-bold">Exiger preuve</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* ================================================================= */}
      {/* TAB 5: POINT OF SALE (POS) & INVOICING */}
      {/* ================================================================= */}
      {tab === "pos" && <AdminInvoiceBuilder />}
      {tab === "emails" && <AdminEmailTemplates />}
      {tab === "logs" && <AdminErrorLogs />}
      {tab === "contacts" && (<div className="space-y-8"><AdminWhatsAppContacts /><AdminSiteLinks /></div>)}
      {tab === "wallet_approvals" && <div className="mb-6"><AdminWalletAdjust /></div>}

      {/* ================================================================= */}
      {/* TAB 6: WALLET TOP-UPS APPROVALS */}
      {/* ================================================================= */}
      {tab === "wallet_approvals" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-forest">Demandes de recharge portefeuille</h3>
            <p className="text-xs text-muted-foreground">
              Vérifiez les preuves de versement (MonCash, Natcash, Banques) et approuvez en 1 clic
              pour créditer le client.
            </p>
          </div>

          {approvalsQuery.isLoading ? (
            <p className="text-center py-8 text-xs text-muted-foreground">
              Chargement des demandes...
            </p>
          ) : approvalsQuery.data?.filter((t) => t.type === "topup").length === 0 ? (
            <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground text-xs">
              Aucune demande de recharge pour le moment.
            </div>
          ) : (
            <div className="divide-y rounded-2xl border bg-card overflow-hidden">
              {approvalsQuery.data
                ?.filter((t) => t.type === "topup")
                .map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-forest text-sm">
                          +${Number(tx.amount_usd).toFixed(2)} USD
                        </span>
                        <span className="text-muted-foreground">
                          ({Number(tx.amount_htg).toLocaleString("fr-FR")} HTG)
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.status === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : tx.status === "pending"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {tx.status === "approved"
                            ? "Approuvé"
                            : tx.status === "pending"
                              ? "En attente"
                              : "Rejeté"}
                        </span>
                      </div>

                      <p className="text-muted-foreground">
                        Client :{" "}
                        <strong className="text-foreground">{tx.user_name || tx.user_id}</strong> ·
                        Mode : <strong>{tx.method}</strong>
                      </p>

                      {tx.reference && (
                        <p className="font-mono text-[11px]">
                          Réf. Transaction : <strong>{tx.reference}</strong>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {tx.proof_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewProofUrl(tx.proof_url!)}
                          className="text-xs"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> Reçu
                        </Button>
                      )}

                      {tx.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApproveTx(tx)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approuver (+$
                            {tx.amount_usd})
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRejectTx(tx)}
                            className="text-destructive text-xs"
                          >
                            Rejeter
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Proof Preview Modal */}
          {previewProofUrl && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="relative max-w-lg w-full bg-card p-4 rounded-2xl border shadow-2xl">
                <button
                  onClick={() => setPreviewProofUrl(null)}
                  className="absolute top-3 right-3 p-1 rounded-full bg-muted"
                >
                  <XCircle className="h-5 w-5" />
                </button>
                <h4 className="font-bold text-sm mb-3">Preuve de versement client</h4>
                <img
                  src={previewProofUrl}
                  alt="Reçu"
                  className="w-full max-h-[70vh] object-contain rounded-xl"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 4: ORDERS MANAGEMENT */}
      {/* ================================================================= */}
      {tab === "orders" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-forest">Commandes clients reçues</h3>
            <p className="text-xs text-muted-foreground">
              Mettez à jour le statut en temps réel pour informer le client à chaque étape.
            </p>
          </div>

          <div className="divide-y rounded-2xl border bg-card overflow-hidden">
            {adminOrdersQuery.data?.map((ord) => (
              <div
                key={ord.id}
                className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {ord.order_number}
                    </span>
                    <span className="font-bold text-forest">{ord.product_title}</span>
                    <span className="text-muted-foreground">({ord.total_usd} USD)</span>
                  </div>
                  <p className="text-muted-foreground">
                    Client : <strong>{ord.customer_name}</strong> ({ord.customer_phone}) ·{" "}
                    {ord.delivery_address}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Mode : <span className="capitalize font-semibold">{ord.payment_method}</span>{" "}
                    {ord.payment_reference ? `(Réf : ${ord.payment_reference})` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={ord.status}
                    onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)}
                    className="h-8 rounded-lg border text-xs px-2 bg-background font-semibold"
                  >
                    <option value="en_attente">En attente de validation</option>
                    <option value="payee">Payée / Validée</option>
                    <option value="preparation">En préparation</option>
                    <option value="expediee">Expédiée vers Haïti</option>
                    <option value="livree">Livrée</option>
                    <option value="annulee">Annulée</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 3: ACHATS ASSISTÉS (DEMANDES "ACHETEZ POUR MOI") */}
      {/* ================================================================= */}
      {tab === "achats" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-forest">
                Demandes d'achats assistés (« Achetez pour moi »)
              </h3>
              <p className="text-xs text-muted-foreground">
                Consultez les articles demandés par les clients sur Amazon, Shein, eBay ou autres.
                Modifiez le prix exact, ajoutez ou ajustez des frais d'achat optionnels et validez
                les dossiers.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-accent/20 text-accent-foreground">
              {adminAchatsQuery.data?.length || 0} demande(s) au total
            </span>
          </div>

          <div className="divide-y rounded-2xl border bg-card overflow-hidden shadow-xs">
            {adminAchatsQuery.data?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs">
                Aucune demande d'achat assisté pour le moment.
              </div>
            ) : (
              adminAchatsQuery.data?.map((ach) => (
                <div
                  key={ach.id}
                  className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 text-xs hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {ach.image_base64 || ach.product_image_url ? (
                      <img
                        src={ach.image_base64 || ach.product_image_url}
                        alt={ach.store_name}
                        className="w-16 h-16 rounded-xl object-cover border flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-forest/10 text-forest flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {ach.store_name ? ach.store_name.slice(0, 4) : "ACH"}
                      </div>
                    )}

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {ach.request_number}
                        </span>
                        <span className="font-bold text-forest text-sm">
                          {ach.store_name || "Boutique externe"}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-muted border">
                          {ach.status}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ach.payment_status === "paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {ach.payment_status === "paid"
                            ? "Payé par Wallet"
                            : "En attente vérification"}
                        </span>
                        {ach.deduct_from_wallet_after_verification && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            Déduction solde souhaitée
                          </span>
                        )}
                      </div>

                      <p className="text-foreground font-medium line-clamp-2 max-w-2xl">
                        {ach.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                        <span>
                          Client : <strong>{ach.customer_name}</strong> ({ach.customer_phone})
                        </span>
                        {ach.delivery_city && (
                          <span className="text-forest font-semibold">
                            • Ville : {ach.delivery_city}
                          </span>
                        )}
                        {ach.delivery_address && <span>• Adresse : {ach.delivery_address}</span>}
                        <span>• Prix client : ${Number(ach.exact_price_usd || 0).toFixed(2)}</span>
                        <span>• Frais : ${Number(ach.fee_usd || 0).toFixed(2)}</span>
                        {ach.tax_usd ? (
                          <span className="text-amber-700 font-bold">
                            • Taxe admin : ${Number(ach.tax_usd || 0).toFixed(2)}
                          </span>
                        ) : null}
                        <span>
                          • Total : <strong>${Number(ach.total_usd || 0).toFixed(2)} USD</strong> (
                          {ach.total_htg || 0} HTG)
                        </span>
                        {ach.product_link && (
                          <a
                            href={ach.product_link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline flex items-center gap-1 font-semibold ml-1"
                          >
                            Lien produit <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>

                      {ach.admin_notes && (
                        <p className="text-[11px] text-muted-foreground bg-muted p-2 rounded-lg border">
                          <strong className="text-foreground">Note interne :</strong>{" "}
                          {ach.admin_notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-end lg:self-center">
                    {ach.status === "en_attente_validation" && (
                      <Button
                        size="sm"
                        variant="sun"
                        onClick={() => handleQuickApproveAchat(ach)}
                        className="text-xs font-bold"
                        title="Vérifier et déduire du solde portefeuille si disponible"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" /> Vérifier & Valider
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStartEditAchat(ach)}
                      className="text-xs font-semibold"
                    >
                      <Edit3 className="h-3.5 w-3.5 mr-1" /> Taxe & Frais
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteAchat(ach.id)}
                      className="text-destructive text-xs hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Edit Achat Modal */}
          {editingAchat && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="relative max-w-lg w-full bg-card p-6 rounded-3xl border shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h4 className="font-bold text-base text-forest">
                      Vérifier & Modifier la demande {editingAchat.request_number}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Client : {editingAchat.customer_name} ({editingAchat.customer_phone}) ·{" "}
                      {editingAchat.delivery_city || "Haïti"}
                    </p>
                  </div>
                  <button
                    onClick={() => setEditingAchat(null)}
                    className="p-1 rounded-full text-muted-foreground hover:bg-muted"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveAchatEdit} className="space-y-4 text-xs">
                  {/* Photo preview if present */}
                  {(editingAchat.image_base64 || editingAchat.product_image_url) && (
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-secondary border">
                      <img
                        src={editingAchat.image_base64 || editingAchat.product_image_url}
                        alt="Photo article"
                        className="h-16 w-16 rounded-lg object-cover border"
                      />
                      <div className="text-[11px] text-muted-foreground">
                        <span className="font-bold text-foreground block">
                          Image fournie par le client
                        </span>
                        {editingAchat.store_name} · {editingAchat.description}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Prix article (USD)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editAchatPrice}
                        onChange={(e) => setEditAchatPrice(e.target.value)}
                        required
                        className="font-bold text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Taxe admin (USD)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editAchatTax}
                        onChange={(e) => setEditAchatTax(e.target.value)}
                        placeholder="0.00"
                        className="font-bold text-sm text-accent"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Frais d'achat (USD)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editAchatFee}
                        onChange={(e) => setEditAchatFee(e.target.value)}
                        required
                        className="font-bold text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Statut de la demande</Label>
                    <select
                      value={editAchatStatus}
                      onChange={(e) => setEditAchatStatus(e.target.value as AssistedPurchaseStatus)}
                      className="w-full h-9 rounded-xl border text-xs px-2.5 bg-background font-semibold"
                    >
                      <option value="en_attente_validation">En attente de validation admin</option>
                      <option value="validee">Validée (Vérifiée par admin)</option>
                      <option value="payee">Payée / Déduite du solde</option>
                      <option value="en_cours_achat">En cours d'achat par l'équipe</option>
                      <option value="recu_entrepot">Reçu à l'entrepôt international</option>
                      <option value="expedie">Expédié vers Haïti</option>
                      <option value="disponible">Disponible pour retrait / livraison</option>
                      <option value="annulee">Annulée</option>
                    </select>
                  </div>

                  {/* Solde portefeuille deduction checkbox */}
                  <div className="p-3 rounded-xl bg-secondary/80 border space-y-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-forest">
                      <input
                        type="checkbox"
                        checked={deductFromWalletOption}
                        onChange={(e) => setDeductFromWalletOption(e.target.checked)}
                        className="rounded text-primary h-4 w-4"
                      />
                      <span>
                        Déduire automatiquement du solde portefeuille du client si statut validé
                      </span>
                    </label>
                    <p className="text-[11px] text-muted-foreground pl-6">
                      Solde actuel du client :{" "}
                      <strong>
                        {Number(clientStore.getWalletBalance(editingAchat.user_id || "anon") || 0).toFixed(2)} USD
                      </strong>
                      . Si suffisant, le paiement est validé immédiatement.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">
                      Instructions & Notes pour le client
                    </Label>
                    <Textarea
                      value={editAchatNotes}
                      onChange={(e) => setEditAchatNotes(e.target.value)}
                      placeholder="Ex: Produit vérifié sur Amazon, taxe appliquée, commande passée..."
                      rows={3}
                      className="text-xs"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingAchat(null)}
                      size="sm"
                    >
                      Annuler
                    </Button>
                    <Button type="submit" size="sm" className="bg-forest text-white font-bold">
                      Enregistrer & Valider
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
