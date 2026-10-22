import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/lib/settings";
import { clientStore } from "@/lib/store";
import type { ProductItem, ProductVariant } from "@/lib/types-store";
import {
  openInvoice,
  generateInvoiceWhatsAppText,
  invoiceTotals,
  INVOICE_TEMPLATES,
  type InvoiceData,
  type InvoiceLine,
  type InvoiceBrand,
  type InvoiceTemplate,
  type InvoiceStatus,
} from "@/lib/invoice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Printer,
  Share2,
  Plus,
  Trash2,
  Search,
  ShoppingCart,
  User,
  Package,
  Layers,
  CheckCircle2,
  RefreshCw,
  DollarSign,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Truck,
  Store,
  Building2,
  ChevronRight,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

interface ClientProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  client_code: string | null;
}

export function AdminPosInvoicing() {
  const settings = useSettings() as any;
  const usdRate = Number(settings?.usd_to_htg || 132);
  const defaultRatePerLb = Number(settings?.shipping_rate_per_lb || 4.5);

  // 1. Invoice Header Configuration
  const [invoiceNumber, setInvoiceNumber] = useState<string>(() => {
    const d = new Date();
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    const rnd = Math.floor(1000 + Math.random() * 9000);
    return `INV-${ymd}-${rnd}`;
  });
  const [invoiceDate, setInvoiceDate] = useState<string>(
    () => new Date().toISOString().split("T")[0] ?? "",
  );
  const [brand, setBrand] = useState<InvoiceBrand>("shipping");
  const [template, setTemplate] = useState<InvoiceTemplate>("global-express");
  const [accentColor, setAccentColor] = useState<string>("#1e293b");

  // 2. Client selection (Registered or Walk-in Counter)
  const [clientType, setClientType] = useState<"registered" | "walkin">("walkin");
  const [clientSearch, setClientSearch] = useState<string>("");
  const [clientName, setClientName] = useState<string>("");
  const [clientPhone, setClientPhone] = useState<string>("");
  const [clientEmail, setClientEmail] = useState<string>("");
  const [clientCode, setClientCode] = useState<string>("");
  const [clientAddress, setClientAddress] = useState<string>("");
  const [clientCity, setClientCity] = useState<string>("Port-au-Prince");

  // 3. Shipping / Freight Details (for global-express / freight invoices)
  const [packageCount, setPackageCount] = useState<number>(1);
  const [totalWeightLbs, setTotalWeightLbs] = useState<number>(0);
  const [ratePerLb, setRatePerLb] = useState<number>(defaultRatePerLb);

  // 4. Cart Lines
  const [lines, setLines] = useState<InvoiceLine[]>([]);

  // 5. Manual Line Builder
  const [manualLabel, setManualLabel] = useState<string>("");
  const [manualTracking, setManualTracking] = useState<string>("");
  const [manualWeight, setManualWeight] = useState<string>("");
  const [manualCustoms, setManualCustoms] = useState<string>("");
  const [manualQty, setManualQty] = useState<number>(1);
  const [manualPrice, setManualPrice] = useState<string>("");

  // 5b. Multi-colis consolidated helper (several tracking numbers & weights on 1 invoice)
  const [multiColisOpen, setMultiColisOpen] = useState<boolean>(false);
  const [posMultiItems, setPosMultiItems] = useState<
    Array<{
      id: string;
      tracking: string;
      merchant: string;
      description: string;
      weight: string;
      fee: string;
    }>
  >([
    { id: "1", tracking: "", merchant: "Amazon", description: "Colis 1", weight: "", fee: "" },
    { id: "2", tracking: "", merchant: "Shein", description: "Colis 2", weight: "", fee: "" },
  ]);

  // 6. Financial adjustments
  const [serviceFee, setServiceFee] = useState<string>("");
  const [customsTotal, setCustomsTotal] = useState<string>("");
  const [discount, setDiscount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("Espèces USD");
  const [paidAmount, setPaidAmount] = useState<string>("");
  const [warningText, setWarningText] = useState<string>(
    "Veuillez vérifier votre colis avant de partir. Aucun retour ne sera accepté après votre départ.",
  );
  const [invoiceNote, setInvoiceNote] = useState<string>(
    "Facture officielle acquittée / borderau de retrait délivré par Prime Entreprise.",
  );

  // 7. Inventory Search
  const [inventorySearch, setInventorySearch] = useState<string>("");
  const [inventoryCategory, setInventoryCategory] = useState<string>("all");
  const [selectedVariantByProduct, setSelectedVariantByProduct] = useState<Record<string, string>>(
    {},
  );

  // Fetch registered clients
  const { data: registeredClients = [] } = useQuery<ClientProfile[]>({
    queryKey: ["pos-admin-clients"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, email, phone, client_code")
          .order("created_at", { ascending: false });
        if (!error && data) return data;
      } catch {
        // fallback
      }
      return [];
    },
  });

  // Fetch store products for POS inventory
  const { data: storeProducts = [], refetch: refetchProducts } = useQuery<ProductItem[]>({
    queryKey: ["pos-admin-products"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && data && data.length > 0) return data as unknown as ProductItem[];
      } catch {
        // fallback
      }
      return clientStore.getProducts();
    },
  });

  // Filtered clients
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return registeredClients.slice(0, 8);
    const q = clientSearch.toLowerCase();
    return registeredClients
      .filter((c) =>
        `${c.full_name || ""} ${c.email || ""} ${c.client_code || ""} ${c.phone || ""}`
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 10);
  }, [registeredClients, clientSearch]);

  // Filtered inventory products
  const filteredProducts = useMemo(() => {
    return storeProducts.filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(inventorySearch.toLowerCase())) ||
        (p.sku && p.sku.toLowerCase().includes(inventorySearch.toLowerCase()));
      const matchCat = inventoryCategory === "all" || p.category === inventoryCategory;
      return matchSearch && matchCat;
    });
  }, [storeProducts, inventorySearch, inventoryCategory]);

  const categories = useMemo(() => {
    return ["all", ...Array.from(new Set(storeProducts.map((p) => p.category).filter(Boolean)))];
  }, [storeProducts]);

  // Handle client selection from search
  const handleSelectClient = (c: ClientProfile) => {
    setClientName(c.full_name || "");
    setClientPhone(c.phone || "");
    setClientEmail(c.email || "");
    setClientCode(c.client_code || "");
    setClientSearch("");
    toast.success(`Client ${c.full_name || c.client_code} sélectionné !`);
  };

  // Add product from inventory to cart
  const handleAddProductToCart = (prod: ProductItem) => {
    const selectedVarId = selectedVariantByProduct[prod.id];
    const variant: ProductVariant | undefined = prod.variants?.find((v) => v.id === selectedVarId);

    const price = variant
      ? (variant.promo_price_usd ?? variant.price_usd)
      : (prod.promo_price_usd ?? prod.price_usd);

    const label = variant ? `${prod.title} — ${variant.name}` : prod.title;

    setLines((prev) => {
      // Check if already in cart
      const existingIdx = prev.findIndex(
        (l) => l.product_id === prod.id && (!variant || l.variant_id === variant.id),
      );

      if (existingIdx >= 0) {
        const copy = [...prev];
        const cur = copy[existingIdx]!;
        const newQty = (cur.qty || 1) + 1;
        copy[existingIdx] = {
          ...cur,
          qty: newQty,
          total: Number((newQty * (cur.unit || price)).toFixed(2)),
        };
        return copy;
      }

      const newLine: InvoiceLine = {
        num: prev.length + 1,
        product_id: prod.id,
        variant_id: variant?.id,
        tracking_or_sku: prod.sku || variant?.id || prod.id.slice(0, 8),
        label,
        qty: 1,
        unit: Number(price.toFixed(2)),
        total: Number(price.toFixed(2)),
        image_url: variant?.image_url || prod.media_urls?.[0],
      };
      return [...prev, newLine];
    });

    toast.success(`${label} ajouté au panier`);
  };

  // Add manual line
  const handleAddManualLine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualLabel.trim()) {
      toast.error("Veuillez saisir un libellé ou service.");
      return;
    }
    const unit = parseFloat(manualPrice) || 0;
    const qty = Math.max(1, manualQty);
    const weight = manualWeight ? parseFloat(manualWeight) : undefined;
    const customs = manualCustoms ? parseFloat(manualCustoms) : undefined;
    const total = Number((unit * qty + (customs || 0)).toFixed(2));

    const newLine: InvoiceLine = {
      num: lines.length + 1,
      label: manualLabel.trim(),
      tracking_or_sku: manualTracking.trim() || undefined,
      weight_lbs: weight,
      customs_fee_usd: customs,
      qty,
      unit,
      total,
    };

    setLines((prev) => [...prev, newLine]);
    setManualLabel("");
    setManualTracking("");
    setManualWeight("");
    setManualCustoms("");
    setManualPrice("");
    setManualQty(1);
    toast.success("Ligne de service ajoutée !");
  };

  // Add auto freight line calculated from totalWeightLbs and ratePerLb
  const handleAddAutoFreightLine = () => {
    if (totalWeightLbs <= 0) {
      toast.error("Veuillez indiquer un poids total en lbs supérieur à 0.");
      return;
    }
    const freightTotal = Number((totalWeightLbs * ratePerLb).toFixed(2));
    const newLine: InvoiceLine = {
      num: lines.length + 1,
      label: `Fret aérien international (${totalWeightLbs} lbs @ $${ratePerLb.toFixed(2)}/lb)`,
      tracking_or_sku: `FRET-${Date.now().toString().slice(-6)}`,
      weight_lbs: totalWeightLbs,
      qty: 1,
      unit: freightTotal,
      total: freightTotal,
    };
    setLines((prev) => [...prev, newLine]);
    toast.success(`Fret aérien ($${freightTotal.toFixed(2)} USD) ajouté à la facture !`);
  };

  // Add multi-colis consolidated items to invoice
  const handleAddPosMultiColis = () => {
    const valid = posMultiItems.filter(
      (it) => it.tracking.trim() || parseFloat(it.weight) > 0 || it.description.trim(),
    );
    if (valid.length === 0) {
      toast.error("Veuillez renseigner au moins un colis avec son numéro ou son poids.");
      return;
    }
    const currentRate = ratePerLb || defaultRatePerLb;
    let addedWeight = 0;
    const newLines: InvoiceLine[] = valid.map((it, idx) => {
      const w = parseFloat(it.weight) || 0;
      addedWeight += w;
      const total = parseFloat(it.fee) || (w > 0 ? Number((w * currentRate).toFixed(2)) : 0);
      return {
        num: lines.length + idx + 1,
        label: `${it.merchant ? it.merchant + " — " : ""}${it.description || "Colis"}`,
        tracking_or_sku: it.tracking.trim() || undefined,
        weight_lbs: w > 0 ? w : undefined,
        unit: currentRate,
        qty: 1,
        total,
      };
    });

    setLines((prev) => [...prev, ...newLines]);
    setTotalWeightLbs((prev) => Number((prev + addedWeight).toFixed(2)));
    setPackageCount((prev) => prev + valid.length);
    toast.success(`${valid.length} colis réunis ajoutés sur cette facture !`);
    setMultiColisOpen(false);
  };

  // Update line quantity
  const handleUpdateLineQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveLine(index);
      return;
    }
    setLines((prev) => {
      const copy = [...prev];
      const cur = copy[index]!;
      const unit = cur.unit || 0;
      const customs = cur.customs_fee_usd || 0;
      copy[index] = {
        ...cur,
        qty: newQty,
        total: Number((unit * newQty + customs).toFixed(2)),
      };
      return copy;
    });
  };

  // Remove line
  const handleRemoveLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index).map((l, i) => ({ ...l, num: i + 1 })));
  };

  // Clear all
  const handleClearAll = () => {
    setLines([]);
    setPaidAmount("");
    toast.info("Panier réinitialisé.");
  };

  // Regenerate invoice number
  const handleRegenerateNumber = () => {
    const d = new Date();
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    const rnd = Math.floor(1000 + Math.random() * 9000);
    setInvoiceNumber(`INV-${ymd}-${rnd}`);
    toast.success("Nouveau numéro de facture généré.");
  };

  // Build InvoiceData object
  const currentInvoiceData: InvoiceData = useMemo(() => {
    const subtotal = lines.reduce((acc, l) => acc + (Number(l.total) || 0), 0);
    const serviceFeeNum = parseFloat(serviceFee) || 0;
    const customsNum = parseFloat(customsTotal) || 0;
    const discountNum = parseFloat(discount) || 0;
    const paidNum = parseFloat(paidAmount) || 0;
    const total = Math.max(0, subtotal + serviceFeeNum + customsNum - discountNum);

    let status: InvoiceStatus = "non_payee";
    if (paidNum >= total && total > 0) status = "payee";
    else if (paidNum > 0) status = "partielle";

    return {
      brand,
      template,
      number: invoiceNumber,
      date: invoiceDate,
      status,
      accentColor,
      rate: usdRate,
      client: {
        name: clientName || "Client comptoir",
        code: clientCode || undefined,
        email: clientEmail || undefined,
        phone: clientPhone || undefined,
        address: clientAddress || undefined,
        city: clientCity || "Port-au-Prince",
      },
      shipping_details: {
        package_count: packageCount || lines.length || 1,
        total_weight_lbs: totalWeightLbs || undefined,
        rate_per_lb: ratePerLb || defaultRatePerLb,
        destination: clientCity || "Port-au-Prince",
      },
      lines,
      subtotal_usd: subtotal,
      service_fee_usd: serviceFeeNum,
      customs_total_usd: customsNum,
      discount_usd: discountNum,
      paid: paidNum,
      warning_box_text: warningText,
      note: invoiceNote,
      payment_history:
        paidNum > 0
          ? [
              {
                date: invoiceDate,
                method: paymentMethod,
                amount_usd: paidNum,
                amount_htg: Math.round(paidNum * usdRate),
                reference: `CAISSE-${Date.now().toString().slice(-5)}`,
              },
            ]
          : [],
      company: {
        name:
          brand === "shipping"
            ? "Prime Express Shipping"
            : brand === "store"
              ? "Prime Store"
              : "Prime Entreprise",
        phone: settings?.company_phone || "+509 3700-1122",
        whatsapp: settings?.company_whatsapp || "+509 3700-1122",
        email: settings?.company_email || "contact@prime-entreprise.com",
        address: settings?.company_address || "Boulevard du 15 Octobre, Tabarre, Port-au-Prince",
        city: "Port-au-Prince, Haïti",
        footer: "Prime Entreprise • Registre de Commerce & DGI • Récépissé certifié",
        bank_accounts: "Unibank / Sogebank : PRIME HOLDING HAÏTI S.A.",
      },
    };
  }, [
    brand,
    template,
    invoiceNumber,
    invoiceDate,
    accentColor,
    usdRate,
    clientName,
    clientCode,
    clientEmail,
    clientPhone,
    clientAddress,
    clientCity,
    packageCount,
    totalWeightLbs,
    ratePerLb,
    defaultRatePerLb,
    lines,
    serviceFee,
    customsTotal,
    discount,
    paidAmount,
    warningText,
    invoiceNote,
    paymentMethod,
    settings,
  ]);

  const totals = useMemo(() => invoiceTotals(currentInvoiceData), [currentInvoiceData]);

  // Action 1: Print / Open PDF
  const handlePrint = () => {
    if (lines.length === 0) {
      toast.error("Veuillez ajouter au moins un article ou un service avant d'imprimer.");
      return;
    }
    openInvoice(currentInvoiceData);
  };

  // Action 2: Share via WhatsApp
  const handleWhatsApp = () => {
    if (lines.length === 0) {
      toast.error("Veuillez ajouter au moins un article avant d'envoyer.");
      return;
    }
    const text = generateInvoiceWhatsAppText(currentInvoiceData);
    const cleanPhone = (clientPhone || "").replace(/[^0-9]/g, "");
    const targetUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(targetUrl, "_blank");
  };

  // Action 3: Finalize Sale & Decrement Inventory Stock
  const handleValidateSale = async () => {
    if (lines.length === 0) {
      toast.error("Le panier est vide. Ajoutez des articles avant de valider la vente.");
      return;
    }

    let decrementedCount = 0;

    // Loop through physical lines and decrement inventory stock
    for (const line of lines) {
      if (line.product_id) {
        const ok = clientStore.decrementStock(line.product_id, line.qty || 1, line.variant_id);
        if (ok) decrementedCount++;
      }
    }

    // Record order in local store
    try {
      clientStore.createOrder({
        order_number: invoiceNumber,
        customer_name: clientName || "Client comptoir",
        customer_phone: clientPhone || "",
        customer_email: clientEmail || "",
        customer_city: clientCity || "Port-au-Prince",
        total_usd: totals.total,
        total_htg: totals.totalHtg,
        subtotal_usd: totals.subtotal,
        service_fee_usd: totals.serviceFee,
        payment_method: paymentMethod.toLowerCase() as any,
        status: totals.balance <= 0 ? "payee" : "en_attente",
        admin_notes: `Vente effectuée au comptoir POS (${paymentMethod}). Encaissé: $${totals.paid} USD. Solde: $${totals.balance} USD.`,
      });
    } catch {
      // order record fallback
    }

    refetchProducts();

    toast.success(
      `Vente enregistrée avec succès ! (${decrementedCount} article(s) décrémenté(s) du stock)`,
      {
        description: `Facture ${invoiceNumber} • Total: $${totals.total.toFixed(2)} USD`,
        action: {
          label: "Imprimer la facture",
          onClick: () => openInvoice(currentInvoiceData),
        },
      },
    );

    // Optionally reset for next sale
    handleRegenerateNumber();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Quick Header */}
      <div className="rounded-3xl border bg-gradient-to-br from-card via-card to-secondary/30 p-5 shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest text-forest-foreground font-black text-sm shadow-sm">
                POS
              </span>
              <div>
                <h2 className="text-lg font-black text-forest">
                  Caisse & Facturation Multi-Styles
                </h2>
                <p className="text-xs text-muted-foreground">
                  Enregistrement express au comptoir • Synchronisation de stock • Émission de
                  factures imprimables
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border text-xs font-semibold">
              <span className="text-muted-foreground">Taux du jour:</span>
              <span className="font-bold text-forest">1 USD = {usdRate} HTG</span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="rounded-xl text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Nouveau ticket
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="rounded-xl text-xs bg-background hover:bg-secondary font-bold"
            >
              <Printer className="h-3.5 w-3.5 mr-1 text-primary" />
              Imprimer / PDF
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleValidateSale}
              className="rounded-xl text-xs bg-forest text-forest-foreground hover:bg-forest/90 font-black shadow-sm"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-primary" />
              Valider la vente
            </Button>
          </div>
        </div>

        {/* Invoice controls row: Number, Date, Brand, Template */}
        <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <Label className="text-[11px] font-semibold text-muted-foreground">N° Facture</Label>
            <div className="flex items-center gap-1 mt-1">
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="h-8 font-mono text-xs rounded-xl font-bold bg-background"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleRegenerateNumber}
                title="Générer un nouveau numéro"
                className="h-8 w-8 rounded-xl shrink-0"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-[11px] font-semibold text-muted-foreground">
              Date d'émission
            </Label>
            <Input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="h-8 text-xs rounded-xl mt-1 bg-background"
            />
          </div>

          <div>
            <Label className="text-[11px] font-semibold text-muted-foreground">
              Marque Émettrice
            </Label>
            <div className="grid grid-cols-3 gap-1 mt-1">
              {[
                { id: "shipping", label: "Shipping", icon: Truck },
                { id: "store", label: "Store", icon: Store },
                { id: "entreprise", label: "Groupe", icon: Building2 },
              ].map((b) => {
                const Icon = b.icon;
                const active = brand === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBrand(b.id as InvoiceBrand)}
                    className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl border text-[11px] font-bold transition-all ${
                      active
                        ? "bg-forest text-forest-foreground border-forest shadow-xs"
                        : "bg-background hover:bg-secondary text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {b.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="text-[11px] font-semibold text-muted-foreground">
              Modèle de Facture
            </Label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value as InvoiceTemplate)}
              className="w-full h-8 px-2 mt-1 rounded-xl border text-xs font-bold bg-background text-foreground"
            >
              {INVOICE_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column (7 cols) : Customer + Inventory + Manual Line Builder + Items list */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section A: Customer Details */}
          <div className="rounded-3xl border bg-card p-5 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-forest flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Informations Client (Comptoir ou Enregistré)
              </h3>
              <div className="flex items-center gap-1 p-0.5 rounded-xl bg-secondary/70 border text-[11px]">
                <button
                  type="button"
                  onClick={() => setClientType("walkin")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    clientType === "walkin"
                      ? "bg-background shadow-xs text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  Client comptoir
                </button>
                <button
                  type="button"
                  onClick={() => setClientType("registered")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    clientType === "registered"
                      ? "bg-background shadow-xs text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  Client inscrit
                </button>
              </div>
            </div>

            {/* Registered client search */}
            {clientType === "registered" && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom, email, téléphone ou code PS-XXXX..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="pl-8 h-9 text-xs rounded-xl bg-background"
                  />
                </div>
                {filteredClients.length > 0 && (
                  <div className="max-h-40 overflow-y-auto rounded-xl border bg-background divide-y text-xs">
                    {filteredClients.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectClient(c)}
                        className="w-full text-left px-3 py-2 hover:bg-secondary/60 flex items-center justify-between transition-colors"
                      >
                        <div>
                          <p className="font-bold text-foreground">
                            {c.full_name || "Sans nom"}{" "}
                            {c.client_code && (
                              <span className="ml-1 px-1.5 py-0.5 rounded-md bg-forest/10 text-forest font-mono text-[10px]">
                                {c.client_code}
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {c.phone || "Pas de téléphone"} • {c.email || "Pas d'email"}
                          </p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quick Client Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <Label className="text-[11px]">Nom complet / Raison sociale</Label>
                <Input
                  placeholder="Ex : Jean-Claude Moïse"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="h-8 text-xs rounded-xl mt-1 bg-background font-semibold"
                />
              </div>

              <div>
                <Label className="text-[11px]">Téléphone / WhatsApp (pour envoi reçu)</Label>
                <Input
                  placeholder="+509 3700-0000"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="h-8 text-xs rounded-xl mt-1 bg-background"
                />
              </div>

              <div>
                <Label className="text-[11px]">Code client (Optionnel, ex: PS-0024)</Label>
                <Input
                  placeholder="PS-XXXX"
                  value={clientCode}
                  onChange={(e) => setClientCode(e.target.value.toUpperCase())}
                  className="h-8 font-mono text-xs rounded-xl mt-1 bg-background"
                />
              </div>

              <div>
                <Label className="text-[11px]">Email</Label>
                <Input
                  type="email"
                  placeholder="client@domaine.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="h-8 text-xs rounded-xl mt-1 bg-background"
                />
              </div>

              <div className="sm:col-span-2">
                <Label className="text-[11px]">Adresse / Ville de livraison</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                  <Input
                    placeholder="Adresse de rue ou quartier"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    className="h-8 text-xs rounded-xl sm:col-span-2 bg-background"
                  />
                  <Input
                    placeholder="Ville (ex: Delmas, Pétion-Ville)"
                    value={clientCity}
                    onChange={(e) => setClientCity(e.target.value)}
                    className="h-8 text-xs rounded-xl bg-background"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section B: Shipping & Freight specifics (if shipping brand or fret line) */}
          <div className="rounded-3xl border bg-card p-5 shadow-soft space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-forest flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                Détails de Fret / Expédition Colis
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddAutoFreightLine}
                className="h-7 text-xs rounded-xl font-bold bg-secondary/50 hover:bg-secondary text-forest"
              >
                <Sparkles className="h-3 w-3 mr-1 text-primary" />
                Calculer & Ajouter le fret ($/lb)
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <Label className="text-[11px]">Poids total (lbs)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ex : 4.5"
                  value={totalWeightLbs || ""}
                  onChange={(e) => setTotalWeightLbs(parseFloat(e.target.value) || 0)}
                  className="h-8 text-xs rounded-xl mt-1 bg-background font-bold"
                />
              </div>
              <div>
                <Label className="text-[11px]">Tarif au lb ($/lb)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={ratePerLb || ""}
                  onChange={(e) => setRatePerLb(parseFloat(e.target.value) || 0)}
                  className="h-8 text-xs rounded-xl mt-1 bg-background font-bold"
                />
              </div>
              <div>
                <Label className="text-[11px]">Nombre de colis</Label>
                <Input
                  type="number"
                  value={packageCount || 1}
                  onChange={(e) => setPackageCount(parseInt(e.target.value) || 1)}
                  className="h-8 text-xs rounded-xl mt-1 bg-background"
                />
              </div>
            </div>

            {/* Multi-colis Groupé Quick Tool in POS */}
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    Ajout de Colis Multi-tracking & Multi-poids
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Insérez plusieurs numéros de colis et poids réunis dans cette seule facture.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setMultiColisOpen(!multiColisOpen)}
                  className="h-7 text-xs rounded-lg font-semibold"
                >
                  {multiColisOpen ? "Fermer" : "+ Ouvrir l'outil Multi-Colis"}
                </Button>
              </div>

              {multiColisOpen && (
                <div className="mt-3 p-3.5 rounded-lg border border-border bg-muted/40 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">
                      Colis à réunir sur cette facture ({posMultiItems.length})
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPosMultiItems((prev) => [
                          ...prev,
                          {
                            id: String(Date.now()),
                            tracking: "",
                            merchant: "Amazon",
                            description: `Colis ${prev.length + 1}`,
                            weight: "",
                            fee: "",
                          },
                        ])
                      }
                      className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> + Ajouter une ligne
                    </button>
                  </div>

                  <div className="space-y-2">
                    {posMultiItems.map((item, idx) => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 items-center text-xs">
                        <span className="col-span-1 text-center font-bold text-muted-foreground">
                          #{idx + 1}
                        </span>
                        <div className="col-span-4">
                          <Input
                            placeholder="N° de suivi (TBA..., 1Z...)"
                            value={item.tracking}
                            onChange={(e) =>
                              setPosMultiItems((prev) =>
                                prev.map((it) =>
                                  it.id === item.id ? { ...it, tracking: e.target.value } : it,
                                ),
                              )
                            }
                            className="h-7 text-xs font-mono rounded-md bg-background"
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            placeholder="Marchand / Contenu"
                            value={item.description}
                            onChange={(e) =>
                              setPosMultiItems((prev) =>
                                prev.map((it) =>
                                  it.id === item.id ? { ...it, description: e.target.value } : it,
                                ),
                              )
                            }
                            className="h-7 text-xs rounded-md bg-background"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Poids (lb)"
                            value={item.weight}
                            onChange={(e) => {
                              const w = parseFloat(e.target.value);
                              const rate = ratePerLb || defaultRatePerLb;
                              setPosMultiItems((prev) =>
                                prev.map((it) =>
                                  it.id === item.id
                                    ? {
                                        ...it,
                                        weight: e.target.value,
                                        fee: !isNaN(w) && w > 0 ? (w * rate).toFixed(2) : it.fee,
                                      }
                                    : it,
                                ),
                              );
                            }}
                            className="h-7 text-xs rounded-md font-bold bg-background"
                          />
                        </div>
                        <div className="col-span-2 flex items-center gap-1">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Frais $"
                            value={item.fee}
                            onChange={(e) =>
                              setPosMultiItems((prev) =>
                                prev.map((it) =>
                                  it.id === item.id ? { ...it, fee: e.target.value } : it,
                                ),
                              )
                            }
                            className="h-7 text-xs rounded-md bg-background"
                          />
                          {posMultiItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setPosMultiItems((prev) => prev.filter((it) => it.id !== item.id))
                              }
                              className="text-muted-foreground hover:text-destructive p-1"
                              title="Supprimer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddPosMultiColis}
                      className="h-8 text-xs font-bold rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      Insérer ces {posMultiItems.length} colis dans la facture
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section C: Boutique Inventory Catalogue */}
          <div className="rounded-3xl border bg-card p-5 shadow-soft space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-forest flex items-center gap-2">
                <Store className="h-4 w-4 text-primary" />
                Inventaire Boutique & Produits en Stock
              </h3>
              <span className="text-[11px] text-muted-foreground">
                Cliquez sur <b>+</b> pour ajouter au panier
              </span>
            </div>

            {/* Search & Category Filter */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par titre, référence ou catégorie..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="pl-8 h-8 text-xs rounded-xl bg-background"
                />
              </div>
              <select
                value={inventoryCategory}
                onChange={(e) => setInventoryCategory(e.target.value)}
                className="h-8 px-2.5 rounded-xl border text-xs bg-background text-foreground"
              >
                <option value="all">Toutes les catégories</option>
                {categories
                  .filter((c) => c !== "all")
                  .map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
              </select>
            </div>

            {/* Product items quick grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {filteredProducts.length === 0 ? (
                <div className="col-span-2 py-6 text-center text-xs text-muted-foreground">
                  Aucun article trouvé dans l'inventaire.
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const hasVariants = p.variants && p.variants.length > 0;
                  const currentVarId = selectedVariantByProduct[p.id] || p.variants?.[0]?.id;
                  const currentVar = p.variants?.find((v) => v.id === currentVarId);
                  const price = currentVar
                    ? (currentVar.promo_price_usd ?? currentVar.price_usd)
                    : (p.promo_price_usd ?? p.price_usd);

                  const stockDisplay = currentVar ? currentVar.stock : p.stock;

                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-2.5 p-2.5 rounded-2xl border bg-background hover:border-primary/50 transition-all text-xs"
                    >
                      {p.media_urls?.[0] ? (
                        <img
                          src={p.media_urls[0]}
                          alt={p.title}
                          className="h-12 w-12 rounded-xl object-cover border shrink-0 bg-muted"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground truncate">{p.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-extrabold text-forest">
                            ${price.toFixed(2)} USD
                          </span>
                          {stockDisplay != null && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                stockDisplay > 0
                                  ? "bg-emerald-500/10 text-emerald-700"
                                  : "bg-rose-500/10 text-rose-700"
                              }`}
                            >
                              Stock: {stockDisplay}
                            </span>
                          )}
                        </div>

                        {hasVariants && (
                          <select
                            value={currentVarId}
                            onChange={(e) =>
                              setSelectedVariantByProduct((prev) => ({
                                ...prev,
                                [p.id]: e.target.value,
                              }))
                            }
                            className="mt-1 h-6 w-full text-[10px] px-1 rounded-lg border bg-secondary/50"
                          >
                            {p.variants!.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.name} (${(v.promo_price_usd ?? v.price_usd).toFixed(2)})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <Button
                        type="button"
                        size="icon"
                        onClick={() => handleAddProductToCart(p)}
                        className="h-8 w-8 rounded-xl shrink-0 bg-primary/20 text-forest hover:bg-primary/30"
                        title="Ajouter au panier"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Section D: Add Manual Custom Line (Services, Douanes, Frais) */}
          <form
            onSubmit={handleAddManualLine}
            className="rounded-3xl border bg-card p-5 shadow-soft space-y-3"
          >
            <h3 className="text-sm font-bold text-forest flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Ajouter une Ligne Personnalisée (Service, Douane, Retrait)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
              <div className="sm:col-span-5">
                <Label className="text-[11px]">Libellé / Service</Label>
                <Input
                  placeholder="Ex : Livraison Express Pétion-Ville"
                  value={manualLabel}
                  onChange={(e) => setManualLabel(e.target.value)}
                  className="h-8 text-xs rounded-xl mt-1 bg-background"
                />
              </div>

              <div className="sm:col-span-3">
                <Label className="text-[11px]">N° Suivi / SKU</Label>
                <Input
                  placeholder="Optionnel"
                  value={manualTracking}
                  onChange={(e) => setManualTracking(e.target.value)}
                  className="h-8 font-mono text-xs rounded-xl mt-1 bg-background"
                />
              </div>

              <div className="sm:col-span-2">
                <Label className="text-[11px]">Poids (lbs)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={manualWeight}
                  onChange={(e) => setManualWeight(e.target.value)}
                  className="h-8 text-xs rounded-xl mt-1 bg-background"
                />
              </div>

              <div className="sm:col-span-2">
                <Label className="text-[11px]">Douane ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={manualCustoms}
                  onChange={(e) => setManualCustoms(e.target.value)}
                  className="h-8 text-xs rounded-xl mt-1 bg-background"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="w-24">
                <Label className="text-[11px]">Quantité</Label>
                <Input
                  type="number"
                  min="1"
                  value={manualQty}
                  onChange={(e) => setManualQty(parseInt(e.target.value) || 1)}
                  className="h-8 text-xs rounded-xl mt-1 bg-background"
                />
              </div>

              <div className="w-32">
                <Label className="text-[11px]">Prix Unit. ($ USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={manualPrice}
                  onChange={(e) => setManualPrice(e.target.value)}
                  className="h-8 text-xs rounded-xl mt-1 bg-background font-bold"
                />
              </div>

              <div className="flex-1 flex justify-end items-end pt-5">
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 rounded-xl text-xs bg-forest text-forest-foreground hover:bg-forest/90 font-bold"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Ajouter la ligne
                </Button>
              </div>
            </div>
          </form>

          {/* Section E: Cart Table / Invoice Items */}
          <div className="rounded-3xl border bg-card p-5 shadow-soft space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-forest flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" />
                Articles & Prestations dans la Facture ({lines.length})
              </h3>
              {lines.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Vider la facture
                </Button>
              )}
            </div>

            {lines.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed rounded-2xl text-xs text-muted-foreground">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-40" />
                Aucun article ou service dans la facture pour l'instant.
                <br />
                Ajoutez un produit de la boutique ou saisissez une ligne manuelle ci-dessus.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-secondary/60 text-muted-foreground font-semibold border-b">
                    <tr>
                      <th className="py-2 px-2 w-8">#</th>
                      <th className="py-2 px-2">Description</th>
                      <th className="py-2 px-2 text-right">Poids</th>
                      <th className="py-2 px-2 text-right">Douane</th>
                      <th className="py-2 px-2 text-center">Qté</th>
                      <th className="py-2 px-2 text-right">P.U. ($)</th>
                      <th className="py-2 px-2 text-right">Total ($)</th>
                      <th className="py-2 px-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {lines.map((line, idx) => (
                      <tr key={idx} className="hover:bg-secondary/30 transition-colors">
                        <td className="py-2.5 px-2 font-mono text-[11px] text-muted-foreground">
                          {line.num || idx + 1}
                        </td>
                        <td className="py-2.5 px-2">
                          <p className="font-bold text-foreground">{line.label}</p>
                          {line.tracking_or_sku && (
                            <span className="font-mono text-[10px] text-muted-foreground">
                              Réf: {line.tracking_or_sku}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-right font-medium">
                          {line.weight_lbs != null && line.weight_lbs > 0
                            ? `${line.weight_lbs} lbs`
                            : "—"}
                        </td>
                        <td className="py-2.5 px-2 text-right font-medium">
                          {line.customs_fee_usd != null && line.customs_fee_usd > 0
                            ? `$${line.customs_fee_usd.toFixed(2)}`
                            : "—"}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateLineQty(idx, (line.qty || 1) - 1)}
                              className="h-5 w-5 rounded bg-secondary flex items-center justify-center font-bold text-xs hover:bg-secondary/80"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-bold">{line.qty || 1}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateLineQty(idx, (line.qty || 1) + 1)}
                              className="h-5 w-5 rounded bg-secondary flex items-center justify-center font-bold text-xs hover:bg-secondary/80"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-right font-medium">
                          ${Number(line.unit || 0).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-bold text-forest">
                          ${Number(line.total || 0).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            className="p-1 rounded text-muted-foreground hover:text-rose-600 transition-colors"
                            title="Supprimer la ligne"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right column (5 cols) : Financial Totals, Payment Method, Warning & Immediate Actions */}
        <div className="lg:col-span-5 space-y-6">
          {/* Financial summary card */}
          <div className="rounded-3xl border bg-card p-5 shadow-soft space-y-4">
            <h3 className="text-sm font-bold text-forest flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Règlement & Double Devise (USD / HTG)
            </h3>

            {/* Adjustments: Service fee, Customs, Discount */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <Label className="text-[10px] text-muted-foreground">Frais service ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={serviceFee}
                  onChange={(e) => setServiceFee(e.target.value)}
                  className="h-8 text-xs rounded-xl mt-1 bg-background font-medium"
                />
              </div>

              <div>
                <Label className="text-[10px] text-muted-foreground">Douane ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={customsTotal}
                  onChange={(e) => setCustomsTotal(e.target.value)}
                  className="h-8 text-xs rounded-xl mt-1 bg-background font-medium"
                />
              </div>

              <div>
                <Label className="text-[10px] text-muted-foreground">Remise ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="h-8 text-xs rounded-xl mt-1 bg-background font-medium text-emerald-700"
                />
              </div>
            </div>

            {/* Total display highlight box */}
            <div className="p-4 rounded-2xl bg-forest text-forest-foreground space-y-2">
              <div className="flex items-center justify-between text-xs text-forest-foreground/80">
                <span>Sous-total articles :</span>
                <span className="font-mono">${totals.subtotal.toFixed(2)} USD</span>
              </div>

              {totals.serviceFee > 0 && (
                <div className="flex items-center justify-between text-xs text-forest-foreground/80">
                  <span>Frais de service :</span>
                  <span className="font-mono">+${totals.serviceFee.toFixed(2)} USD</span>
                </div>
              )}

              {totals.customsFee > 0 && (
                <div className="flex items-center justify-between text-xs text-forest-foreground/80">
                  <span>Douane :</span>
                  <span className="font-mono">+${totals.customsFee.toFixed(2)} USD</span>
                </div>
              )}

              {totals.discount > 0 && (
                <div className="flex items-center justify-between text-xs text-emerald-300">
                  <span>Remise accordée :</span>
                  <span className="font-mono">-${totals.discount.toFixed(2)} USD</span>
                </div>
              )}

              <div className="pt-2 border-t border-forest-foreground/20 flex items-baseline justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider font-bold text-forest-foreground/80">
                    Total Facture
                  </p>
                  <p className="text-2xl font-black text-primary tracking-tight">
                    ${totals.total.toFixed(2)}{" "}
                    <span className="text-xs font-bold text-forest-foreground">USD</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-forest-foreground/70">Équivalent en Gourdes :</p>
                  <p className="text-lg font-black text-forest-foreground">
                    ≈ {totals.totalHtg.toLocaleString("fr-FR")} HTG
                  </p>
                </div>
              </div>
            </div>

            {/* Payment method & Paid amount */}
            <div className="space-y-3 pt-1 text-xs">
              <div>
                <Label className="text-[11px] font-semibold">Mode d'encaissement</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-1">
                  {["Espèces USD", "Espèces HTG", "MonCash", "Natcash", "Virement", "Carte"].map(
                    (m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className={`py-1.5 px-2 rounded-xl border text-[11px] font-bold text-center transition-all ${
                          paymentMethod === m
                            ? "bg-forest text-forest-foreground border-forest shadow-xs"
                            : "bg-background hover:bg-secondary text-muted-foreground"
                        }`}
                      >
                        {m}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[11px] font-semibold">Montant perçu ($ USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="h-9 text-xs rounded-xl mt-1 bg-background font-bold text-forest"
                  />
                  <div className="flex gap-1 mt-1">
                    <button
                      type="button"
                      onClick={() => setPaidAmount(totals.total.toFixed(2))}
                      className="text-[10px] text-forest font-bold hover:underline"
                    >
                      Tout payé (${totals.total.toFixed(2)})
                    </button>
                  </div>
                </div>

                <div>
                  <Label className="text-[11px] font-semibold">
                    {totals.change > 0 ? "Monnaie à rendre" : "Solde restant"}
                  </Label>
                  <div
                    className={`h-9 px-3 rounded-xl border flex items-center justify-between text-xs font-black mt-1 ${
                      totals.change > 0
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-800"
                        : totals.balance === 0
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800"
                          : "bg-rose-500/10 border-rose-500/30 text-rose-800"
                    }`}
                  >
                    <span>
                      {totals.change > 0
                        ? `+$${totals.change.toFixed(2)} USD`
                        : `$${totals.balance.toFixed(2)} USD`}
                    </span>
                    <span className="text-[10px] opacity-80">
                      {totals.change > 0
                        ? `≈ ${totals.changeHtg.toLocaleString("fr-FR")} HTG`
                        : `≈ ${totals.balanceHtg.toLocaleString("fr-FR")} HTG`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom template color (if custom template selected) */}
            {template === "custom" && (
              <div>
                <Label className="text-[11px]">Couleur d'accentuation du modèle</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-8 w-12 rounded cursor-pointer border"
                  />
                  <Input
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-8 font-mono text-xs rounded-xl bg-background"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Legal Box / Warning text & Notes */}
          <div className="rounded-3xl border bg-card p-5 shadow-soft space-y-3 text-xs">
            <h3 className="text-sm font-bold text-forest flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Avertissement & Mentions Spéciales
            </h3>

            <div>
              <Label className="text-[11px] text-muted-foreground">
                Boîte d'avertissement colis (Cadre ambre dans le modèle Fret)
              </Label>
              <Textarea
                rows={2}
                value={warningText}
                onChange={(e) => setWarningText(e.target.value)}
                className="mt-1 text-xs rounded-xl bg-background"
              />
            </div>

            <div>
              <Label className="text-[11px] text-muted-foreground">Notes de bas de page</Label>
              <Input
                value={invoiceNote}
                onChange={(e) => setInvoiceNote(e.target.value)}
                className="h-8 text-xs rounded-xl mt-1 bg-background"
              />
            </div>
          </div>

          {/* Action buttons (Print, WhatsApp, Validate) */}
          <div className="space-y-2">
            <Button
              type="button"
              onClick={handleValidateSale}
              className="w-full h-12 rounded-2xl bg-forest text-forest-foreground hover:bg-forest/90 font-black text-sm shadow-md flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Encaisser & Décrémenter le stock
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrint}
                className="h-11 rounded-2xl font-bold text-xs bg-card hover:bg-secondary flex items-center justify-center gap-2"
              >
                <Printer className="h-4 w-4 text-primary" />
                Imprimer / PDF
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleWhatsApp}
                className="h-11 rounded-2xl font-bold text-xs bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white flex items-center justify-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
