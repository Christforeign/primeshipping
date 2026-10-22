import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { usePackageFields } from "@/components/PackageForm";

export const Route = createFileRoute("/_authenticated/compte/colis/nouveau")({
  component: NewPackage,
});

function NewPackage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const { fields, parse } = usePackageFields();
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setBusy(true);
      const data = parse();
      const { data: row, error } = await supabase
        .from("packages")
        .insert({ ...data, user_id: user.id, status: "declare" })
        .select("id,tracking_number")
        .single();
      if (error) throw error;
      toast.success(`Colis déclaré : ${row.tracking_number}`);
      navigate({ to: "/compte/colis/$id", params: { id: row.id } });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Déclarer un colis"
        subtitle="Indiquez les informations de votre achat pour qu'on l'identifie à l'arrivée."
      />
      <form onSubmit={submit} className="rounded-2xl border bg-card p-6">
        {fields}
        <Button type="submit" className="mt-6" size="lg" disabled={busy}>
          {busy ? "Envoi…" : "Enregistrer le colis"}
        </Button>
      </form>
    </div>
  );
}
