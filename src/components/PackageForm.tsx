import { useState } from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSettings } from "@/lib/settings";
import { estimatePackageShipping } from "@/lib/package-estimate";

export const packageSchema = z.object({
  merchant: z.string().trim().min(2, "Site marchand requis").max(120),
  merchant_order_number: z.string().trim().max(80).optional().or(z.literal("")),
  carrier_tracking: z.string().trim().max(80).optional().or(z.literal("")),
  description: z.string().trim().min(2, "Description requise").max(300),
  category: z.string().trim().max(60).optional().or(z.literal("")),
  quantity: z.coerce.number().int().min(1).max(999),
  estimated_weight_lb: z.coerce.number().min(0).max(2000).optional(),
  declared_value: z.coerce.number().min(0).max(1_000_000).optional(),
  currency: z.enum(["USD", "HTG", "EUR", "CAD"]),
  destination: z.string().trim().max(200).optional().or(z.literal("")),
  instructions: z.string().trim().max(500).optional().or(z.literal("")),
});
export type PackageInput = z.infer<typeof packageSchema>;

export function usePackageFields() {
  const settings = useSettings();
  const [f, setF] = useState<Record<string, string>>({ quantity: "1", currency: "USD" });
  const estimate = estimatePackageShipping(f.estimated_weight_lb, settings?.shipping_rate_per_lb);
  const parse = () => {
    const clean = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ""));
    const r = packageSchema.safeParse(clean);
    if (!r.success) throw new Error(r.error.issues[0]?.message ?? "Champs invalides");
    const d = r.data;
    return {
      ...d,
      estimated_weight_lb: d.estimated_weight_lb ?? null,
      declared_value: d.declared_value ?? null,
      merchant_order_number: d.merchant_order_number || null,
      carrier_tracking: d.carrier_tracking || null,
      category: d.category || null,
      destination: d.destination || null,
      instructions: d.instructions || null,
    };
  };
  const input = (k: string, label: string, type = "text", required = false) => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>
        {label}
        {!required && <span className="text-muted-foreground"> (facultatif)</span>}
      </Label>
      <Input
        id={k}
        type={type}
        step={type === "number" ? "any" : undefined}
        value={f[k] ?? ""}
        onChange={(e) => setF({ ...f, [k]: e.target.value })}
        required={required}
      />
    </div>
  );
  const fields = (
    <div className="grid gap-4 sm:grid-cols-2">
      {input("merchant", "Site marchand ou expéditeur", "text", true)}
      {input("merchant_order_number", "N° de commande du marchand")}
      {input("carrier_tracking", "N° de suivi du transporteur")}
      {input("category", "Catégorie")}
      <div className="sm:col-span-2">
        {input("description", "Description du produit", "text", true)}
      </div>
      {input("quantity", "Quantité", "number", true)}
      {input("estimated_weight_lb", "Poids estimé (lb)", "number")}
      {f.estimated_weight_lb && (
        <div className="sm:col-span-2 border-l-2 border-primary pl-4 py-2" aria-live="polite">
          <p className="font-semibold">Transport estimé : {estimate == null ? "Tarif indisponible" : `${estimate.toFixed(2)} USD`}</p>
          {estimate != null && <p className="text-sm text-muted-foreground">{f.estimated_weight_lb} lb × {settings?.shipping_rate_per_lb} USD/lb</p>}
          <p className="text-sm text-muted-foreground">Montant provisoire, ajustable après vérification du poids. Les frais spéciaux éventuels sont ajoutés séparément.</p>
        </div>
      )}
      {input("declared_value", "Prix déclaré", "number")}
      <div className="space-y-1.5">
        <Label htmlFor="currency">Devise</Label>
        <select
          id="currency"
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={f["currency"]}
          onChange={(e) => setF({ ...f, currency: e.target.value })}
        >
          {["USD", "HTG", "EUR", "CAD"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">{input("destination", "Adresse de destination en Haïti")}</div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="instructions">
          Instructions supplémentaires <span className="text-muted-foreground">(facultatif)</span>
        </Label>
        <Textarea
          id="instructions"
          value={f["instructions"] ?? ""}
          onChange={(e) => setF({ ...f, instructions: e.target.value })}
          maxLength={500}
        />
      </div>
    </div>
  );
  return { fields, parse, estimate };
}
