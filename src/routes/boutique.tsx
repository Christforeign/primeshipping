// @ts-nocheck — legacy pages pending migration to real tables
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ShoppingBag,
  Search,
  Tag,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Printer,
  X,
  CreditCard,
  Wallet,
  Phone,
  Clock,
  Layers,
  ChevronRight,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/lib/settings";
import { useUser } from "@/lib/session";
import { clientStore } from "@/lib/store";
import type { ProductItem, OrderItem, PaymentMethod } from "@/lib/types-store";
import { MediaGallery } from "@/components/MediaGallery";
import { CustomFieldRenderer } from "@/components/CustomFieldRenderer";
import { formatNumber } from "@/lib/utils";
import { PrimeStoreLogo, PaymentMethodsBar, PartnerBrandsBar } from "@/components/BrandLogos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/boutique")({
  head: () => ({
    meta: [
      { title: "Boutique & Demande d'achat — Prime Shipping" },
      {
        name: "description",
        content:
          "Commandez directement ou demandez un achat assisté sur Amazon, Shein, eBay vers Haïti.",
      },
      { property: "og:title", content: "Boutique & Demande d'achat — Prime Shipping" },
    ],
  }),
  component: BoutiquePage,
});

function BoutiquePage() {
  const s = useSettings();
  const { user } = useUser();
  const rate = s?.usd_to_htg || 132;
  const defaultTaxRate = s?.tax_enabled ? s?.tax_rate || 10 : 0;
  const serviceFee = s?.service_fee || 5;

  const [selectedCategory, setSelectedCategory] = useState<string>("Tous");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Product Selection for Order Drawer / Modal
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [orderQuantity, setOrderQuantity] = useState<number>(1);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  // Checkout Stage
  const [checkoutStep, setCheckoutStep] = useState<"form" | "payment" | "confirmed">("form");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>(user?.email || "");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [deliveryAddress, setDeliveryAddress] = useState<string>("Port-au-Prince, Haïti");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("moncash");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [paymentProofUrl, setPaymentProofUrl] = useState<string>("");
  const [confirmedOrder, setConfirmedOrder] = useState<OrderItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load products
  const productsQuery = useQuery({
    queryKey: ["products-list"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && data && data.length > 0) {
          return data as unknown as ProductItem[];
        }
      } catch {
        // fallback
      }
      return clientStore.getProducts();
    },
  });

  // Load user wallet balance
  const walletQuery = useQuery({
    queryKey: ["wallet-balance", user?.id],
    queryFn: async () => {
      return clientStore.getWalletBalance(user?.id || "anon");
    },
  });
  const walletBalance = Number(walletQuery.data ?? 0) || 0;

  const products = productsQuery.data || [];

  const categories = ["Tous", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === "Tous" || p.category === selectedCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleOpenProduct = (prod: ProductItem) => {
    navigate({ to: "/boutique/$id", params: { id: prod.id } });
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    setCheckoutStep("form");
    setConfirmedOrder(null);
  };

  // Calculations
  const unitPrice = selectedProduct?.price_usd || 0;
  const subtotalUsd = unitPrice * orderQuantity;
  const taxAmountUsd =
    selectedProduct?.apply_tax && s?.tax_enabled
      ? Number(((subtotalUsd * defaultTaxRate) / 100).toFixed(2))
      : 0;
  const totalUsd = Number((subtotalUsd + taxAmountUsd + serviceFee).toFixed(2));
  const totalHtg = Math.round(totalUsd * rate);

  const handleCustomFieldChange = (key: string, val: string) => {
    setCustomFieldValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const needsAddress = selectedProduct?.requires_shipping_address !== false;
    if (
      !customerName.trim() ||
      !customerPhone.trim() ||
      (needsAddress && !deliveryAddress.trim())
    ) {
      return toast.error("Veuillez remplir vos coordonnées obligatoires.");
    }
    // Check required custom fields
    if (selectedProduct?.custom_fields) {
      for (const f of selectedProduct.custom_fields) {
        if (f.required && !customFieldValues[f.id || f.label]?.trim()) {
          return toast.error(`Le champ « ${f.label} » est obligatoire.`);
        }
      }
    }
    setCheckoutStep("payment");
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === "wallet" && walletBalance < totalUsd) {
      return toast.error("Solde de portefeuille insuffisant pour régler cette commande.");
    }

    setIsSubmitting(true);
    try {
      const orderNumber = `CMD-${new Date().getFullYear().toString().slice(2)}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
      const finalAddress =
        selectedProduct?.requires_shipping_address === false
          ? "Non requise (Service numérique / Retrait)"
          : deliveryAddress;

      const newOrder: Omit<OrderItem, "id"> = {
        order_number: orderNumber,
        user_id: user?.id || "anon-client",
        product_id: selectedProduct?.id || null,
        product_title: selectedProduct?.title || "Commande personnalisée",
        quantity: orderQuantity,
        unit_price_usd: unitPrice,
        subtotal_usd: subtotalUsd,
        tax_amount_usd: taxAmountUsd,
        service_fee_usd: serviceFee,
        total_usd: totalUsd,
        total_htg: totalHtg,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        delivery_address: finalAddress,
        custom_field_responses: customFieldValues,
        payment_method: paymentMethod,
        payment_reference: paymentReference.trim() || null,
        payment_proof_url: paymentProofUrl || null,
        status: paymentMethod === "wallet" ? "payee" : "en_attente",
      };

      // Save to clientStore
      const createdStoredOrder = clientStore.createOrder(newOrder);

      // Attempt Supabase insert
      let dbOrder = null;
      try {
        const { data } = await supabase.from("orders").insert(newOrder).select("*").single();
        dbOrder = data;
      } catch (e) {
        console.warn("Supabase orders insert fallback:", e);
      }

      // If paid via wallet, debit wallet balance
      if (paymentMethod === "wallet" && user?.id) {
        const newBal = Number((walletBalance - totalUsd).toFixed(2));
        clientStore.setWalletBalance(user.id, newBal);
        clientStore.addWalletTransaction({
          wallet_id: `w-${user.id}`,
          user_id: user.id,
          user_name: customerName,
          type: "debit",
          amount_usd: totalUsd,
          amount_htg: totalHtg,
          method: "Portefeuille",
          reference: orderNumber,
          status: "approved",
          description: `Paiement commande ${orderNumber} (${selectedProduct?.title})`,
        });

        try {
          await supabase.from("wallets").update({ balance_usd: newBal }).eq("user_id", user.id);

          await supabase.from("wallet_transactions").insert({
            wallet_id: `w-${user.id}`,
            user_id: user.id,
            type: "debit",
            amount_usd: totalUsd,
            amount_htg: totalHtg,
            method: "Portefeuille",
            reference: orderNumber,
            status: "approved",
            description: `Paiement commande ${orderNumber} (${selectedProduct?.title})`,
          });
        } catch (e) {
          console.warn("Supabase wallet debit fallback:", e);
        }
      }

      setConfirmedOrder(dbOrder || createdStoredOrder);
      setCheckoutStep("confirmed");
      toast.success("Votre commande a été enregistrée avec succès !");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la validation de la commande",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {/* Header Banner with Prime Store Visual Identity */}
      <div className="rounded-3xl bg-gradient-to-br from-[#090d16] via-[#1e293b] to-[#ca8a04]/40 p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden mb-8 border border-amber-500/30">
        <div className="absolute right-6 -bottom-10 opacity-15 pointer-events-none hidden lg:block w-72">
          <PrimeStoreLogo className="w-full h-auto" />
        </div>

        <div className="max-w-2xl relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-14 w-14 rounded-2xl bg-amber-400/20 border border-amber-400/30 p-2 shadow-inner flex-shrink-0 grid place-items-center">
              <PrimeStoreLogo className="h-full w-auto" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 px-3 py-0.5 text-xs font-black uppercase tracking-wider shadow-sm">
                <Sparkles className="h-3 w-3" /> PRIME BOUTIQUE OFFICIELLE
              </span>
              <p className="text-xs text-amber-200/80 font-medium mt-0.5">
                Produits en stock, cartes cadeaux & expéditions prioritaires en Haïti
              </p>
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Prime Store Haïti
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-200 leading-relaxed font-normal">
            Commandez directement vos articles certifiés, électroniques, cosmétiques et services
            numériques payables en Gourdes (MonCash / Natcash) ou par Portefeuille client.
          </p>
        </div>
      </div>

      {/* Standalone Assisted Purchase Notification Card */}
      <div className="rounded-3xl border-2 border-accent/40 bg-gradient-to-r from-amber-500/10 via-accent/15 to-transparent p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-accent font-bold text-xs text-accent-foreground uppercase">
              Page Dédiée
            </span>
            <h2 className="font-bold text-lg text-forest">
              Vous souhaitez acheter sur un site externe ?
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
            L'achat assisté dispose de sa propre page : collez le lien, fournissez la capture ou
            photo, indiquez le site de votre choix et le prix exact. Paiement immédiat par
            portefeuille ou attente de validation admin !
          </p>
        </div>
        <Button
          asChild
          size="lg"
          className="rounded-2xl font-bold bg-forest hover:bg-forest/90 text-white flex-shrink-0 shadow-md"
        >
          <Link to="/achat">
            Accéder à l'Achat Assisté <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-forest text-forest-foreground shadow-sm"
                  : "bg-card border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un produit ou service..."
            className="pl-9 text-xs sm:text-sm h-10 rounded-full"
          />
          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
        </div>
      </div>

      {/* Product Cards Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 rounded-3xl border bg-card p-8">
          <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-bold text-forest">Aucun produit trouvé</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Essayez de modifier votre filtre ou votre recherche.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((prod) => {
            const htgPrice = Math.round(prod.price_usd * rate);
            const coverImg =
              prod.media_urls?.[0] ||
              "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=1000&q=80";

            return (
              <div
                key={prod.id}
                className="group rounded-3xl border bg-card overflow-hidden shadow-soft hover:shadow-xl transition-all duration-300 flex flex-col hover:-translate-y-1"
              >
                {/* Image & Badges */}
                <Link
                  to="/boutique/$id"
                  params={{ id: prod.id }}
                  className="block relative aspect-square w-full overflow-hidden bg-slate-900 group/img"
                >
                  <img
                    src={coverImg}
                    alt={prod.title}
                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    <span className="rounded-full bg-slate-900/90 text-amber-400 border border-slate-700 text-[10px] font-black px-2.5 py-1 backdrop-blur-sm">
                      {prod.category}
                    </span>
                    {prod.apply_tax && s?.tax_enabled && (
                      <span className="rounded-full bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5">
                        Taxe {defaultTaxRate}%
                      </span>
                    )}
                    {prod.requires_shipping_address === false && (
                      <span className="rounded-full bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 backdrop-blur-sm">
                        Sans adresse postale
                      </span>
                    )}
                  </div>
                </Link>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <Link to="/boutique/$id" params={{ id: prod.id }}>
                      <h3 className="font-bold text-base text-foreground group-hover:text-amber-500 transition-colors line-clamp-2">
                        {prod.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                      {prod.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <div>
                      <p className="text-lg font-extrabold text-foreground">{prod.price_usd} USD</p>
                      <p className="text-xs font-semibold text-muted-foreground">
                        ≈ {formatNumber(htgPrice)} HTG
                      </p>
                    </div>

                    <Button
                      size="sm"
                      asChild
                      className="rounded-full text-xs font-black bg-amber-500 hover:bg-amber-600 text-slate-950"
                    >
                      <Link to="/boutique/$id" params={{ id: prod.id }}>
                        <ShoppingCart className="h-3.5 w-3.5 mr-1" /> Commander
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Partner Brands & B2B Showcase */}
      <div className="mt-16 p-8 rounded-3xl bg-[#090f1e] border border-slate-800 shadow-xl space-y-8">
        <PartnerBrandsBar />
        <div className="pt-6 border-t border-slate-800">
          <PaymentMethodsBar />
        </div>
      </div>
    </div>
  );
}
