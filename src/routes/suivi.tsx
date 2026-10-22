// @ts-nocheck
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import {
  Search,
  Plane,
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Package,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, statusLabel, type PackageStatus } from "@/lib/labels";
import { PrimeShippingLogo, PaymentMethodsBar } from "@/components/BrandLogos";
import { useSettings } from "@/lib/settings";

export const Route = createFileRoute("/suivi")({
  validateSearch: z.object({ n: z.string().max(40).optional() }),
  head: () => ({
    meta: [
      { title: "Prime Shipping — Suivi de colis en direct vers Haïti" },
      {
        name: "description",
        content:
          "Suivez vos colis Prime Shipping en temps réel : Miami ➔ Haïti, dédouanement et mise à disposition en agence ou livraison à domicile.",
      },
      { property: "og:title", content: "Prime Shipping — Suivi de colis en direct vers Haïti" },
      {
        property: "og:description",
        content:
          "Numéro de suivi, étapes de livraison aérienne et maritime pour vos expéditions vers Haïti.",
      },
    ],
  }),
  component: Suivi,
});

type TrackResult = {
  tracking_number: string;
  status: PackageStatus;
  description: string;
  updated_at: string;
  weight_lbs?: number | null;
  events: { status: PackageStatus; note: string | null; created_at: string }[];
} | null;

const TRACKING_STEPS: { status: PackageStatus; label: string; desc: string }[] = [
  {
    status: "recu_miami",
    label: "1. Réception Entrepôt Miami",
    desc: "Colis scanné, pesé et sécurisé en Floride",
  },
  {
    status: "en_transit",
    label: "2. Transit Aérien International",
    desc: "En vol régulier vers l'Aéroport Toussaint Louverture",
  },
  {
    status: "douane",
    label: "3. Dédouanement & Tri Haïti",
    desc: "Formalités douanières et affectation pour distribution locale",
  },
  {
    status: "disponible_retrait",
    label: "4. Disponible en Agence / En livraison",
    desc: "Prêt pour retrait sécurisé ou livreur en route",
  },
  {
    status: "livre",
    label: "5. Colis Livré",
    desc: "Remis au destinataire en mains propres",
  },
];

function Suivi() {
  const { n } = Route.useSearch();
  const [value, setValue] = useState(n ?? "");
  const navigate = useNavigate();
  const s = useSettings();
  const shippingRate = s?.shipping_rate_per_lb ?? null;

  const q = useQuery({
    queryKey: ["track", n],
    enabled: !!n,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("track_package", { _tracking: n! });
      if (error) throw error;
      return data as unknown as TrackResult;
    },
  });

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      {/* Brand Hero Header with Prime Shipping Visual Colors */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1c1917] via-[#0f172a] to-[#c2410c] text-white py-16 px-4 shadow-xl border-b border-orange-500/20">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ea580c_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative mx-auto max-w-4xl text-center flex flex-col items-center">
          {/* Official Prime Shipping Logo */}
          <div className="w-56 sm:w-64 mb-4 drop-shadow-2xl">
            <PrimeShippingLogo className="w-full h-auto" />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-md bg-orange-500 text-slate-950 font-black px-3 py-1 text-xs uppercase tracking-wider shadow-xs mb-4">
            <Plane className="h-3.5 w-3.5" />
            Vols réguliers USA ➔ Haïti{shippingRate ? ` • ${shippingRate}$ / lb` : ""}
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Suivi de colis en temps réel
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-xl font-medium">
            Entrez votre numéro de suivi officiel pour géolocaliser votre marchandise et connaître
            l'état précis de votre livraison en Haïti.
          </p>

          {/* Search Bar */}
          <form
            className="mt-8 flex w-full max-w-xl gap-2 rounded-xl bg-white/10 backdrop-blur-md p-2 shadow-xs border border-white/20"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/suivi", search: { n: value.trim() || undefined } });
            }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-400" />
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Ex : PRM2610100001 ou numéro transporteur"
                maxLength={40}
                className="pl-11 h-12 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 border-0 focus-visible:ring-2 focus-visible:ring-orange-500 font-mono text-sm"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-12 px-6 rounded-xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 shadow-md flex-shrink-0"
            >
              Rechercher
            </Button>
          </form>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto max-w-4xl px-4 -mt-6">
        {q.isLoading && (
          <div className="rounded-3xl border bg-card p-12 text-center shadow-lg">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-r-transparent" />
            <p className="mt-4 text-sm font-semibold text-muted-foreground">
              Interrogation des serveurs de fret Prime Shipping…
            </p>
          </div>
        )}

        {n && q.isSuccess && !q.data && (
          <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center shadow-md">
            <Package className="mx-auto h-12 w-12 text-destructive/60 mb-3" />
            <h3 className="text-lg font-bold text-foreground">
              Aucun colis trouvé pour le numéro « {n} »
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Vérifiez les caractères saisis. Les colis nouvellement déclarés sont indexés dès leur
              arrivée physique à notre hub de Miami.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button asChild variant="outline" size="sm">
                <Link to="/compte/colis/nouveau">Déclarer un nouveau colis</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold"
              >
                <Link to="/support">Assistance Suivi</Link>
              </Button>
            </div>
          </div>
        )}

        {q.data && (
          <div className="rounded-xl border bg-card p-6 sm:p-8 shadow-xs space-y-8 animate-in fade-in duration-300">
            {/* Header Result */}
            <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                  Fiche d'expédition
                </span>
                <p className="font-mono text-2xl font-black text-foreground mt-0.5">
                  {q.data.tracking_number}
                </p>
                <p className="text-sm font-medium text-muted-foreground mt-1">
                  {q.data.description || "Marchandises générales"}
                </p>
                {q.data.weight_lbs && (
                  <p className="text-xs font-semibold text-slate-600 mt-1">
                    Poids déclaré : <span className="font-mono">{q.data.weight_lbs} lbs</span>
                  </p>
                )}
              </div>
              <div className="text-right">
                <StatusBadge status={q.data.status} />
                <p className="text-xs text-muted-foreground mt-2">
                  Dernière mise à jour : {formatDate(q.data.updated_at)}
                </p>
              </div>
            </div>

            {/* Visual Process Pipeline */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                Parcours d'acheminement
              </h4>
              <div className="grid gap-3 sm:grid-cols-5">
                {TRACKING_STEPS.map((step, idx) => {
                  const isCurrent = q.data?.status === step.status;
                  return (
                    <div
                      key={step.status}
                      className={`p-3 rounded-2xl border text-xs transition-all ${
                        isCurrent
                          ? "border-orange-500 bg-orange-500/10 shadow-sm"
                          : "border-border/60 bg-muted/30 opacity-70"
                      }`}
                    >
                      <div className="flex items-center gap-1 font-bold text-foreground">
                        {isCurrent ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-slate-300" />
                        )}
                        <span className="truncate">{step.label}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-snug line-clamp-2">
                        {step.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Event Timeline */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                Historique des scans & événements
              </h4>
              <ol className="relative border-l-2 border-orange-500/40 ml-3 space-y-6">
                {q.data.events.map((e, i) => (
                  <li key={i} className="pl-6 relative">
                    <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-orange-500 border-2 border-card" />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold text-sm text-foreground">{statusLabel(e.status)}</p>
                      <span className="text-xs text-muted-foreground font-mono">
                        {formatDate(e.created_at)}
                      </span>
                    </div>
                    {e.note && (
                      <p className="mt-1 text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-xl border border-border/40">
                        {e.note}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-muted-foreground">
                Besoin d'un renseignement sur cette livraison ?
              </span>
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline" className="rounded-xl">
                  <Link to="/support">Assistance Client</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="rounded-xl bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold"
                >
                  <Link to="/compte/colis">Tous mes colis</Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Informational Cards about Prime Shipping */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border bg-card p-6 shadow-sm space-y-2">
            <div className="h-10 w-10 rounded-2xl bg-orange-500/10 text-orange-600 grid place-items-center">
              <Plane className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-foreground">Expédition Aérienne Rapide</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Vols réguliers chaque semaine depuis Miami vers l'Aéroport International de
              Port-au-Prince.{shippingRate ? ` Tarif : ${shippingRate} USD / lb.` : ""}
            </p>
          </div>

          <div className="rounded-3xl border bg-card p-6 shadow-sm space-y-2">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 grid place-items-center">
              <MapPin className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-foreground">Retrait & Livraison Haïti</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Succursales à Delmas, Pétion-Ville, Carrefour, Cap-Haïtien et Cayes, ou livraison
              directe sécurisée à votre domicile.
            </p>
          </div>

          <div className="rounded-3xl border bg-card p-6 shadow-sm space-y-2">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 grid place-items-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-foreground">Garantie & Dédouanement</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Prise en charge intégrale des formalités douanières en Haïti. Vos colis sont assurés
              et inspectés avec précaution.
            </p>
          </div>
        </div>

        {/* Payment Methods Banner */}
        <div className="mt-12 p-6 rounded-3xl bg-card border shadow-sm">
          <PaymentMethodsBar />
        </div>
      </div>
    </div>
  );
}
