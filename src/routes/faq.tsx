import { createFileRoute } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Questions fréquentes — Prime Shipping" },
      {
        name: "description",
        content: "Réponses aux questions sur l'envoi de colis, le suivi et la livraison en Haïti.",
      },
      { property: "og:title", content: "Questions fréquentes — Prime Shipping" },
      {
        property: "og:description",
        content: "Tout savoir sur l'envoi de colis vers Haïti avec Prime Shipping.",
      },
    ],
  }),
  component: Faq,
});

const QA: [string, string][] = [
  [
    "Comment obtenir mon adresse de réception ?",
    "Créez votre compte. Notre équipe vous attribue une adresse de réception qui apparaît dans votre espace client, avec votre identifiant client.",
  ],
  [
    "Pourquoi déclarer mon colis ?",
    "La déclaration nous permet d'identifier votre colis dès son arrivée à l'entrepôt et d'accélérer son traitement.",
  ],
  [
    "Comment suivre mon colis ?",
    "Utilisez votre numéro de suivi sur la page Suivi de colis, ou consultez « Mes colis » dans votre espace.",
  ],
  [
    "Comment sont calculés les frais ?",
    "Selon le poids réel en livres et les frais de service affichés sur la page Services.",
  ],
  [
    "Puis-je me faire livrer à domicile ?",
    "Oui, dans les zones desservies. Sinon, vous pouvez récupérer votre colis au bureau de retrait.",
  ],
];

function Faq() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-4xl font-bold text-forest">Questions fréquentes</h1>
      <Accordion type="single" collapsible className="mt-8 rounded-2xl border bg-card px-6">
        {QA.map(([q, a]) => (
          <AccordionItem key={q} value={q}>
            <AccordionTrigger className="text-left">{q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
