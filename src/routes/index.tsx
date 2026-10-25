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
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/lib/settings";
import { useUser } from "@/lib/session";
import { clientStore } from "@/lib/store";
import type { ProductItem } from "@/lib/types-store";
import { formatNumber } from "@/lib/utils";
import {
  PrimeShippingLogo,
  PrimeStoreLogo,
  PaymentMethodsBar,
  PartnerBrandsBar,
} from "@/components/BrandLogos";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Prime Express Shipping — Fret, Colis & Achats vers Haïti" },
      {
        name: "description",
        content:
          "Expédition USA ➔ Haïti, achats assistés, boutique en ligne, suivi en temps réel et livraison locale partout en Haïti avec Prime Express Shipping.",
      },
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
  const rate = s?.usd_to_htg || 132;
  const [products, setProducts] = useState<ProductItem[]>([]);

  useEffect(() => {
    setProducts(clientStore.getProducts().filter((p) => p.is_active !== false));
    const handleProductsChange = () => {
      setProducts(clientStore.getProducts().filter((p) => p.is_active !== false));
    };
    window.addEventListener("prime_products_changed", handleProductsChange);
    return () => window.removeEventListener("prime_products_changed", handleProductsChange);
  }, []);

  return (
    <div className="space-y-12 pb-20">
      {/* Hero Section - Clean, Sharp, No Bubbles */}
      <section className="mx-auto max-w-7xl px-4 pt-4 space-y-4">
        {/* Tracking Search Form */}
        <form
          className="flex gap-2 rounded-xl bg-card border border-border p-2 shadow-xs"
          onSubmit={(e) => {
            e.preventDefault();
            if (tracking.trim()) navigate({ to: "/suivi", search: { n: tracking.trim() } });
          }}
        >
          <Search className="h-5 w-5 self-center text-muted-foreground ml-2" />
          <Input
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="Entrez votre numéro de suivi de colis ou de fret (ex: PS-XXXX, TBA...)"
            className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm font-medium"
            maxLength={50}
          />
          <Button
            type="submit"
            className="rounded-lg px-6 font-bold bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Suivre le colis
          </Button>
        </form>

        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-xl border border-border shadow-xs">
          <img
            src={(s as any)?.hero_image_url || hero}
            alt="Remise d'un colis Prime Express Shipping"
            width={1600}
            height={1104}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-transparent" />
          <div className="absolute right-4 top-4 rounded-lg bg-card/95 p-2 shadow-xs border border-border backdrop-blur">
            <PrimeShippingLogo className="h-10 w-auto sm:h-12" />
          </div>
          <div className="relative max-w-2xl p-6 py-12 sm:p-10 md:py-16">
            <span className="inline-flex rounded-md bg-primary/20 text-orange-400 border border-primary/30 px-2.5 py-1 text-xs font-bold uppercase tracking-wider">
              {name}
            </span>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight text-white sm:text-5xl">
              {s?.slogan || "Vos colis et achats jusqu'en Haïti"}
            </h1>
            <p className="mt-3 text-slate-300 text-sm leading-relaxed max-w-xl">
              Service de fret aérien & maritime Miami ➔ Haïti, achats assistés sans carte
              internationale, suivi GPS en direct et facturation transparente.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                asChild
                className="rounded-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-xs"
              >
                <Link to="/suivi">
                  <Search className="h-4 w-4 mr-1.5" /> Suivre un colis
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-lg font-bold bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Link to="/boutique">
                  Visiter notre boutique <ArrowRight className="h-4 w-4 ml-1.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Marques Partenaires */}
      <LocationMap />
      <section className="mx-auto max-w-7xl px-4">
        <div className="rounded-xl bg-[#090f1e] border border-slate-800 p-6 md:p-8 shadow-xs">
          <PartnerBrandsBar />
        </div>
      </section>

      {/* MODULES MAJEURS — PRIME SHIPPING & PRIME STORE */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Module 1: PRIME SHIPPING */}
          <div className="rounded-xl bg-gradient-to-br from-[#1c1917] via-[#0f172a] to-[#c2410c] text-white p-7 sm:p-8 shadow-xs border border-orange-500/30 flex flex-col justify-between relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="h-10 w-28 sm:w-36 flex-shrink-0 bg-white/95 rounded-md p-1 border">
                  <PrimeShippingLogo className="h-full w-auto object-contain" />
                </div>
                {s?.shipping_rate_per_lb ? (
                  <span className="rounded-md bg-orange-500 text-slate-950 px-2.5 py-1 text-xs font-black uppercase tracking-wider">
                    {Number(s.shipping_rate_per_lb).toFixed(2)}$ / lb
                  </span>
                ) : (
                  <span className="rounded-md bg-orange-500 text-slate-950 px-2.5 py-1 text-xs font-black uppercase tracking-wider">
                    4.50$ / lb
                  </span>
                )}
              </div>

              <h3 className="text-2xl font-black text-white tracking-tight">
                Prime Express Shipping
              </h3>
              <p className="mt-2 text-slate-300 text-sm leading-relaxed max-w-md">
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
                className="rounded-lg font-bold bg-orange-500 hover:bg-orange-600 text-slate-950 shadow-xs"
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
          <div className="rounded-xl bg-gradient-to-br from-[#090d16] via-[#1e293b] to-[#b45309]/40 text-white p-7 sm:p-8 shadow-xs border border-amber-500/30 flex flex-col justify-between relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="h-10 w-28 sm:w-36 flex-shrink-0 bg-white/95 rounded-md p-1 border">
                  <PrimeStoreLogo className="h-full w-auto object-contain" />
                </div>
                <span className="rounded-md bg-amber-500 text-slate-950 px-2.5 py-1 text-xs font-black uppercase tracking-wider">
                  BOUTIQUE OFFICIELLE
                </span>
              </div>

              <h3 className="text-2xl font-black text-white tracking-tight">Prime Store</h3>
              <p className="mt-2 text-slate-200 text-sm leading-relaxed max-w-md">
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
                  <Sparkles className="h-3 w-3" /> Sans carte US requise
                </span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center gap-3 relative z-10">
              <Button
                asChild
                size="default"
                className="rounded-lg font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-xs"
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
            <h2 className="text-2xl font-extrabold text-foreground md:text-3xl">
              Articles & Produits Disponibles
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
              Visiter notre boutique <ArrowRight className="h-4 w-4 ml-1.5" />
            </Link>
          </Button>
        </div>

        {/* Product Cards Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 4).map((p) => {
            const priceHtg = Math.round(p.price_usd * rate);
            const isDigital = p.requires_shipping_address === false;
            return (
              <div
                key={p.id}
                className="group rounded-xl border border-border bg-card overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <Link
                    to="/boutique/$id"
                    params={{ id: p.id }}
                    className="block relative aspect-[4/3] bg-slate-900 overflow-hidden"
                  >
                    {p.media_urls?.[0] ? (
                      <img
                        src={p.media_urls[0]}
                        alt={p.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-slate-900 text-slate-500">
                        <ShoppingBag className="h-10 w-10 opacity-40" />
                      </div>
                    )}

                    <div className="absolute top-2.5 left-2.5">
                      {isDigital ? (
                        <span className="rounded-md bg-emerald-600/90 text-white text-[10px] font-extrabold px-2 py-0.5 backdrop-blur shadow-xs">
                          Numérique
                        </span>
                      ) : (
                        <span className="rounded-md bg-orange-500 text-slate-950 text-[10px] font-black px-2 py-0.5 backdrop-blur shadow-xs">
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
                      {p.price_usd} <span className="text-xs font-semibold text-primary">USD</span>
                    </div>
                    <div className="text-[10px] font-medium text-muted-foreground">
                      ≈ {formatNumber(priceHtg)} HTG
                    </div>
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
        <div className="mt-8 rounded-xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 text-white p-6 md:p-8 shadow-xs relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl z-10">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/20 text-orange-400 border border-primary/30 px-2.5 py-0.5 text-xs font-extrabold mb-2.5">
              <Sparkles className="h-3.5 w-3.5" /> Service Achetez Pour Moi
            </span>
            <h3 className="text-xl md:text-2xl font-extrabold text-white">
              Vous avez vu un article sur Amazon, Shein, eBay ou AliExpress ?
            </h3>
            <p className="mt-2 text-slate-300 text-sm leading-relaxed">
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
        <h2 className="text-2xl font-bold text-foreground md:text-3xl">Comment ça marche</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Chaque client s'inscrit en choisissant sa ville actuelle en Haïti, son adresse et son mode
          de réception préféré.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((st, i) => (
            <div
              key={st.title}
              className="rounded-xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-muted text-primary">
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
        <div className="rounded-xl bg-card border border-border p-6 md:p-8 shadow-xs">
          <Warehouse className="h-8 w-8 text-primary" />
          <h3 className="mt-3 text-xl font-bold text-foreground">Retrait en Succursale</h3>
          <p className="mt-1.5 text-muted-foreground text-xs leading-relaxed">
            {s?.pickup_address || ""}
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            <span>Retrait sans frais de remise au guichet</span>
          </div>
        </div>
        <div className="rounded-xl bg-card border border-border p-6 md:p-8 shadow-xs">
          <Truck className="h-8 w-8 text-primary" />
          <h3 className="mt-3 text-xl font-bold text-foreground">Livraison à Domicile en Haïti</h3>
          <p className="mt-1.5 text-muted-foreground text-xs leading-relaxed">
            {s?.delivery_zones ||
              "Zones desservies : Port-au-Prince, Delmas, Pétion-Ville, Tabarre, Cap-Haïtien."}
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-primary font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            <span>Remis en main propre à votre porte ou bureau</span>
          </div>
        </div>
      </section>

      {/* Marques Partenaires & Moyens de paiement */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="rounded-xl bg-card border border-border p-6 shadow-xs space-y-6">
          <PartnerBrandsBar />
          <div className="pt-6 border-t border-border">
            <PaymentMethodsBar />
          </div>
        </div>
      </section>

      {/* Inscription CTA if not logged in */}
      {!user && (
        <section className="mx-auto max-w-4xl px-4 text-center">
          <div className="p-8 sm:p-10 rounded-xl border border-border bg-card shadow-xs">
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
