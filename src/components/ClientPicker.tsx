import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { listClients, type ClientHit } from "@/lib/admin-settings";

export function ClientPicker({ onPick }: { onPick: (c: ClientHit) => void }) {
  const [term, setTerm] = useState("");
  const q = useQuery({ queryKey: ["admin-client-list"], queryFn: listClients });
  const list = useMemo(() => {
    const t = term.trim().toLowerCase();
    const all = q.data ?? [];
    return t ? all.filter((c) => `${c.client_code} ${c.full_name} ${c.email ?? ""} ${c.phone ?? ""}`.toLowerCase().includes(t)) : all;
  }, [q.data, term]);
  return (
    <div className="space-y-2 min-w-0">
      <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Filtrer : nom, e-mail, téléphone ou PS-XXXX" />
      <div className="max-h-64 overflow-y-auto rounded-lg border divide-y">
        {q.isLoading && <p className="p-3 text-xs text-muted-foreground">Chargement des clients…</p>}
        {q.error && <p className="p-3 text-xs text-destructive">{(q.error as Error).message}</p>}
        {!q.isLoading && list.length === 0 && <p className="p-3 text-xs text-muted-foreground">Aucun client inscrit trouvé.</p>}
        {list.map((c) => (
          <button key={c.id} type="button" onClick={() => onPick(c)} className="w-full text-left text-sm p-2.5 hover:bg-muted flex flex-wrap gap-x-2 min-w-0">
            <span className="font-mono font-bold text-primary shrink-0">{c.client_code}</span>
            <span className="font-semibold truncate">{c.full_name || "—"}</span>
            <span className="text-xs text-muted-foreground truncate w-full">{c.email}{c.phone ? ` · ${c.phone}` : ""}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
