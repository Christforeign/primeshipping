import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteShopOrder } from "@/lib/admin-actions.functions";
import { Button } from "./ui/button";

export function OrderDeleteButton({ orderId }: { orderId: string }) {
  const remove = useServerFn(deleteShopOrder);
  const qc = useQueryClient();
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  async function go() {
    if (!armed) { setArmed(true); return; }
    setBusy(true);
    try {
      await remove({ data: { orderId } });
      await Promise.all([qc.invalidateQueries({ queryKey: ["admin-orders"] }), qc.invalidateQueries({ queryKey: ["my-orders"] })]);
      toast.success("Commande supprimée définitivement");
    } catch { toast.error("Suppression impossible. Réessaie après avoir vérifié ta connexion."); }
    finally { setBusy(false); setArmed(false); }
  }
  return <div className="flex flex-col gap-1">
    <Button variant="destructive" size="sm" disabled={busy} onClick={go}><Trash2 className="size-4" />{busy ? "Suppression…" : armed ? "Confirmer définitivement" : "Supprimer"}</Button>
    {armed && <><span className="max-w-56 text-xs text-muted-foreground">Aucun remboursement automatique. L’historique du portefeuille est conservé.</span><Button variant="ghost" size="sm" onClick={() => setArmed(false)}>Annuler</Button></>}
  </div>;
}