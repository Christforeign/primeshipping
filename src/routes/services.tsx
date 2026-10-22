import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Plane,
  ShoppingBag,
  Truck,
  Warehouse,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/settings";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Nos Services & Tarifs — Prime Entreprise" },
      {
        name: "description",
        content:
          "Expéditions vers Haïti, service Achetez pour moi sans prix imposé, tarifs transparents au poids.",
      },
      { property: "og:title", content: "Nos Services & Tarifs — Prime Entreprise" },
    ],
  }),
  component: Services,
});

const ITEMS = [
  {
    icon: Warehouse,
    t: "Adresse de réception à l'étranger",
    d: "Une adresse personnelle pour faire livrer vos achats en ligne (USA), attribuée à votre compte client.",
  },
  {
    icon: ShoppingBag,
    t: "Achats assistés (« Achetez pour moi »)",
    d: "Vous ne possédez pas de carte internationale ? Collez le lien ou téléversez la photo. C'est vous qui indiquez votre prix estimé. Déduction sur solde après vérification.",
  },
  {
    icon: Plane,
    t: "Expédition aérienne vers Haïti",
    d: "Regroupement, inspection et expédition sécurisée par vol régulier chaque semaine avec suivi continu.",
  },
  {
    icon: Truck,
    t: "Retrait en succursale ou livraison locale",
    d: "Récupérez votre colis dans nos agences de Delmas 33 ou Pétion-Ville, ou faites-vous livrer partout en Haïti.",
  },
];

function Services() {
  const s = useSettings();
  const rate = s?.usd_to_htg || 132;

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 space-y-12">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider bg-accent text-accent-foreground px-3 py-1 rounded-full">
          Prestations & Solutions
        </span>
        <h1 className="text-4xl font-extrabold text-forest mt-3">
          Nos Services & Solutions Logistiques
        </h1>
        <p className="mt-2 text-muted-foreground text-sm max-w-2xl">
          De vos achats sur les plus grands sites mondiaux jusqu'à votre livraison à domicile en
          Haïti.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {ITEMS.map((i) => (
          <div
            key={i.t}
            className="rounded-3xl border bg-card p-8 shadow-sm flex flex-col justify-between"
          >
            <div>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-primary mb-4">
                <i.icon className="h-6 w-6" />
              </span>
              <h2 className="text-xl font-bold text-foreground">{i.t}</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{i.d}</p>
            </div>
            {i.t.includes("Achats assistés") && (
              <div className="mt-4 pt-4 border-t">
                <Button asChild size="sm" variant="sun" className="rounded-xl font-bold">
                  <Link to="/achat">
                    Faire une demande d'achat <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tarifs transparents */}
      <div className="rounded-3xl bg-secondary/80 border p-8 md:p-10 space-y-6">
        <div>
          <h2 className="text-2xl font-black text-forest">Grille Tarifaire Officielle</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Aucun frais caché. Les demandes d'achats ne comportent aucun prix imposé : vous indiquez
            votre montant estimé.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-card border p-5">
            <span className="text-xs text-muted-foreground block font-medium">
              Fret aérien par livre
            </span>
            <span className="text-2xl font-black text-forest mt-1 block">
              {s?.shipping_rate_per_lb ?? "—"} USD <span className="text-xs font-normal">/ lb</span>
            </span>
            <span className="text-[11px] text-muted-foreground">
              Colis pesé à l'arrivée en entrepôt
            </span>
          </div>

          <div className="rounded-2xl bg-card border p-5">
            <span className="text-xs text-muted-foreground block font-medium">
              Taux de conversion
            </span>
            <span className="text-2xl font-black text-forest mt-1 block">1 USD = {rate} HTG</span>
            <span className="text-[11px] text-muted-foreground">Taux du jour transparent</span>
          </div>

          <div className="rounded-2xl bg-card border p-5">
            <span className="text-xs text-muted-foreground block font-medium">
              Demandes d'achat
            </span>
            <span className="text-2xl font-black text-forest mt-1 block">Prix libre</span>
            <span className="text-[11px] text-muted-foreground">
              Le client saisit son montant ou budget
            </span>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap gap-3">
          <Button asChild variant="sun" className="rounded-xl font-bold">
            <Link to="/achat">
              <Sparkles className="h-4 w-4 mr-1.5" /> Créer une demande personnalisée
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl font-semibold">
            <Link to="/auth" search={{ mode: "signup" }}>
              Ouvrir un compte client
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
