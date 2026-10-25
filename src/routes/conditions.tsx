import { createFileRoute } from "@tanstack/react-router";
import { useSettings } from "@/lib/settings";
import { FileText, ShieldCheck, Truck, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/conditions")({
  head: () => ({
    meta: [
      { title: "Conditions Générales & Politiques — Prime Shipping" },
      {
        name: "description",
        content:
          "Conditions générales d'utilisation, expéditions en Haïti, politique de confidentialité et de réclamation.",
      },
      { property: "og:title", content: "Conditions Générales & Politiques — Prime Shipping" },
    ],
  }),
  component: Conditions,
});

export function Conditions() {
  const s = useSettings();

  const sections = [
    {
      title: "Conditions Générales d'Utilisation & Services",
      icon: FileText,
      content:
        s?.terms_and_conditions ||
        s?.terms ||
        `1. OBJET DU SERVICE
Prime Shipping fournit aux particuliers et entreprises en Haïti des solutions d'expédition de colis depuis l'international (États-Unis et autres zones), ainsi qu'un service d'achat assisté (« Achetez pour moi ») permettant de commander sur n'importe quel site internet étranger (Amazon, Shein, eBay, AliExpress, etc.).

2. TARIFICATION & PAIEMENT
Les expéditions sont facturées au tarif en vigueur par livre (lb), avec un taux de change officiel mis à jour régulièrement. Les clients peuvent approvisionner leur portefeuille électronique via MonCash, Natcash ou virement bancaire. Pour les demandes d'achat assisté, le montant vérifié avec taxes est déduit du solde après approbation par l'administration.

3. RESPONSABILITÉ & CONFORMITÉ
Tous les paquets transitant par nos entrepôts font l'objet d'un contrôle de conformité conformément aux lois douanières. Les articles prohibés sont strictement interdits.`,
    },
    {
      title: "Politique de Livraison en Haïti",
      icon: Truck,
      content:
        s?.shipping_policy ||
        `Nous assurons la livraison à domicile et le retrait en agence dans les principales villes d'Haïti : Port-au-Prince, Delmas, Pétion-Ville, Tabarre, Cap-Haïtien, Gonaïves, Saint-Marc, Les Cayes et Jacmel. Un avis de mise à disposition vous est envoyé par notification et SMS dès que votre colis est disponible.`,
    },
    {
      title: "Politique de Confidentialité & Données",
      icon: ShieldCheck,
      content:
        s?.privacy_policy ||
        s?.privacy ||
        `Les informations recueillies (nom, téléphone, adresse de livraison en Haïti, ville, coordonnées d'expédition) sont exclusivement destinées à la gestion opérationnelle de vos commandes et au bon acheminement de vos colis. Elles ne sont en aucun cas vendues ni cédées à des tiers.`,
    },
    {
      title: "Politique de Réclamations & Retours",
      icon: RefreshCw,
      content:
        s?.return_policy ||
        s?.refund_policy ||
        `Toute anomalie (colis endommagé ou non conforme) doit être signalée dans un délai de 48 heures au service support avec photographies et numéro de suivi à l'appui.`,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 space-y-10">
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider bg-accent text-accent-foreground px-3 py-1 rounded-full">
          Légal & Transparence
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-forest">
          Conditions Générales & Politiques
        </h1>
        <p className="text-sm text-muted-foreground">
          Ces conditions régissent l'utilisation des services de Prime Shipping, les expéditions
          de colis, les achats assistés et les livraisons en Haïti. Modifiables à tout moment depuis
          le tableau de bord administrateur.
        </p>
      </div>

      <div className="space-y-8">
        {sections.map((sec) => (
          <div
            key={sec.title}
            className="rounded-3xl border bg-card p-6 sm:p-8 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary">
                <sec.icon className="h-5 w-5" />
              </span>
              <h2 className="text-xl font-bold text-foreground">{sec.title}</h2>
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground whitespace-pre-line leading-relaxed pl-1">
              {sec.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
