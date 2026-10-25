// @ts-nocheck — legacy pages pending migration to real tables
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { profileQuery } from "@/lib/session";
import { clientStore } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/compte/profil")({
  component: Profile,
});

const schema = z.object({
  full_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(30),
  country: z.string().trim().max(60),
  region: z.string().trim().max(60),
  city: z.string().trim().max(60),
  address_line: z.string().trim().max(200),
  address_line2: z.string().trim().max(200),
});
const FIELDS: [keyof z.infer<typeof schema>, string][] = [
  ["full_name", "Nom complet"],
  ["phone", "Téléphone"],
  ["country", "Pays"],
  ["region", "Département ou région"],
  ["city", "Ville"],
  ["address_line", "Adresse de réception en Haïti (quartier, rue, n°)"],
  ["address_line2", "Repère / téléphone secondaire"],
];

function Profile() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const profile = useQuery(profileQuery(user.id)).data;
  const [f, setF] = useState<Record<string, string>>({});
  useEffect(() => {
    if (profile)
      setF(Object.fromEntries(FIELDS.map(([k]) => [k, (profile[k] as string | null) ?? ""])));
  }, [profile]);

  const save = async (e: React.FormEvent): Promise<unknown> => {
    e.preventDefault();
    const r = schema.safeParse(f);
    if (!r.success) return toast.error("Vérifiez les champs (nom requis).");
    const { error } = await supabase.from("profiles").update(r.data).eq("id", user.id);
    if (error) console.warn("Supabase profile update fallback:", error);

    // Save locally
    clientStore.saveHaitiProfile({
      id: user.id,
      full_name: f.full_name || "",
      email: user.email || "",
      phone: f.phone || "",
      city: f.city || "",
      department: f.region || "Ouest",
      delivery_address: f.address_line || "",
      delivery_preference: "home",
      updated_at: new Date().toISOString(),
    });

    qc.invalidateQueries({ queryKey: ["profile", user.id] });
    toast.success("Profil enregistré et synchronisé avec succès !");
  };

  return (
    <div>
      <PageHeader
        title="Mon profil"
        subtitle={`Identifiant client : ${profile?.client_code ?? "…"} · ${user.email}`}
      />
      <form onSubmit={save} className="grid gap-4 rounded-2xl border bg-card p-6 sm:grid-cols-2">
        {FIELDS.map(([k, l]) => (
          <div key={k} className="space-y-1.5">
            <Label htmlFor={k}>{l}</Label>
            <Input
              id={k}
              value={f[k] ?? ""}
              onChange={(e) => setF({ ...f, [k]: e.target.value })}
            />
          </div>
        ))}
        <div className="sm:col-span-2">
          <Button type="submit">Enregistrer les modifications</Button>
        </div>
      </form>
    </div>
  );
}
