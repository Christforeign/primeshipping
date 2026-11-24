import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Sparkles, Upload, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage } from "@/lib/upload";
import { analyzeProductImage } from "@/lib/bulk-products.functions";

type Row = { key: string; image: string; title: string; short_description: string; description: string; category: string; group: string; price: string; status: "lecture" | "pret" | "erreur" };

export function BulkProductImport({ categories }: { categories: string[] }) {
  const qc = useQueryClient();
  const analyze = useServerFn(analyzeProductImage);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [currency, setCurrency] = useState<"HTG" | "USD">("HTG");
  const [bulkPrice, setBulkPrice] = useState("");
  const [groupSame, setGroupSame] = useState(false);
  const [busy, setBusy] = useState(false);
  const cats = categories.length ? categories : ["Chaussures", "Vêtements", "Accessoires"];
  const update = (key: string, patch: Partial<Row>) => setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, 40);
    for (const file of list) {
      const key = crypto.randomUUID();
      setRows((r) => [...r, { key, image: URL.createObjectURL(file), title: file.name, short_description: "", description: "", category: cats[0]!, group: "", price: bulkPrice, status: "lecture" }]);
      try {
        const url = await uploadImage("products", file);
        update(key, { image: url });
        const res = await analyze({ data: { imageUrl: url, categories: cats } });
        if (res.ok) update(key, { ...res.suggestion, status: "pret" });
        else { update(key, { status: "erreur", title: "" }); toast.error(res.error); }
      } catch (e) {
        update(key, { status: "erreur" });
        toast.error(e instanceof Error ? e.message : "Échec de l'envoi");
      }
    }
  };

  const publish = async () => {
    const ready = rows.filter((r) => r.status !== "lecture" && r.image.startsWith("https://") && r.title.trim());
    if (!ready.length) { toast.error("Aucun produit prêt."); return; }
    if (ready.some((r) => !(Number(r.price) > 0))) { toast.error("Mets un prix à chaque produit."); return; }
    setBusy(true);
    try {
      const base = { kind: "physique", apply_tax: false, requires_shipping_address: true, delivery_options: "both", custom_fields: [] as never, is_active: true };
      const items: Record<string, unknown>[] = [];
      if (groupSame) {
        const groups = new Map<string, Row[]>();
        for (const r of ready) { const g = (r.group || r.title).trim().toLowerCase(); groups.set(g, [...(groups.get(g) || []), r]); }
        let i = 0;
        for (const g of groups.values()) {
          const first = g[0]!;
          const prices = g.map((r) => Number(r.price));
          items.push({ ...base, id: `prod-${Date.now()}-${i++}`, title: g.length > 1 ? first.group || first.title : first.title, short_description: first.short_description, description: first.description, category: first.category, price_usd: Math.min(...prices), media_urls: g.map((r) => r.image),
            variants: g.length > 1 ? g.map((r, j) => ({ id: `v-${j}`, name: r.title, price_usd: Number(r.price), image_url: r.image })) : [],
            extra: { price_currency: currency } });
        }
      } else {
        ready.forEach((r, i) => items.push({ ...base, id: `prod-${Date.now()}-${i}`, title: r.title.trim(), short_description: r.short_description, description: r.description, category: r.category, price_usd: Number(r.price), media_urls: [r.image], variants: [], extra: { price_currency: currency } }));
      }
      const { error } = await supabase.from("products").insert(items as never);
      if (error) throw new Error(error.message);
      toast.success(`${items.length} produit(s) publiés dans la boutique !`);
      setRows([]); setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products-list"] });
    } catch (e) {
      toast.error("Publication impossible : " + (e instanceof Error ? e.message : ""));
    } finally { setBusy(false); }
  };

  if (!open) return <Button size="sm" variant="outline" className="rounded-full font-bold" onClick={() => setOpen(true)}><Sparkles className="h-4 w-4 mr-1.5" /> Ajout groupé avec IA</Button>;

  return (
    <div className="w-full rounded-2xl border bg-card p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="font-bold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Ajout groupé avec IA</h4>
          <p className="text-xs text-muted-foreground">1. Choisis tes photos · 2. L'IA écrit nom, description et catégorie · 3. Mets les prix · 4. Publie. Tout reste modifiable après.</p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => { setOpen(false); setRows([]); }}>Fermer</Button>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
          <Upload className="h-4 w-4" /> Choisir les photos
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
        </label>
        <div className="flex items-center gap-2">
          <select className="h-9 rounded-md border bg-background px-2 text-sm" value={currency} onChange={(e) => setCurrency(e.target.value as "HTG" | "USD")}>
            <option value="HTG">Prix en GDS</option><option value="USD">Prix en USD</option>
          </select>
          <Input className="w-28" type="number" placeholder="Prix" value={bulkPrice} onChange={(e) => setBulkPrice(e.target.value)} />
          <Button size="sm" variant="outline" onClick={() => setRows((r) => r.map((x) => ({ ...x, price: bulkPrice })))}>Appliquer à tous</Button>
        </div>
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={groupSame} onChange={(e) => setGroupSame(e.target.checked)} /> Regrouper le même modèle en un produit avec variantes</label>
      </div>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.key} className="grid gap-2 rounded-xl border p-2 sm:grid-cols-[80px_1fr_auto]">
            <img src={r.image} alt="" className="h-20 w-20 rounded-lg object-cover" />
            <div className="grid gap-2 min-w-0">
              {r.status === "lecture" ? <p className="text-xs flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> L'IA lit la photo…</p> : null}
              <Input value={r.title} placeholder="Nom" onChange={(e) => update(r.key, { title: e.target.value })} />
              <textarea className="min-h-16 rounded-md border bg-background p-2 text-xs" value={r.description} placeholder="Description" onChange={(e) => update(r.key, { description: e.target.value })} />
              <div className="flex flex-wrap gap-2">
                <select className="h-9 rounded-md border bg-background px-2 text-sm" value={r.category} onChange={(e) => update(r.key, { category: e.target.value })}>
                  {cats.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <Input className="w-28" type="number" placeholder={`Prix ${currency === "HTG" ? "GDS" : "USD"}`} value={r.price} onChange={(e) => update(r.key, { price: e.target.value })} />
              </div>
            </div>
            <Button size="icon" variant="ghost" aria-label="Retirer" onClick={() => setRows((x) => x.filter((y) => y.key !== r.key))}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
      {rows.length ? <Button className="w-full rounded-full font-bold" disabled={busy || rows.some((r) => r.status === "lecture")} onClick={publish}>{busy ? "Publication…" : `Publier tout (${rows.length})`}</Button> : null}
    </div>
  );
}
