import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Save, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/settings";
import { saveExtraSettings } from "@/lib/admin-settings";
import { uploadImage } from "@/lib/upload";
import { sendManualEmail } from "@/lib/admin-actions.functions";
import { absoluteAnnouncementImage, INITIAL_ANNOUNCEMENT, readAnnouncement, type SiteAnnouncement } from "@/lib/site-announcement";

export function AdminAnnouncement() {
  const settings = useSettings();
  const qc = useQueryClient();
  const send = useServerFn(sendManualEmail);
  const [draft, setDraft] = useState<SiteAnnouncement>(INITIAL_ANNOUNCEMENT);
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  useEffect(() => {
    if (!settings) return;
    const saved = readAnnouncement((settings as unknown as Record<string, unknown>).site_announcement);
    setDraft(saved || { ...INITIAL_ANNOUNCEMENT, enabled: false });
  }, [settings]);
  const change = (patch: Partial<SiteAnnouncement>) => { setDraft((d) => ({ ...d, ...patch })); setConfirmed(false); setEventId(null); };
  async function save(remove = false) {
    setBusy(true);
    try {
      await saveExtraSettings({ site_announcement: remove ? null : { ...draft, version: crypto.randomUUID() } });
      await qc.invalidateQueries({ queryKey: ["company_settings"] });
      if (remove) setDraft({ ...INITIAL_ANNOUNCEMENT, enabled: false, imageUrl: "", message: "", title: "" });
      setDeleteArmed(false);
      toast.success(remove ? "Annonce retirée du site" : "Annonce enregistrée");
    } catch { toast.error("Impossible d’enregistrer l’annonce"); } finally { setBusy(false); }
  }
  async function mail() {
    if (!confirmed) return;
    setBusy(true);
    const id = eventId || crypto.randomUUID(); setEventId(id);
    try {
      const result = await send({ data: { audience: "all", subject: draft.title, message: draft.message, imageUrl: draft.imageUrl ? absoluteAnnouncementImage(draft.imageUrl) : undefined, confirmed: true, eventId: id } });
      if (result.sent) toast.success(`${result.sent} e-mail(s) accepté(s) par Brevo`);
      if (result.failed || result.stopped) toast.warning("Envoi partiel : consulte le journal avant de réessayer.");
      if (!result.sent && !result.failed) toast.info("Aucune adresse disponible");
      if (!result.failed && !result.stopped) { setConfirmed(false); setEventId(null); }
    } catch { toast.error("Envoi impossible : consulte le journal des e-mails"); } finally { setBusy(false); }
  }
  const input = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
  return <section className="space-y-4 border-y border-border py-5">
    <h3 className="text-lg font-bold">Annonce photo du site et par e-mail</h3>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.enabled} disabled={busy} onChange={(e) => change({ enabled: e.target.checked })} />Afficher l’annonce à l’arrivée sur le site</label>
    <label className="block space-y-1 text-sm">Titre<input className={input} aria-label="Titre de l’annonce" maxLength={200} value={draft.title} disabled={busy} onChange={(e) => change({ title: e.target.value })} /></label>
    <label className="block space-y-1 text-sm">Texte<textarea className={input} aria-label="Texte de l’annonce" rows={8} maxLength={10000} value={draft.message} disabled={busy} onChange={(e) => change({ message: e.target.value })} /></label>
    {draft.imageUrl && <img src={draft.imageUrl} alt="Photo de l’annonce" className="max-h-72 max-w-full object-contain" />}
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline" disabled={busy}><label className="cursor-pointer"><ImagePlus className="h-4 w-4" />Changer la photo<input type="file" accept="image/*" aria-label="Photo de l’annonce" className="sr-only" disabled={busy} onChange={async (e) => {
        const file = e.target.files?.[0]; if (!file) return; const control = e.target; setBusy(true);
        try { change({ imageUrl: await uploadImage("announcements", file) }); } catch (error) { toast.error(error instanceof Error ? error.message : "Photo indisponible"); } finally { setBusy(false); control.value = ""; }
      }} /></label></Button>
      <Button variant="ghost" disabled={busy || !draft.imageUrl} onClick={() => change({ imageUrl: "" })}>Retirer la photo</Button>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm">Taille<select aria-label="Taille de l’annonce" className={input} value={draft.size} disabled={busy} onChange={(e) => change({ size: e.target.value as SiteAnnouncement["size"] })}><option value="compact">Compacte</option><option value="large">Grande</option></select></label>
      <label className="text-sm">Fréquence<select aria-label="Fréquence de l’annonce" className={input} value={draft.frequency} disabled={busy} onChange={(e) => change({ frequency: e.target.value as SiteAnnouncement["frequency"] })}><option value="session">Une fois par visite</option><option value="always">À chaque ouverture du site</option></select></label>
    </div>
    <div className="flex flex-wrap gap-2">
      <Button disabled={busy || !draft.title.trim() || (!draft.message.trim() && !draft.imageUrl)} onClick={() => save()}><Save className="h-4 w-4" />Enregistrer l’annonce</Button>
      <Button variant="destructive" disabled={busy} onClick={() => deleteArmed ? save(true) : setDeleteArmed(true)}><Trash2 className="h-4 w-4" />{deleteArmed ? "Confirmer le retrait complet" : "Retirer complètement"}</Button>
    </div>
    <label className="flex items-start gap-2 text-sm"><input type="checkbox" disabled={busy} checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />Je confirme l’envoi de cette photo et de ce texte à tous les comptes, administrateurs inclus.</label>
    <Button disabled={busy || !confirmed || !draft.title.trim() || !draft.message.trim()} onClick={mail}><Send className="h-4 w-4" />{busy ? "Veuillez patienter…" : "Envoyer à tous, administrateurs inclus"}</Button>
  </section>;
}