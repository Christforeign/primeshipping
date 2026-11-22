import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Save, Snowflake } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/settings";
import { saveExtraSettings } from "@/lib/admin-settings";
import { DEFAULT_FESTIVE_THEME, readFestiveTheme, type FestiveTheme } from "@/lib/festive-theme";

export function FestiveThemeSettings() {
  const settings = useSettings();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<FestiveTheme>(DEFAULT_FESTIVE_THEME);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (settings) setDraft(readFestiveTheme((settings as unknown as Record<string, unknown>)["festive_theme"]));
  }, [settings]);
  const change = (patch: Partial<FestiveTheme>) => setDraft((d) => ({ ...d, ...patch }));
  async function save(next: FestiveTheme, introChanged: boolean) {
    setBusy(true);
    try {
      const value = introChanged ? { ...next, version: `noel-2026-${Date.now()}` } : next;
      await saveExtraSettings({ festive_theme: value });
      await qc.invalidateQueries({ queryKey: ["company_settings"] });
      setDraft(value);
      toast.success(value.enabled ? "Thème des fêtes enregistré" : "Design classique rétabli");
    } catch { toast.error("Impossible d’enregistrer le thème des fêtes"); } finally { setBusy(false); }
  }
  const input = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
  const toggle = (key: "ticker" | "snow" | "intro", label: string) => (
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft[key]} disabled={busy || !draft.enabled} onChange={(e) => change({ [key]: e.target.checked })} />{label}</label>
  );
  return (
    <section className="rounded-3xl border bg-card p-6 shadow-soft space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-bold flex items-center gap-2"><Snowflake className="h-5 w-5 text-primary" />Thème des Fêtes (Noël 2026 & Nouvel An 2027)</h3>
        <Button type="button" variant={draft.enabled ? "outline" : "default"} disabled={busy} onClick={() => save({ ...draft, enabled: !draft.enabled }, false)}>
          {draft.enabled ? "Désactiver (design classique)" : "Activer le thème des fêtes"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Statut : <strong>{draft.enabled ? "Activé" : "Désactivé"}</strong>. Les décorations ne bloquent aucun clic et disparaissent toutes quand le thème est désactivé.</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {toggle("ticker", "Message défilant")}
        {toggle("snow", "Flocons légers")}
        {toggle("intro", "Animation d’ouverture")}
      </div>
      <label className="block space-y-1 text-sm">Message défilant<textarea className={input} rows={3} maxLength={400} value={draft.tickerText} disabled={busy} onChange={(e) => change({ tickerText: e.target.value })} /></label>
      <label className="block space-y-1 text-sm">Texte de l’animation d’ouverture<textarea className={input} rows={2} maxLength={300} value={draft.introText} disabled={busy} onChange={(e) => change({ introText: e.target.value })} /></label>
      <Button type="button" disabled={busy} onClick={() => save(draft, true)}><Save className="h-4 w-4" />Enregistrer le thème</Button>
    </section>
  );
}
