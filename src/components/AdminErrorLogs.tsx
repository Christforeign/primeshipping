import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function AdminErrorLogs() {
  const q = useQuery({
    queryKey: ["app_error_logs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_error_logs").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data || [];
    },
  });
  const clear = async () => {
    const { error } = await supabase.from("app_error_logs").delete().lt("created_at", new Date().toISOString());
    if (error) toast.error(error.message); else { toast.success("Journal vidé"); void q.refetch(); }
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">Journal des erreurs</h2>
        <div className="flex gap-2"><Button variant="outline" onClick={() => q.refetch()}>Actualiser</Button><Button variant="destructive" onClick={clear}>Vider</Button></div>
      </div>
      <p className="text-sm text-muted-foreground">Les clients ne voient jamais ces erreurs ; elles sont enregistrées ici.</p>
      {q.isLoading ? <p>Chargement…</p> : q.isError ? <p className="text-destructive">Lecture impossible.</p> : !q.data?.length ? <p className="text-muted-foreground">Aucune erreur.</p> : (
        <ul className="space-y-2">
          {q.data.map((l) => (
            <li key={l.id} className="rounded-lg border border-border bg-card p-3 text-sm">
              <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><span className="font-semibold text-foreground">{l.source}</span><span>{new Date(l.created_at).toLocaleString("fr-FR")}</span></div>
              <p className="mt-1 break-words">{l.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
