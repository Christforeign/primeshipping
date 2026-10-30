import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { processPriorityImport } from "@/lib/priority.functions";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import type { MatchClient } from "@/lib/priority-parser";

export function PriorityInbox({ clients, onDone }: { clients: MatchClient[]; onDone: () => void }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Record<string,string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const inbox = useQuery({ queryKey: ["priority-inbox"], queryFn: async () => {
    const { data, error } = await supabase.from("priority_imports").select("*").order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    return data;
  } });
  const process = async (id: string, packageId: string | null) => {
    setBusy(id);
    try {
      const userId = selected[id];
      if (!packageId && !userId) throw new Error("Choisissez un client.");
      const result = await processPriorityImport({ data: { id, userId: packageId ? undefined : userId } });
      toast[result.sent ? "success" : "warning"](result.sent ? "Colis attribué et e-mail accepté." : "Colis enregistré ; e-mail non envoyé. Consultez les journaux.");
      await qc.invalidateQueries({ queryKey: ["priority-inbox"] }); onDone();
    } catch { toast.error("Impossible de traiter ce colis. Réessayez."); }
    finally { setBusy(null); }
  };
  return <section className="space-y-3 border-b border-border pb-5">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="font-semibold">Réception automatique Priority</h3>
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" size="icon" title="Actualiser les imports" aria-label="Actualiser les imports" onClick={() => inbox.refetch()}><RefreshCw className="h-4 w-4" /></Button>
      </div>
    </div>
    {inbox.isPending ? <p className="text-sm text-muted-foreground">Chargement…</p> : inbox.isError ? <p role="alert" className="text-sm text-destructive">La réception ne peut pas être consultée.</p> : !inbox.data?.length ? <p className="text-sm text-muted-foreground">Aucun e-mail importé.</p> :
      <div className="space-y-2">{inbox.data.map((row) => <div key={row.id} className="flex flex-col gap-2 border-t border-border py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 break-words text-sm"><p className="font-medium">{row.consignee || "Destinataire inconnu"}</p><p>{row.tracking} · {row.weight_lb ?? "?"} lb</p><p className="text-muted-foreground">{row.package_id ? row.email_sent ? "Importé · e-mail accepté" : "Importé · e-mail à vérifier" : "Pas encore attribué"}</p></div>
        {!row.package_id && <select aria-label={`Client pour ${row.tracking}`} className="h-10 min-w-0 max-w-full rounded-md border border-input bg-background px-2 text-sm" value={selected[row.id] || ""} onChange={(e) => setSelected({ ...selected, [row.id]:e.target.value })}><option value="">Choisir le client</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.full_name} — {c.client_code}</option>)}</select>}
        {(!row.package_id || !row.email_sent) && <Button size="sm" disabled={busy === row.id || (!row.package_id && !selected[row.id])} onClick={() => process(row.id,row.package_id)}>{busy === row.id ? "Traitement…" : row.package_id ? "Renvoyer l’e-mail" : "Attribuer"}</Button>}
      </div>)}</div>}
  </section>;
}