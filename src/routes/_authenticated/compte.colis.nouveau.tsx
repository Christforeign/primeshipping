import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { usePackageFields } from "@/components/PackageForm";
import { packageSubmissionError } from "@/lib/package-estimate";

export const Route = createFileRoute("/_authenticated/compte/colis/nouveau")({
  head: () => ({ meta: [
    { title: "Déclarer un colis — Prime Shipping" },
    { name: "description", content: "Déclarez votre achat et consultez son estimation de transport Prime Shipping." },
    { property: "og:title", content: "Déclarer un colis — Prime Shipping" },
    { property: "og:description", content: "Déclaration et estimation de transport de votre colis." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: NewPackage,
});

function NewPackage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const { fields, parse, estimate } = usePackageFields();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const submissionId = useRef<string | null>(null);
  const sending = useRef(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending.current) return;
    try {
      setFailure("");
      const data = parse();
      if (!navigator.onLine) throw new TypeError("Failed to fetch");
      sending.current = true;
      setBusy(true);
      submissionId.current ??= crypto.randomUUID();
      const { data: row, error } = await supabase
        .from("packages")
        .insert({ ...data, id: submissionId.current, shipping_fee: estimate, user_id: user.id, status: "declare" })
        .select("id,tracking_number")
        .single();
      // A lost response may hide a successful insert. The same ID makes a retry safe.
      let saved = row;
      if (error?.code === "23505") {
        const existing = await supabase.from("packages").select("id,tracking_number").eq("id", submissionId.current).single();
        if (existing.error) throw existing.error;
        saved = existing.data;
      } else if (error) throw error;
      if (!saved) throw new Error("La confirmation du colis est indisponible. Réessayez.");
      toast.success(`Colis déclaré : ${saved.tracking_number}`);
      navigate({ to: "/compte/colis/$id", params: { id: saved.id } });
    } catch (err) {
      setFailure(packageSubmissionError(err, navigator.onLine));
    } finally {
      sending.current = false;
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
        {failure && <p role="alert" className="mt-4 text-sm text-destructive">{failure}</p>}
        <Button type="submit" className="mt-6" size="lg" disabled={busy}>
          {busy ? "Envoi…" : failure ? "Réessayer l’enregistrement" : "Enregistrer le colis"}
        </Button>
      </form>
    </div>
  );
}
