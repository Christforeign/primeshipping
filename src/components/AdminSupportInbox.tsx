import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { listClients } from "@/lib/admin-settings";

type Msg = { id: string; user_id: string; sender: string; body: string; created_at: string };

export function AdminSupportInbox() {
  const qc = useQueryClient();
  const [sel, setSel] = useState<string | null>(null);
  const [text, setText] = useState("");
  const msgs = useQuery({
    queryKey: ["support-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("support_messages").select("*").order("created_at").limit(2000);
      if (error) throw error;
      return data as Msg[];
    },
  });
  const clients = useQuery({ queryKey: ["admin-client-list"], queryFn: listClients });
  useEffect(() => {
    const ch = supabase
      .channel("support-admin")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages" }, () =>
        qc.invalidateQueries({ queryKey: ["support-all"] }),
      )
      .subscribe();
    return () => void supabase.removeChannel(ch);
  }, [qc]);
  const threads = useMemo(() => {
    const m = new Map<string, Msg[]>();
    (msgs.data ?? []).forEach((x) => m.set(x.user_id, [...(m.get(x.user_id) ?? []), x]));
    return [...m.entries()].sort((a, b) => (b[1].at(-1)!.created_at > a[1].at(-1)!.created_at ? 1 : -1));
  }, [msgs.data]);
  const who = (id: string) => {
    const c = clients.data?.find((x) => x.id === id);
    return c ? `${c.client_code} · ${c.full_name || c.email}` : "Client";
  };
  const cur = threads.find((t) => t[0] === sel)?.[1] ?? [];
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sel || !text.trim()) return;
    const { error } = await supabase.from("support_messages").insert({ user_id: sel, sender: "staff", body: text.trim() });
    if (error) return void toast.error(error.message);
    setText("");
    qc.invalidateQueries({ queryKey: ["support-all"] });
  };
  return (
    <div className="rounded-2xl border bg-card grid md:grid-cols-[260px_minmax(0,1fr)] overflow-hidden min-h-[420px]">
      <div className="border-b md:border-b-0 md:border-r max-h-[420px] overflow-y-auto">
        {threads.length === 0 && <p className="p-4 text-xs text-muted-foreground">Aucun message client pour le moment.</p>}
        {threads.map(([uid, list]) => (
          <button key={uid} onClick={() => setSel(uid)} className={`w-full text-left p-3 border-b hover:bg-muted ${sel === uid ? "bg-muted" : ""}`}>
            <p className="text-xs font-bold truncate">{who(uid)}</p>
            <p className="text-[11px] text-muted-foreground truncate">{list.at(-1)?.body}</p>
          </button>
        ))}
      </div>
      <div className="flex flex-col p-3 min-w-0">
        {sel ? (
          <>
            <p className="text-sm font-bold border-b pb-2 truncate">{who(sel)}</p>
            <div className="flex-1 overflow-y-auto py-3 space-y-2 max-h-[320px]">
              {cur.map((m) => (
                <div key={m.id} className={`flex ${m.sender === "staff" ? "justify-end" : "justify-start"}`}>
                  <p className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs whitespace-pre-wrap break-words ${m.sender === "staff" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{m.body}</p>
                </div>
              ))}
            </div>
            <form onSubmit={send} className="flex gap-2 border-t pt-2">
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Votre réponse…" className="flex-1 min-w-0" />
              <Button type="submit" size="sm"><Send className="h-4 w-4" /></Button>
            </form>
          </>
        ) : (
          <p className="m-auto text-xs text-muted-foreground">Sélectionnez une conversation.</p>
        )}
      </div>
    </div>
  );
}
