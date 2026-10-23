import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/lib/settings";
import { type ClientHit } from "@/lib/admin-settings";
import { ClientPicker } from "@/components/ClientPicker";

export function AdminWalletAdjust() {
  const s = useSettings();
  const rate = Number(s?.usd_to_htg) || 132;
  const qc = useQueryClient();
  const [client, setClient] = useState<ClientHit | null>(null);
  const [op, setOp] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const wallet = useQuery({
    queryKey: ["admin-wallet", client?.id],
    enabled: !!client,
    queryFn: async () => {
      const { data, error } = await supabase.from("wallets").select("balance_usd").eq("user_id", client!.id).maybeSingle();
      if (error) throw error;
      return Number(data?.balance_usd ?? 0);
    },
  });

  const submit = async () => {
    const v = parseFloat(amount);
    if (!client || !(v > 0)) return void toast.error("Choisissez un client et un montant valide.");
    if (!reason.trim()) return void toast.error("Indiquez un motif.");
    setBusy(true);
    const { data, error } = await supabase.rpc("admin_adjust_wallet", {
      _user_id: client.id,
      _amount_usd: op === "credit" ? v : -v,
      _reason: reason.trim(),
    });
    setBusy(false);
    if (error) return void toast.error(error.message);
    toast.success(`Nouveau solde : ${Number(data).toFixed(2)} USD`);
    setAmount("");
    setReason("");
    qc.invalidateQueries({ queryKey: ["admin-wallet", client.id] });
  };

  const bal = wallet.data ?? 0;

  return (
    <div className="rounded-3xl border bg-card p-6 shadow-soft space-y-4">
      <h3 className="text-base font-bold text-forest flex items-center gap-2">
        <Wallet className="h-5 w-5 text-primary" /> Créditer / Débiter un portefeuille
      </h3>
      {!client && <ClientPicker onPick={setClient} />}
      {client && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-muted/50 p-4 flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0 break-words">
              <p className="font-bold">{client.full_name} <span className="font-mono text-primary">({client.client_code})</span></p>
              <p className="text-xs text-muted-foreground">{client.email}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black">{bal.toFixed(2)} USD</p>
              <p className="text-xs text-muted-foreground">≈ {Math.round(bal * rate).toLocaleString("fr-FR")} HTG</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setClient(null)}>Changer</Button>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Opération</Label>
              <select value={op} onChange={(e) => setOp(e.target.value as "credit" | "debit")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option value="credit">Créditer (+)</option>
                <option value="debit">Débiter (-)</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Montant (USD)</Label>
              <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Motif / Référence</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Rechargement MonCash reçu" />
            </div>
          </div>
          <Button onClick={submit} disabled={busy} className="rounded-2xl">
            {busy ? "Traitement…" : op === "credit" ? "Créditer le portefeuille" : "Débiter le portefeuille"}
          </Button>
        </div>
      )}
    </div>
  );
}
