import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { defaultShippingNotices } from "@/lib/shipping-notices";
import { saveShippingNoticeSettings } from "@/lib/shipping-notices.functions";

export function ShippingNoticeSettings() {
  const qc = useQueryClient();
  const save = useServerFn(saveShippingNoticeSettings);
  const [draft, setDraft] = useState<typeof defaultShippingNotices | null>(null);
  const [busy, setBusy] = useState(false);
  const q = useQuery({ queryKey: ["shipping-notice-settings"], queryFn: async () => {
    const { data, error } = await supabase.from("shipping_notice_settings").select("*").eq("id", 1).maybeSingle();
    if (error) throw error;
    return data || defaultShippingNotices;
  } });
  const value = draft || q.data || defaultShippingNotices;
  const set = (patch: Partial<typeof defaultShippingNotices>) => setDraft({ ...value, ...patch });
  return <section className="space-y-4 border-b border-border py-5">
    <h3 className="font-semibold">Annonces et rappels colis</h3>
    {q.isError && <p role="alert" className="text-destructive">Réglages momentanément indisponibles.</p>}
    <div className="grid gap-4 sm:grid-cols-2">
      {([ ["arrivals_enabled", "Annonce des nouvelles réceptions"], ["reminders_enabled", "Rappels de déclaration"], ["email_enabled", "Envoyer aussi par e-mail"] ] as const).map(([key, text]) => <div key={key} className="flex items-center justify-between gap-3"><Label htmlFor={key}>{text}</Label><Switch id={key} checked={value[key]} disabled={q.isPending || q.isError} onCheckedChange={(checked) => set({ [key]: checked })} /></div>)}
      <div className="space-y-2"><Label htmlFor="reminder-days">Intervalle des rappels (jours)</Label><Input id="reminder-days" type="number" min={1} max={30} value={value.reminder_days} onChange={(e) => set({ reminder_days: Number(e.target.value) })} /></div>
      <div className="space-y-2"><Label htmlFor="notice-limit">Maximum d’e-mails généraux par jour (0–100)</Label><Input id="notice-limit" type="number" min={0} max={100} value={value.email_daily_limit} onChange={(e) => set({ email_daily_limit: Number(e.target.value) })} /></div>
    </div>
    <Button disabled={busy || q.isPending || q.isError} onClick={async () => {
      setBusy(true);
      try { await save({ data: value }); await qc.invalidateQueries({ queryKey: ["shipping-notice-settings"] }); setDraft(null); toast.success("Annonces et rappels enregistrés."); }
      catch { toast.error("Impossible d’enregistrer. Vérifiez les valeurs."); }
      finally { setBusy(false); }
    }}><Save className="h-4 w-4" />{busy ? "Enregistrement…" : "Enregistrer les annonces"}</Button>
  </section>;
}