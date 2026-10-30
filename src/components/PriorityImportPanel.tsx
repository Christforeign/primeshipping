// @ts-nocheck
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendClientEmail } from "@/lib/email.functions";
import { parsePriorityEmails, matchClient, type PriorityItem } from "@/lib/priority-parser";
import { Mail } from "lucide-react";
import { PriorityInbox } from "./PriorityInbox";

type Row = PriorityItem & { userId: string };

export function PriorityImportPanel({ clients, ratePerLb, adminId, onDone }: {
  clients: any[]; ratePerLb: number; adminId: string; onDone: () => void;
}) {
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);

  const analyse = async () => {
    const items = parsePriorityEmails(text);
    if (!items.length) return toast.error("Aucun colis Priority trouvé dans ce texte.");
    const { data: existing } = await supabase.from("packages").select("carrier_tracking").in("carrier_tracking", items.map((i) => i.tracking));
    const known = new Set((existing ?? []).map((e) => e.carrier_tracking));
    const fresh = items.filter((i) => !known.has(i.tracking));
    if (fresh.length < items.length) toast.info(`${items.length - fresh.length} colis déjà enregistré(s) ignoré(s).`);
    setRows(fresh.map((i) => ({ ...i, userId: matchClient(i.consignee, clients) ?? "" })));
  };

  const save = async () => {
    const ready = rows.filter((r) => r.userId);
    if (!ready.length) return toast.error("Choisissez un client pour au moins un colis.");
    setBusy(true);
    const { data, error } = await supabase.from("packages").insert(ready.map((r) => ({
      user_id: r.userId,
      merchant: "Priority Courier",
      description: r.content || "Colis",
      carrier_tracking: r.tracking,
      merchant_order_number: r.reception || null,
      actual_weight_lb: r.weightLb,
      shipping_fee: r.weightLb ? Number((r.weightLb * ratePerLb).toFixed(2)) : null,
      destination: "Haïti",
      quantity: 1,
      status: "recu_entrepot",
      internal_notes: `Import Priority — destinataire : ${r.consignee}`,
      created_by: adminId,
    }))).select("id");
    setBusy(false);
    if (error) return toast.error("Enregistrement impossible : " + error.message);
    for (const p of data ?? []) {
      try { await sendClientEmail({ data: { kind: "colis_recu", packageId: p.id } }); } catch { /* logged server-side */ }
    }
    toast.success(`${data?.length ?? 0} colis enregistrés.`);
    setRows(rows.filter((r) => !r.userId));
    if (rows.every((r) => r.userId)) setText("");
    onDone();
  };

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs">
      <PriorityInbox clients={clients} onDone={onDone} />
      <div>
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> Import Priority Courier</h2>
        <p className="text-xs text-muted-foreground">Collez un ou plusieurs e-mails « Notificación de Recepción ». Les clients sont reconnus par code PS ou par nom ; les doutes restent à attribuer.</p>
      </div>
      <Textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder={"Consignatario: ...\nTracking: ...\nRecepción: ...\nContenido: ...\nPeso: 0.20 LBS"} />
      <Button type="button" variant="outline" onClick={analyse} disabled={!text.trim()}>Analyser</Button>
      {rows.length > 0 && (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={r.tracking} className="grid gap-2 rounded-lg border border-border p-3 text-xs sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="min-w-0 break-words">
                <p className="font-bold">{r.consignee || "Destinataire inconnu"}</p>
                <p className="text-muted-foreground">{r.tracking} · {r.content} · {r.weightLb ?? "?"} lb</p>
              </div>
              <select className="h-9 rounded-md border border-input bg-background px-2 text-xs max-w-full"
                value={r.userId}
                onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, userId: e.target.value } : x)))}>
                <option value="">À identifier (laisser en stock)</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name} — {c.client_code}</option>)}
              </select>
            </div>
          ))}
          <Button type="button" onClick={save} disabled={busy}>{busy ? "Enregistrement…" : `Enregistrer ${rows.filter((r) => r.userId).length} colis`}</Button>
        </div>
      )}
    </div>
  );
}
