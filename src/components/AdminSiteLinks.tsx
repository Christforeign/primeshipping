import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { useSettings } from "@/lib/settings";
import { saveExtraSettings } from "@/lib/admin-settings";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { SiteSocialLink, SocialIconName } from "@/lib/social-links";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type SocialLink = SiteSocialLink & { id: string };
export type Corridor = { id: string; label: string; enabled: boolean };

const DEFAULT_SOCIALS: SocialLink[] = [
  "Chaîne WhatsApp", "Groupe WhatsApp", "Instagram", "Facebook", "TikTok",
].map((label, i) => ({ id: `s${i}`, label, url: "", enabled: false }));

const uid = () => Math.random().toString(36).slice(2, 9);

export function AdminSiteLinks() {
  const s = useSettings() as unknown as Record<string, unknown> | null;
  const qc = useQueryClient();
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [corridors, setCorridors] = useState<Corridor[]>([]);
  const [zones, setZones] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!s || loaded) return;
    setSocials(Array.isArray(s["social_links"]) && s["social_links"].length ? (s["social_links"] as SocialLink[]) : DEFAULT_SOCIALS);
    setCorridors(Array.isArray(s["corridors"]) ? (s["corridors"] as Corridor[]) : []);
    setZones(String(s["delivery_zones"] || ""));
    setLoaded(true);
  }, [s, loaded]);

  const save = async () => {
    setSaving(true);
    try {
      await saveExtraSettings({ social_links: socials, corridors });
      const { error } = await supabase.from("company_settings").update({ delivery_zones: zones.trim() || null }).eq("id", 1);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["company_settings"] });
      toast.success("Enregistré");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 min-w-0">
      <section className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="font-bold">Réseaux sociaux & canaux</h3>
        {socials.map((l, i) => (
          <div key={l.id} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[9rem_minmax(0,1fr)_8rem_auto_auto] items-center">
            <Input value={l.label} onChange={(e) => setSocials(socials.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder="Nom" />
            <Input value={l.url} onChange={(e) => setSocials(socials.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} placeholder="https://..." />
            <Select value={l.icon || "auto"} onValueChange={(icon) => setSocials(socials.map((x, j) => j === i ? { ...x, icon: icon as SocialIconName } : x))}>
              <SelectTrigger aria-label={`Icône ${l.label || "du lien"}`}><SelectValue /></SelectTrigger>
              <SelectContent>{[["auto", "Automatique"], ["whatsapp", "WhatsApp"], ["facebook", "Facebook"], ["instagram", "Instagram"], ["mail", "E-mail"], ["phone", "Téléphone"], ["link", "Lien"]].map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
            </Select>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={l.enabled} onCheckedChange={(v) => setSocials(socials.map((x, j) => (j === i ? { ...x, enabled: v } : x)))} />
              {l.enabled ? "Visible" : "Caché"}
            </label>
            <Button variant="ghost" size="icon" aria-label="Supprimer" onClick={() => setSocials(socials.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => setSocials([...socials, { id: uid(), label: "", url: "", enabled: true }])}><Plus className="h-4 w-4 mr-1" />Ajouter un lien</Button>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="font-bold">Corridors de fret</h3>
        {corridors.map((c, i) => (
          <div key={c.id} className="flex gap-2 items-center">
            <Input value={c.label} onChange={(e) => setCorridors(corridors.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder="Ex : USA → Haïti" />
            <Switch checked={c.enabled} onCheckedChange={(v) => setCorridors(corridors.map((x, j) => (j === i ? { ...x, enabled: v } : x)))} />
            <Button variant="ghost" size="icon" aria-label="Supprimer" onClick={() => setCorridors(corridors.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => setCorridors([...corridors, { id: uid(), label: "", enabled: true }])}><Plus className="h-4 w-4 mr-1" />Ajouter un corridor</Button>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 space-y-2">
        <h3 className="font-bold">Zones / villes desservies</h3>
        <Textarea value={zones} onChange={(e) => setZones(e.target.value)} placeholder="Une ville par ligne ou séparées par des virgules" rows={4} />
      </section>

      <Button onClick={save} disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</Button>
    </div>
  );
}
