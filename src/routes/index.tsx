import { LocationMap } from "@/components/LocationMap";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Search,
  PackagePlus,
  ShoppingBag,
  Plane,
  MapPin,
  Truck,
  Warehouse,
  Wallet,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Globe,
  Headphones,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/lib/settings";
import { useUser } from "@/lib/session";
import { clientStore } from "@/lib/store";
import type { ProductItem } from "@/lib/types-store";
import { formatNumber } from "@/lib/utils";
import { productCurrency, productExchangeRate } from "@/lib/product-commerce";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  PrimeShippingLogo,
  PrimeStoreLogo,
  PartnerBrandsBar,
} from "@/components/BrandLogos";
import heroPlane from "@/assets/hero-plane.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Prime Express Shipping — Fret, Colis & Achats vers Haïti" },
      {
        name: "description",
        content:
          "Expédition USA ➔ Haïti, achats assistés, boutique en ligne, suivi en temps réel et livraison locale partout en Haïti avec Prime Express Shipping.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Prime Express Shipping — Fret, Colis & Achats vers Haïti" },
      {
        property: "og:description",
        content:
          "Adresse internationale, service Achetez pour moi, boutique, paiement par portefeuille et livraison locale en Haïti.",
      },
    ],
  }),
  component: Index,
});

const STEPS = [
  {
    icon: PackagePlus,
    title: "1. Créez votre compte",
    text: "Indiquez votre ville actuelle en Haïti et votre adresse de livraison.",
  },
  {
    icon: ShoppingBag,
    title: "2. Choisissez ou demandez",
    text: "Commandez nos produits ou envoyez le lien / photo de votre article souhaité.",
  },
  {
    icon: Plane,
    title: "3. Nous expédions vers Haïti",
    text: "Acheminement rapide par vol régulier avec numéro de suivi en direct.",
  },
  {
    icon: MapPin,
    title: "4. Réceptionnez votre colis",
    text: "Livraison à votre porte ou retrait sécurisé dans nos succursales partenaires.",
  },
];

function Index() {
  const s = useSettings();
  const { user } = useUser();
  const [tracking, setTracking] = useState("");
  const navigate = useNavigate();
  const name = s?.company_name ?? "Prime Express Shipping";
  const rate = Number(s?.usd_to_htg) || 0;
  const productsQuery = useQuery({
    queryKey: ["products-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ProductItem[];
    },
  });
  const products = productsQuery.data ?? [];

  return (
    <div className="space-y-12 pb-20">
      {/* Hero — verre iOS sur fond chaleureux, comme la maquette */}
      <section className="mx-auto max-w-7xl px-4 pt-6 space-y-5">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          {/* Texte à gauche */}
          <div>
            <span className="inline-flex rounded-full bg-primary px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-primary-foreground shadow-soft">
              {name}
            </span>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
              {s?.slogan || "Vos colis et achats jusqu'en Haïti"}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Service de fret aérien & maritime Miami ➔ Haïti. Achats assistés, carte
              internationale, suivi GPS en direct et bien plus encore.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="rounded-full px-6 font-bold">
                <Link to="/suivi">
                  <Search className="h-4 w-4 mr-1.5" /> Suivre un colis
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full px-6 font-bold">
                <Link to="/boutique">
                  Visiter notre boutique <ArrowRight className="h-4 w-4 ml-1.5" />
                </Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                { icon: Zap, label: "Rapide" },
                { icon: ShieldCheck, label: "Fiable" },
                { icon: Globe, label: "Global" },
                { icon: Headphones, label: "Support 7j/7" },
              ].map((c) => (
                <span
                  key={c.label}
                  className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-foreground"
                >
                  <c.icon className="h-3.5 w-3.5 text-primary" /> {c.label}
                </span>
              ))}
            </div>
          </div>

          {/* Illustration + cartes flottantes à droite */}
          <div className="relative mx-auto w-full max-w-lg">
            <img
              src={heroPlane}
              alt="Avion cargo, globe et navire Prime Express Shipping"
              width={1024}
              height={1024}
              className="w-full drop-shadow-2xl"
            />
            <div className="glass-strong absolute right-0 top-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-foreground">
              <Plane className="h-3.5 w-3.5 text-primary" /> Haïti plus proche que jamais
            </div>
          </div>
        </div>

        {/* Barre de suivi en pilule de verre */}
        <form
          className="glass-strong flex gap-2 rounded-full p-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (tracking.trim()) navigate({ to: "/suivi", search: { n: tracking.trim() } });
          }}
        >
          <Search className="h-5 w-5 self-center text-muted-foreground ml-3" />
          <Input
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="Entrez votre numéro de suivi de colis ou de fret (ex: PS-XXXX, TBA...)"
            className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm font-medium"
            maxLength={50}
          />
          <Button type="submit" className="rounded-full px-6 font-bold">
            Suivre le colis
          </Button>
        </form>
      </section>

      {/* Marques Partenaires */}
      <LocationMap />

      {/* MODULES MAJEURS — PRIME SHIPPING & PRIME STORE */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Module 1: PRIME SHIPPING */}
          <div className="rounded-3xl bg-gradient-to-br from-[#2A1A0C] via-[#1A1008] to-[#c2410c] text-white p-7 sm:p-8 shadow-glass border border-orange-500/30 flex flex-col justify-between relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="h-24 w-28 sm:w-36 flex-shrink-0">
                  <PrimeShippingLogo className="h-full w-auto object-contain" />
                </div>
                {s?.shipping_rate_per_lb ? (
                  <span className="rounded-md bg-orange-500 text-[#1F150C] px-2.5 py-1 text-xs font-black uppercase tracking-wider">
                    {Number(s.shipping_rate_per_lb).toFixed(2)}$ / lb
                  </span>
                ) : (
                  <span className="rounded-md bg-orange-500 text-[#1F150C] px-2.5 py-1 text-xs font-black uppercase tracking-wider">
                    Tarif sur demande
                  </span>
                )}
              </div>

              <h3 className="text-2xl font-black text-white tracking-tight">
                Prime Express Shipping
              </h3>
              <p className="mt-2 text-orange-100/80 text-sm leading-relaxed max-w-md">
                Expédition internationale de colis depuis Miami vers Haïti. Consolidation de
                plusieurs colis et poids dans un seul paquet pour une facture unique.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-orange-200">
                <span className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-md border border-white/10">
                  <Plane className="h-3 w-3" /> Fret aérien régulier
                </span>
                <span className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-md border border-white/10">
                  <MapPin className="h-3 w-3" /> Suivi en direct
                </span>
                <span className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-md border border-white/10">
                  <ShieldCheck className="h-3 w-3" /> Dédouanement inclus
                </span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center gap-3 relative z-10">
              <Button
                asChild
                size="default"
                className="rounded-lg font-bold bg-orange-500 hover:bg-orange-600 text-[#1F150C] shadow-xs"
              >
                <Link to="/suivi">
                  Suivre un colis <ArrowRight className="h-4 w-4 ml-1.5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="default"
                className="rounded-lg font-bold bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Link to="/compte/colis/nouveau">Déclarer un colis</Link>
              </Button>
            </div>
          </div>

          {/* Module 2: PRIME STORE */}
          <div className="rounded-3xl bg-gradient-to-br from-[#160D05] via-[#2A1C0E] to-[#b45309]/40 text-white p-7 sm:p-8 shadow-glass border border-amber-500/30 flex flex-col justify-between relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="h-24 w-28 sm:w-36 flex-shrink-0">
                  <PrimeStoreLogo className="h-full w-auto object-contain" />
                </div>
                <span className="rounded-md bg-amber-500 text-[#1F150C] px-2.5 py-1 text-xs font-black uppercase tracking-wider">
                  BOUTIQUE OFFICIELLE
                </span>
              </div>

              <h3 className="text-2xl font-black text-white tracking-tight">Prime Store</h3>
              <p className="mt-2 text-amber-100/80 text-sm leading-relaxed max-w-md">
                Boutique en ligne intégrée : téléphones, ordinateurs, accessoires et cartes cadeaux
                numériques disponibles immédiatement en Haïti.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-amber-200">
                <span className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-md border border-white/10">
                  <ShoppingBag className="h-3 w-3" /> Articles en stock
                </span>
                <span className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-md border border-white/10">
                  <Wallet className="h-3 w-3" /> MonCash & Natcash
                </span>
                <span className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-md border border-white/10">
                  Sans carte US requise
                </span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center gap-3 relative z-10">
              <Button
                asChild
                size="default"
                className="rounded-lg font-bold bg-amber-400 hover:bg-amber-500 text-[#1F150C] shadow-xs"
              >
                <Link to="/boutique">
                  Visiter la boutique <ArrowRight className="h-4 w-4 ml-1.5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="default"
                className="rounded-lg font-bold bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Link to="/achat">Achetez pour moi</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* NOS PRODUITS — Showcase visible sur l'accueil */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-md mb-2">
              <ShoppingBag className="h-3.5 w-3.5" />
              Catalogue Prime Shipping
            </div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
              Articles & <span className="text-gradient">Produits Disponibles</span>
            </h2>
            <p className="mt-1 text-muted-foreground text-sm max-w-xl">
              Commandez directement nos articles ou recharges numériques. Vous n'avez pas de carte
              internationale ? Payez via MonCash, Natcash ou votre portefeuille !
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="rounded-lg font-bold self-start md:self-auto"
          >
            <Link to="/boutique">
              Voir toute la boutique <ArrowRight className="h-4 w-4 ml-1.5" />
            </Link>
          </Button>
        </div>

        {/* Product Cards Grid */}
        {productsQuery.isError && <p role="alert" className="text-destructive">Impossible de charger les produits pour le moment.</p>}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 4).map((p) => {
            const priceHtg = Number(p.promo_price_usd ?? p.price_usd) * productExchangeRate(p.extra, rate);
            const isDigital = p.requires_shipping_address === false;
            return (
              <div
                key={p.id}
                className="group glass rounded-2xl overflow-hidden hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <Link
                    to="/boutique/$id"
                    params={{ id: p.id }}
                    className="block relative aspect-[4/3] bg-[#1A1008] overflow-hidden"
                  >
                    {p.media_urls?.[0] ? (
                      <img
                        src={p.media_urls[0]}
                        alt={p.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-[#1A1008] text-muted-foreground">
                        <ShoppingBag className="h-10 w-10 opacity-40" />
                      </div>
                    )}

                    <div className="absolute top-2.5 left-2.5">
                      {isDigital ? (
                        <span className="rounded-md bg-emerald-600/90 text-white text-[10px] font-extrabold px-2 py-0.5 backdrop-blur shadow-xs">
                          Numérique
                        </span>
                      ) : (
                        <span className="rounded-md bg-orange-500 text-[#1F150C] text-[10px] font-black px-2 py-0.5 backdrop-blur shadow-xs">
                          En stock Haïti
                        </span>
                      )}
                    </div>
                  </Link>

                  <div className="p-4">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                      {p.category}
                    </span>
                    <Link to="/boutique/$id" params={{ id: p.id }} className="block group/title">
                      <h3 className="text-sm font-bold text-foreground group-hover/title:text-primary mt-1 line-clamp-2 leading-snug transition-colors">
                        {p.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-border mt-3 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-base font-black text-foreground">
                      {p.extra?.amount_mode === "custom_usd" ? "Montant libre" : <>{formatNumber(p.promo_price_usd ?? p.price_usd)} <span className="text-xs font-semibold text-primary">{productCurrency(p.extra)}</span></>}
                    </div>
                    {p.extra?.amount_mode !== "custom_usd" && productCurrency(p.extra) === "USD" && productExchangeRate(p.extra, rate) > 0 && <div className="text-[10px] font-medium text-muted-foreground">
                      ≈ {formatNumber(priceHtg)} GDS
                    </div>}
                  </div>
                  <Button
                    asChild
                    size="sm"
                    className="rounded-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
                  >
                    <Link to="/boutique/$id" params={{ id: p.id }}>
                      Commander <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dedicated "Achetez pour moi" Banner Highlight */}
        <div className="mt-8 rounded-3xl bg-gradient-to-br from-[#2A1A0C] via-[#140D06] to-[#2A1A0C] border border-orange-500/20 text-white p-6 md:p-8 shadow-glass relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl z-10">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/20 text-orange-400 border border-primary/30 px-2.5 py-0.5 text-xs font-extrabold mb-2.5">
              Service Achetez Pour Moi
            </span>
            <h3 className="text-xl md:text-2xl font-extrabold text-white">
              Vous avez vu un article sur Amazon, Shein, eBay ou AliExpress ?
            </h3>
            <p className="mt-2 text-orange-100/80 text-sm leading-relaxed">
              Ne vous souciez pas des cartes de crédit internationales : collez le lien de votre
              article ou envoyez la photo. Nous achetons pour vous et vous livrons directement en
              Haïti.
            </p>
          </div>
          <div className="z-10 flex-shrink-0">
            <Button
              asChild
              size="lg"
              className="rounded-lg px-6 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
            >
              <Link to="/achat">
                Faire une demande d'achat <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="mx-auto max-w-7xl px-4">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
          Comment <span className="text-gradient">ça marche</span>
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Chaque client s'inscrit en choisissant sa ville actuelle en Haïti, son adresse et son mode
          de réception préféré.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((st, i) => (
            <div
              key={st.title}
              className="glass rounded-2xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <st.icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-2xl font-extrabold text-muted-foreground/60">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-bold text-foreground">{st.title}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{st.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Agences & Retrait */}
      <section className="mx-auto grid max-w-7xl gap-6 px-4 md:grid-cols-2">
        <div className="glass flex items-center gap-4 rounded-2xl p-5 md:p-6">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Warehouse className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-foreground">Retrait en Succursale</h3>
            <p className="mt-0.5 text-muted-foreground text-xs leading-relaxed">
              {s?.pickup_address || ""}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Retrait sans frais de remise au guichet</span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        </div>
        <div className="glass flex items-center gap-4 rounded-2xl p-5 md:p-6">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Truck className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-foreground">Livraison à Domicile en Haïti</h3>
            <p className="mt-0.5 text-muted-foreground text-xs leading-relaxed">
              {s?.delivery_zones ? `Zones desservies : ${s.delivery_zones.split(/\n|,/).map((z) => z.trim()).filter(Boolean).join(", ")}` : ""}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-primary font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Remis en main propre à votre porte ou bureau</span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        </div>
      </section>

      {/* Marques internationales */}
      <section className="mx-auto max-w-7xl px-4">
        <PartnerBrandsBar className="glass rounded-2xl px-4 py-5" />
      </section>

      {/* Inscription CTA if not logged in */}
      {!user && (
        <section className="mx-auto max-w-4xl px-4 text-center">
          <div className="glass rounded-3xl p-8 sm:p-10">
            <h3 className="text-xl sm:text-2xl font-black text-foreground">
              Prêt à expédier et recevoir vos colis en Haïti ?
            </h3>
            <p className="mt-2 text-muted-foreground text-xs sm:text-sm max-w-md mx-auto">
              Inscrivez-vous gratuitement, obtenez votre adresse internationale à Miami et gérez vos
              expéditions en toute simplicité.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Button
                asChild
                size="default"
                className="rounded-lg px-6 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
              >
                <Link to="/auth" search={{ mode: "signup" }}>
                  Créer mon compte maintenant
                </Link>
              </Button>
              <Button asChild size="default" variant="outline" className="rounded-lg font-semibold">
                <Link to="/auth" search={{ mode: "login" }}>
                  J'ai déjà un compte
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
