import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Save, MessageCircle, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/lib/settings";
import { saveExtraSettings } from "@/lib/admin-settings";
import type { WhatsAppSupportContact } from "@/lib/types-store";

export function AdminWhatsAppContacts() {
  const s = useSettings() as Record<string, any> | null;
  const qc = useQueryClient();
  const [list, setList] = useState<WhatsAppSupportContact[]>([]);
  const [hero, setHero] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!s) return;
    setList(Array.isArray(s.whatsapp_support_contacts) ? s.whatsapp_support_contacts : []);
    setHero(s.hero_image_url || "");
  }, [s?.updated_at]);

  const update = (id: string, k: keyof WhatsAppSupportContact, v: string | boolean) =>
    setList((l) => l.map((c) => (c.id === id ? { ...c, [k]: v } : c)));

  const save = async () => {
    const bad = list.find((c) => c.phone.replace(/\D/g, "").length < 8 || !c.name.trim());
    if (bad) return toast.error("Chaque contact doit avoir un nom et un numéro international valide.");
    setBusy(true);
    try {
      await saveExtraSettings({
        whatsapp_support_contacts: list.map((c) => ({ ...c, phone: c.phone.replace(/\D/g, "") })),
        hero_image_url: hero.trim(),
      });
      qc.invalidateQueries({ queryKey: ["company_settings"] });
      toast.success("Contacts et image d'accueil enregistrés.");
    } catch (e: any) {
      toast.error("Échec : " + (e?.message || "erreur"));
    }
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-card p-6 shadow-soft space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-bold text-forest flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" /> Contacts WhatsApp
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setList((l) => [
                ...l,
                { id: `wa-${Date.now()}`, name: "", phone: "", availability: "", prefilled_message: "", is_active: true },
              ])
            }
          >
            <Plus className="h-4 w-4 mr-1" /> Ajouter un numéro
          </Button>
        </div>
        {list.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Aucun numéro configuré : le bouton WhatsApp reste masqué sur le site.
          </p>
        )}
        {list.map((c) => (
          <div key={c.id} className="grid gap-3 sm:grid-cols-2 rounded-2xl border p-4">
            <div className="space-y-1">
              <Label className="text-xs">Nom de l'agent / service</Label>
              <Input value={c.name} onChange={(e) => update(c.id, "name", e.target.value)} placeholder="Service Colis" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Numéro WhatsApp international</Label>
              <Input value={c.phone} onChange={(e) => update(c.id, "phone", e.target.value)} placeholder="509XXXXXXXX" inputMode="numeric" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Disponibilité</Label>
              <Input value={c.availability || ""} onChange={(e) => update(c.id, "availability", e.target.value)} placeholder="Lun–Sam, 8h–17h" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Message prérempli</Label>
              <Input value={c.prefilled_message || ""} onChange={(e) => update(c.id, "prefilled_message", e.target.value)} />
            </div>
            <div className="sm:col-span-2 flex items-center justify-between">
              <label className="text-xs flex items-center gap-2">
                <input type="checkbox" checked={c.is_active !== false} onChange={(e) => update(c.id, "is_active", e.target.checked)} />
                Actif
              </label>
              <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setList((l) => l.filter((x) => x.id !== c.id))}>
                <Trash2 className="h-4 w-4 mr-1" /> Supprimer
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border bg-card p-6 shadow-soft space-y-3">
        <h3 className="text-base font-bold text-forest flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" /> Image de couverture de l'accueil
        </h3>
        <Input value={hero} onChange={(e) => setHero(e.target.value)} placeholder="https://…/banniere.jpg" />
        {hero && (
          <img src={hero} alt="Aperçu de la bannière" className="w-full max-h-56 object-cover rounded-xl border" />
        )}
        <p className="text-xs text-muted-foreground">Laissez vide pour utiliser l'image par défaut.</p>
      </div>

      <Button onClick={save} disabled={busy} className="rounded-2xl">
        <Save className="h-4 w-4 mr-1" /> {busy ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </div>
  );
}
