// @ts-nocheck
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notifyPackageStatusChange } from "@/lib/push-notifications";
import { statusLabel } from "@/lib/labels";
import { useSettings } from "@/lib/settings";
import { sendClientEmail } from "@/lib/email.functions";

type Pkg = Record<string, any>;

export function AdminPackageEditDialog({
  pkg,
  userId,
  onClose,
  onSaved,
}: {
  pkg: Pkg | null;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState<Pkg>({});
  const [saving, setSaving] = useState(false);
  const st = useSettings();
  const ratePerLb = Number(st?.shipping_rate_per_lb) || 0;
  const autoFee = ratePerLb && Number(f.actual_weight_lb) ? +(ratePerLb * Number(f.actual_weight_lb)).toFixed(2) : null;
  const total = (Number(f.shipping_fee ?? autoFee) || 0) + (Number(f.extra_fees) || 0);

  useEffect(() => {
    if (pkg) setF({ ...pkg });
  }, [pkg]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  const num = (v: any) => (v === "" || v == null ? null : Number(v));

  const save = async (validate: boolean) => {
    if (!pkg) return;
    if (!String(f.description ?? "").trim()) return toast.error("La description est obligatoire.");
    setSaving(true);
    const { error } = await supabase
      .from("packages")
      .update({
        description: String(f.description).trim(),
        merchant: String(f.merchant ?? "").trim() || pkg.merchant,
        carrier_tracking: f.carrier_tracking || null,
        quantity: Number(f.quantity) || 1,
        actual_weight_lb: num(f.actual_weight_lb),
        shipping_fee: num(f.shipping_fee) ?? autoFee,
        extra_fees: num(f.extra_fees),
        declared_value: num(f.declared_value),
        internal_notes: f.internal_notes || null,
        ...(validate ? { received_at: new Date().toISOString() } : {}),
      })
      .eq("id", pkg.id);
    if (error) {
      setSaving(false);
      return toast.error(error.message);
    }
    if (validate && pkg.status !== "recu_entrepot") {
      const { error: e2 } = await supabase.from("package_events").insert({
        package_id: pkg.id,
        status: "recu_entrepot",
        note: statusLabel("recu_entrepot"),
        created_by: userId,
      });
      if (e2) toast.error(e2.message);
      else {
        notifyPackageStatusChange(pkg.tracking_number, statusLabel("recu_entrepot"), {
          userId: pkg.user_id,
          description: f.description,
        });
        try {
          const result = await sendClientEmail({ data: { kind: "colis_recu", packageId: pkg.id } });
          if (!result.sent) toast.warning(`Colis validé. E-mail non envoyé : ${result.reason}`);
        } catch (e) { toast.error(e instanceof Error ? e.message : "E-mail non envoyé"); }
      }
    }
    setSaving(false);
    toast.success(validate ? "Colis validé — client notifié" : "Colis mis à jour");
    onSaved();
    onClose();
  };

  return (
    <Dialog open={!!pkg} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Traiter le colis {pkg?.tracking_number}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs">Description</Label>
            <Input value={f.description ?? ""} onChange={set("description")} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Marchand</Label>
            <Input value={f.merchant ?? ""} onChange={set("merchant")} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tracking transporteur</Label>
            <Input value={f.carrier_tracking ?? ""} onChange={set("carrier_tracking")} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Poids réel (lbs)</Label>
            <Input type="number" step="0.01" value={f.actual_weight_lb ?? ""} onChange={set("actual_weight_lb")} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Quantité</Label>
            <Input type="number" value={f.quantity ?? 1} onChange={set("quantity")} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Frais de transport (USD) — {ratePerLb ? `${ratePerLb} $/lb` : "tarif non défini"}</Label>
            <Input type="number" step="0.01" value={f.shipping_fee ?? ""} placeholder={autoFee != null ? `Auto : ${autoFee}` : ""} onChange={set("shipping_fee")} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Frais spéciaux (haut de gamme, douane…) USD</Label>
            <Input type="number" step="0.01" value={f.extra_fees ?? ""} onChange={set("extra_fees")} />
          </div>
          <div className="sm:col-span-2 rounded-lg bg-muted px-3 py-2 text-sm font-semibold">Total à payer : {total.toFixed(2)} USD</div>
          <div className="space-y-1">
            <Label className="text-xs">Valeur déclarée (USD)</Label>
            <Input type="number" step="0.01" value={f.declared_value ?? ""} onChange={set("declared_value")} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Note interne</Label>
            <Input value={f.internal_notes ?? ""} onChange={set("internal_notes")} />
          </div>
        </div>
        <DialogFooter className="gap-2 flex-col sm:flex-row">
          <Button variant="outline" disabled={saving} onClick={() => save(false)}>
            Enregistrer
          </Button>
          {pkg?.status === "declare" || pkg?.status === "attente_reception" ? (
            <Button disabled={saving} onClick={() => save(true)}>
              Valider : reçu à l'entrepôt
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
