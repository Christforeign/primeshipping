import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { Search, Package, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/StatusBadge";
import { canonicalStatus, PACKAGE_STATUSES, formatDate, statusLabel, type PackageStatus } from "@/lib/labels";
import { useUser } from "@/lib/session";

export const Route = createFileRoute("/suivi")({
  validateSearch: z.object({ n: z.string().max(40).optional() }),
  head: () => ({ meta: [
    { title: "Suivi de colis — Prime Shipping" },
    { name: "description", content: "Consultez le statut de votre colis Prime Shipping et sa prochaine étape." },
    { property: "og:title", content: "Suivi de colis — Prime Shipping" },
    { property: "og:description", content: "Les étapes de réception, transit et livraison de votre colis." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Suivi,
});

type TrackResult = {
  tracking_number: string; status: PackageStatus; updated_at: string; received_at: string | null;
  next_step: string; is_owner: boolean; description?: string; weight_lbs?: number | null;
  events?: { status: PackageStatus; note: string | null; created_at: string }[];
} | null;

function Suivi() {
  const { n } = Route.useSearch();
  const { user } = useUser();
  const [value, setValue] = useState(n ?? "");
  const navigate = useNavigate();
  const q = useQuery({
    queryKey: ["track", n, user?.id ?? "public"], enabled: Boolean(n),
    queryFn: async () => {
      if (!n) return null;
      const { data, error } = await supabase.rpc("track_package", { _tracking: n });
      if (error) throw error;
      return data as unknown as TrackResult;
    },
  });
  const result = q.data;
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold text-primary">Prime Shipping</p>
        <h1 className="text-3xl font-bold">Suivi de colis</h1>
        <form className="flex flex-wrap gap-2 pt-3" onSubmit={(e) => {
          e.preventDefault(); navigate({ to: "/suivi", search: { n: value.trim() || undefined } });
        }}>
          <Input aria-label="Numéro de suivi" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Numéro de suivi" maxLength={40} className="min-w-0 flex-1 basis-48" />
          <Button type="submit"><Search className="h-4 w-4" /> Rechercher</Button>
        </form>
      </header>
      {q.isFetching && <p className="text-muted-foreground">Recherche du colis…</p>}
      {q.isError && <div role="alert" className="space-y-3"><p>Le suivi est momentanément indisponible. Vérifiez votre connexion.</p><Button variant="outline" onClick={() => q.refetch()}>Réessayer</Button></div>}
      {n && q.isSuccess && !result && <div className="flex items-center gap-3 text-muted-foreground"><Package /> Aucun colis trouvé pour ce numéro.</div>}
      {result && <section className="space-y-6 border-t border-border pt-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2"><h2 className="break-all font-mono text-xl font-bold">{result.tracking_number}</h2>
            {result.is_owner && result.description && <p>{result.description}</p>}
            {result.is_owner && result.weight_lbs != null && <p className="text-sm text-muted-foreground">Poids : {result.weight_lbs} lb</p>}
          </div>
          <StatusBadge status={result.status} />
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          {result.received_at && <div><dt className="text-sm text-muted-foreground">Reçu le</dt><dd className="font-medium">{formatDate(result.received_at)}</dd></div>}
          <div><dt className="text-sm text-muted-foreground">Dernière mise à jour</dt><dd className="font-medium">{formatDate(result.updated_at)}</dd></div>
          <div><dt className="text-sm text-muted-foreground">Prochaine étape</dt><dd className="font-semibold text-primary">{result.next_step}</dd></div>
        </dl>
        {result.is_owner && <>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Étapes du colis">
            {PACKAGE_STATUSES.map((step, index) => <li key={step.value} className={`flex items-center gap-2 border-b py-3 text-sm ${canonicalStatus(result.status) === step.value ? "text-primary font-bold" : "text-muted-foreground"}`}>
              {canonicalStatus(result.status) === step.value ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <span>{index + 1}.</span>}{step.label}
            </li>)}
          </ol>
          <ol className="space-y-4 border-l-2 border-primary pl-5">
            {(result.events ?? []).map((event, index) => <li key={index}><p className="font-semibold">{statusLabel(event.status)}</p><p className="text-sm text-muted-foreground">{formatDate(event.created_at)}</p>{event.note && <p className="text-sm">{event.note}</p>}</li>)}
          </ol>
          <Button asChild variant="outline"><Link to="/compte/colis">Mes colis</Link></Button>
        </>}
      </section>}
    </div>
  );
}