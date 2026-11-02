import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Package, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { readReceivedParcels } from "@/lib/received-parcels";
import { formatDate } from "@/lib/labels";
import { Button } from "@/components/ui/button";

export function ReceivedParcels({ onSelect, selected = [] }: { onSelect?: (suffix: string) => void; selected?: string[] }) {
  const [offset, setOffset] = useState(0);
  const query = useQuery({ queryKey: ["public-received-parcels", offset], staleTime: 30_000, queryFn: async () => {
    const { data, error } = await supabase.rpc("public_received_parcels", { p_offset: offset });
    if (error) throw error;
    return readReceivedParcels(data);
  } });
  return <section className="space-y-4 border-t border-border pt-6" id="colis-recus">
    <h2 className="text-xl font-bold">C’est ton colis ?</h2>
    <p className="text-sm text-muted-foreground">Colis reçus — la disponibilité pour le retrait sera confirmée séparément.</p>
    {!onSelect && <Button asChild variant="outline"><Link to="/compte/colis/nouveau">Déclarer mon tracking complet</Link></Button>}
    {query.isPending && <p role="status" className="text-muted-foreground">Chargement des réceptions…</p>}
    {query.isError && <div role="alert"><p>La liste des réceptions est momentanément indisponible.</p><Button variant="outline" onClick={() => query.refetch()}>Réessayer</Button></div>}
    {query.data && <>
      {query.data.items.length === 0 && <p className="text-muted-foreground">Aucun colis reçu à afficher.</p>}
      <ul className="divide-y divide-border">
        {query.data.items.map((item, index) => <li key={`${offset}-${index}`} className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex min-w-0 items-center gap-3"><Package className="h-5 w-5 shrink-0 text-primary" /><div className="min-w-0"><p className="font-mono font-semibold">•••••{item.suffix}</p><p className="text-sm text-muted-foreground">{item.carrier}</p></div></div>
          <div className="flex flex-wrap items-center gap-3"><span className="text-sm text-muted-foreground">{item.received_at ? formatDate(item.received_at) : "Reçu"}</span>{onSelect && <Button variant={selected.includes(item.suffix) ? "default" : "outline"} aria-pressed={selected.includes(item.suffix)} onClick={() => onSelect(item.suffix)}>{selected.includes(item.suffix) ? "Sélectionné" : "Sélectionner"} {item.suffix}</Button>}</div>
        </li>)}
      </ul>
      {query.data.total > 50 && <nav aria-label="Pages des colis reçus" className="flex items-center justify-between gap-3"><Button variant="outline" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 50))}><ChevronLeft className="h-4 w-4" />Précédent</Button><span className="text-sm">{offset + 1}–{Math.min(offset + 50, query.data.total)} / {query.data.total}</span><Button variant="outline" disabled={offset + 50 >= query.data.total} onClick={() => setOffset(offset + 50)}>Suivant<ChevronRight className="h-4 w-4" /></Button></nav>}
    </>}
  </section>;
}