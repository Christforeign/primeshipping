import React from "react";
import type { CheckoutCustomerFieldsConfig } from "@/lib/types-store";
import { Button } from "@/components/ui/button";
import { UserCheck, Check, Save } from "lucide-react";
import { toast } from "sonner";

interface Props {
  config: CheckoutCustomerFieldsConfig;
  onChange: (cfg: CheckoutCustomerFieldsConfig) => void;
}

export function AdminCustomerFieldsConfig({ config, onChange }: Props) {
  const fields = [
    {
      key: "require_first_name" as const,
      label: "Prénom du client",
      desc: "Champ prénom obligatoire lors de la commande",
    },
    {
      key: "require_last_name" as const,
      label: "Nom de famille",
      desc: "Champ nom obligatoire lors de la commande",
    },
    {
      key: "require_phone" as const,
      label: "Téléphone / WhatsApp",
      desc: "Pour les notifications SMS / WhatsApp et la livraison locale",
    },
    {
      key: "require_email" as const,
      label: "Adresse e-mail",
      desc: "Pour la facture, les codes numériques et le reçu",
    },
    {
      key: "require_address" as const,
      label: "Adresse de livraison",
      desc: "Rue, numéro et repères pour la remise à domicile",
    },
    {
      key: "require_city" as const,
      label: "Ville en Haïti",
      desc: "Sélection de la commune de destination",
    },
    { key: "require_country" as const, label: "Pays", desc: "Fixé par défaut à Haïti" },
    {
      key: "require_postal_code" as const,
      label: "Code postal / Arrondissement",
      desc: "Optionnel pour les zones spécifiques",
    },
  ];

  const handleToggle = (key: keyof CheckoutCustomerFieldsConfig) => {
    const updated = { ...config, [key]: !config[key] };
    onChange(updated);
    toast.success("Exigence du champ mise à jour.");
  };

  return (
    <div className="space-y-6 rounded-3xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h3 className="text-xl font-black text-foreground flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-amber-500" /> Informations Client Demandées au
            Checkout
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Choisissez précisément quelles données personnelles vos clients doivent obligatoirement
            fournir lors de leur commande.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => {
          const isRequired = config[f.key];

          return (
            <div
              key={f.key}
              onClick={() => handleToggle(f.key)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isRequired
                  ? "border-amber-500 bg-amber-500/10 shadow-2xs"
                  : "border-border hover:bg-muted/40 opacity-70"
              }`}
            >
              <div>
                <span className="font-bold text-xs text-foreground block">{f.label}</span>
                <span className="text-[11px] text-muted-foreground">{f.desc}</span>
              </div>

              <div
                className={`h-5 w-5 rounded-lg border flex items-center justify-center flex-shrink-0 transition-colors ${
                  isRequired
                    ? "border-amber-500 bg-amber-500 text-slate-950 font-black"
                    : "border-slate-300 bg-background"
                }`}
              >
                {isRequired && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
