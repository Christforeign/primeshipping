import { useState } from "react";
import { Headset, X, ChevronLeft, MessageCircle, HelpCircle } from "lucide-react";
import { useSettings } from "@/lib/settings";
import { useWhatsAppContacts, whatsAppUrl } from "@/components/WhatsAppSupportButton";

type Faq = { q: string; a: string };

function buildFaq(s: any): Faq[] {
  const custom = Array.isArray(s?.support_faq) ? (s!.support_faq as Faq[]).filter((f) => f?.q && f?.a) : [];
  if (custom.length) return custom;
  const rate = s?.usd_to_htg;
  return [
    {
      q: "Quels sont les délais de livraison ?",
      a:
        s?.delivery_instructions ||
        "Les délais dépendent du mode d'expédition et de la date de réception à notre entrepôt. Suivez votre colis en temps réel depuis la page Suivi.",
    },
    {
      q: "Quels moyens de paiement acceptez-vous ?",
      a:
        s?.payment_instructions ||
        "Nous acceptons MonCash, Natcash, les espèces en agence et le paiement par portefeuille Prime.",
    },
    {
      q: "Comment récupérer mon colis ?",
      a:
        s?.pickup_address
          ? `Retrait en agence : ${s.pickup_address}${s?.opening_hours ? ` — Horaires : ${s.opening_hours}` : ""}.`
          : "Vous recevez une notification dès que votre colis est disponible au retrait. Présentez votre code client PS.",
    },
    {
      q: "Quel est le taux de change ?",
      a: rate ? `Taux officiel actuel : 1 USD = ${rate} HTG.` : "Le taux officiel est affiché sur chaque facture.",
    },
    {
      q: "Comment recharger mon portefeuille ?",
      a: "Depuis Mon compte › Portefeuille, choisissez MonCash ou Natcash et joignez la preuve de paiement. Le solde est crédité après validation.",
    },
  ];
}

export function LiveSupportWidget() {
  const s = useSettings() as any;
  const contacts = useWhatsAppContacts();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Faq | null>(null);
  const faq = buildFaq(s);
  const primary = contacts[0];

  return (
    <div className="fixed bottom-20 right-3 lg:bottom-5 lg:right-5 z-40">
      {open ? (
        <div className="w-[calc(100vw-1.5rem)] max-w-[380px] max-h-[75vh] rounded-xl bg-card border border-border shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-forest text-forest-foreground p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Headset className="h-5 w-5" />
              <div>
                <h3 className="font-bold text-xs">Questions fréquentes</h3>
                <span className="text-[10px] opacity-80">Prime Express Shipping</span>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Fermer" className="p-1.5 rounded-md hover:bg-background/10">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {selected ? (
              <div className="space-y-3">
                <button
                  onClick={() => setSelected(null)}
                  className="text-xs font-semibold text-primary inline-flex items-center gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Toutes les questions
                </button>
                <p className="text-sm font-bold text-foreground">{selected.q}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{selected.a}</p>
              </div>
            ) : (
              faq.map((f) => (
                <button
                  key={f.q}
                  onClick={() => setSelected(f)}
                  className="w-full text-left text-xs font-semibold p-3 rounded-lg border border-border bg-background hover:bg-muted flex items-center gap-2"
                >
                  <HelpCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  {f.q}
                </button>
              ))
            )}
          </div>

          <div className="p-3 border-t border-border">
            {primary ? (
              <a
                href={whatsAppUrl({
                  phone: primary.phone,
                  prefilled_message: selected
                    ? `Bonjour, j'ai une question : ${selected.q}`
                    : primary.prefilled_message,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] text-white text-xs font-bold py-2.5"
              >
                <MessageCircle className="h-4 w-4" /> Continuer sur WhatsApp
              </a>
            ) : (
              <p className="text-[11px] text-center text-muted-foreground">
                {s?.email ? `Écrivez-nous : ${s.email}` : "Contactez notre agence pour plus d'informations."}
              </p>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3.5 py-2.5 shadow-lg"
          aria-label="Questions fréquentes"
        >
          <Headset className="h-5 w-5" />
          <span className="text-xs font-bold hidden sm:block">Aide</span>
        </button>
      )}
    </div>
  );
}
