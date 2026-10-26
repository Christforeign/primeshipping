// @ts-nocheck — legacy pages pending migration to real tables
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ShoppingBag, Search, Sparkles, ArrowRight, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/lib/settings";
import type { ProductItem } from "@/lib/types-store";
import { formatNumber } from "@/lib/utils";
import { PrimeStoreLogo, PaymentMethodsBar, PartnerBrandsBar } from "@/components/BrandLogos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/boutique/")({
  head: () => ({
    meta: [
      { title: "Boutique & Demande d'achat — Prime Shipping" },
      {
        name: "description",
        content:
          "Commandez directement ou demandez un achat assisté sur Amazon, Shein, eBay vers Haïti.",
      },
      { property: "og:title", content: "Boutique & Demande d'achat — Prime Shipping" },
      { property: "og:description", content: "Découvrez les produits Prime Shipping et commandez depuis leur fiche dédiée." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BoutiquePage,
});

function BoutiquePage() {
  const s = useSettings();
  const rate = s?.usd_to_htg || 132;
  const defaultTaxRate = s?.tax_enabled ? s?.tax_rate || 10 : 0;
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [searchQuery, setSearchQuery] = useState("");

  const productsQuery = useQuery({
    queryKey: ["products-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ProductItem[];
    },
  });
  const products = productsQuery.data ?? [];
  const categories = ["Tous", ...Array.from(new Set(products.map((p) => p.category)))];
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === "Tous" || p.category === selectedCategory;
    const query = searchQuery.toLowerCase();
    return matchesCat && (p.title.toLowerCase().includes(query) || p.description.toLowerCase().includes(query));
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex justify-end mb-4"><Button asChild variant="outline"><Link to="/boutique/panier"><ShoppingCart className="h-4 w-4 mr-2" /> Mon panier</Link></Button></div>
      {/* Header Banner with Prime Store Visual Identity */}
      <div className="rounded-3xl glass-strong p-6 sm:p-12 text-foreground shadow-2xl relative overflow-hidden mb-8 border border-amber-500/30">

        <div className="max-w-2xl relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-24 w-28 flex-shrink-0 grid place-items-center">
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

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Prime Store Haïti
          </h1>
          <p className="mt-3 text-base sm:text-lg text-muted-foreground leading-relaxed font-normal">
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
      {productsQuery.isPending ? (
        <p role="status" className="py-16 text-center text-muted-foreground">Chargement des produits…</p>
      ) : productsQuery.isError ? (
        <div role="alert" className="py-16 text-center space-y-4">
          <p className="text-destructive">Impossible de charger les produits pour le moment.</p>
          <Button variant="outline" onClick={() => productsQuery.refetch()}>Réessayer</Button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 rounded-3xl border bg-card p-8">
          <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-bold text-forest">Aucun produit trouvé</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Essayez de modifier votre filtre ou votre recherche.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
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
                  className="block relative aspect-square w-full overflow-hidden bg-muted group/img"
                >
                  <img
                    src={coverImg}
                    alt={prod.title}
                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                    <span className="rounded-full liquid text-foreground text-[10px] font-black px-2.5 py-1 backdrop-blur-sm">
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
                <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <Link to="/boutique/$id" params={{ id: prod.id }}>
                      <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-amber-500 transition-colors line-clamp-2">
                        {prod.title}
                      </h3>
                    </Link>
                    <p className="hidden sm:block text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                      {prod.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      {prod.extra?.amount_mode === "custom_usd" ? <p className="text-sm font-bold text-foreground">Montant libre</p> : <>
                      <p className="text-base sm:text-lg font-extrabold text-foreground">{prod.price_usd} USD</p>
                      <p className="text-xs font-semibold text-muted-foreground">
                        ≈ {formatNumber(htgPrice)} HTG
                      </p>
                      </>}
                    </div>

                    <Button
                      size="sm"
                      asChild
                      className="w-full sm:w-auto rounded-full text-xs font-black bg-amber-500 hover:bg-amber-600 text-slate-950"
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
      <div className="mt-16 p-8 rounded-3xl glass border shadow-xl space-y-8">
        <PartnerBrandsBar />
        <div className="pt-6 border-t border-border">
          <PaymentMethodsBar />
        </div>
      </div>
    </div>
  );
}
