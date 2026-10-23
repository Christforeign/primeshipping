import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Printer, MessageCircle, Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/lib/settings";
import { openInvoice, generateInvoiceWhatsAppText, invoiceTotals, type InvoiceData, type InvoiceBrand } from "@/lib/invoice";
import { ClientPicker } from "@/components/ClientPicker";

type Row = { id: string; tracking: string; label: string; weight: string; customs: string; amount: string };
const emptyRow = (): Row => ({ id: String(Date.now() + Math.random()), tracking: "", label: "", weight: "", customs: "", amount: "" });

export function AdminInvoiceBuilder() {
  const s = useSettings() as any;
  const rate = Number(s?.usd_to_htg) || 132;
  const [brand, setBrand] = useState<InvoiceBrand>("shipping");
  const [title, setTitle] = useState("Facture colis");
  const [mode, setMode] = useState<"member" | "walkin">("member");
  const [client, setClient] = useState<{ name: string; phone: string; code?: string | undefined; email?: string | undefined }>({ name: "", phone: "" });
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [paid, setPaid] = useState("");
  const [note, setNote] = useState("");
  const [number] = useState(() => `FAC-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 9000 + 1000)}`);

  const upd = (id: string, k: keyof Row, v: string) => setRows((r) => r.map((x) => (x.id === id ? { ...x, [k]: v } : x)));

  const build = (): InvoiceData => {
    const lines = rows
      .filter((r) => r.label.trim() || Number(r.amount))
      .map((r, i) => ({
        num: i + 1,
        tracking_or_sku: r.tracking || undefined,
        label: r.label || `Ligne ${i + 1}`,
        weight_lbs: Number(r.weight) || undefined,
        customs_fee_usd: Number(r.customs) || undefined,
        qty: 1,
        total: Number(r.amount) || 0,
      }));
    const customs = lines.reduce((a, l) => a + (l.customs_fee_usd || 0), 0);
    const weight = lines.reduce((a, l) => a + (l.weight_lbs || 0), 0);
    return {
      brand,
      number,
      title,
      date: new Date().toLocaleDateString("fr-FR"),
      client: { name: client.name, phone: client.phone, code: client.code, email: client.email },
      lines,
      customs_total_usd: customs || undefined,
      shipping_details: weight ? { package_count: lines.length, total_weight_lbs: weight } : undefined,
      paid: Number(paid) || 0,
      rate,
      note: note || undefined,
      company: {
        name: brand === "store" ? "Prime Store" : "Prime Express Shipping",
        phone: s?.phone || undefined,
        email: s?.email || undefined,
        address: s?.hq_address || undefined,
        logo: brand === "store" ? "/logos/prime-store-logo.svg" : "/logos/prime-shipping-logo.svg",
      },
    };
  };

  const valid = () => {
    if (mode === "member" && !client.code) return toast.error("Sélectionnez un client inscrit dans la liste."), false;
    if (!client.name.trim()) return toast.error("Saisissez le nom du client de passage."), false;
    if (!build().lines.length) return toast.error("Ajoutez au moins une ligne."), false;
    return true;
  };

  const share = () => {
    if (!valid()) return;
    const text = generateInvoiceWhatsAppText(build());
    const num = client.phone.replace(/\D/g, "");
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  const t = invoiceTotals(build());

  return (
    <div className="rounded-3xl border bg-card p-6 shadow-soft space-y-5">
      <h3 className="text-base font-bold text-forest flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" /> Nouvelle facture <span className="font-mono text-xs text-muted-foreground">{number}</span>
      </h3>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Type</Label>
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            onChange={(e) => {
              const v = e.target.value;
              setBrand(v === "achat" ? "store" : v === "divers" ? "entreprise" : "shipping");
              setTitle(v === "achat" ? "Achat assisté" : v === "divers" ? "Prestation" : "Facture colis");
            }}
          >
            <option value="colis">Colis / lot de colis</option>
            <option value="achat">Achat assisté</option>
            <option value="divers">Prestation diverse</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Client</Label>
          <select value={mode} onChange={(e) => { setMode(e.target.value as any); setClient({ name: "", phone: "" }); }} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
            <option value="member">Client inscrit (PS-XXXX)</option>
            <option value="walkin">Client de passage</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Titre</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
      </div>

      {mode === "member" && !client.code ? (
        <ClientPicker onPick={(h) => setClient({ name: h.full_name || h.email || h.client_code, phone: h.phone || "", code: h.client_code, email: h.email || undefined })} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          <Input value={client.name} onChange={(e) => setClient({ ...client, name: e.target.value })} placeholder="Nom du client" />
          <Input value={client.phone} onChange={(e) => setClient({ ...client, phone: e.target.value })} placeholder="Téléphone / WhatsApp (509…)" />
          {client.code && <p className="text-xs font-mono text-primary">{client.code} · <button className="underline" onClick={() => setClient({ name: "", phone: "" })}>changer</button></p>}
        </div>
      )}

      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="grid grid-cols-2 sm:grid-cols-[1fr_2fr_0.7fr_0.7fr_0.8fr_auto] gap-2">
            <Input value={r.tracking} onChange={(e) => upd(r.id, "tracking", e.target.value)} placeholder="Tracking" />
            <Input value={r.label} onChange={(e) => upd(r.id, "label", e.target.value)} placeholder="Description" />
            <Input type="number" value={r.weight} onChange={(e) => upd(r.id, "weight", e.target.value)} placeholder="lbs" />
            <Input type="number" value={r.customs} onChange={(e) => upd(r.id, "customs", e.target.value)} placeholder="Douane $" />
            <Input type="number" value={r.amount} onChange={(e) => upd(r.id, "amount", e.target.value)} placeholder="Montant $" />
            <Button type="button" variant="ghost" size="icon" onClick={() => setRows((x) => (x.length > 1 ? x.filter((y) => y.id !== r.id) : x))}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => setRows((x) => [...x, emptyRow()])}><Plus className="h-4 w-4 mr-1" /> Ajouter une ligne</Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Input type="number" value={paid} onChange={(e) => setPaid(e.target.value)} placeholder="Montant déjà payé (USD)" />
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (facultatif)" />
      </div>

      <div className="rounded-2xl bg-muted/50 p-4 text-sm flex flex-wrap justify-between gap-2">
        <span>Total : <b>{t.total.toFixed(2)} USD</b> ≈ {t.totalHtg.toLocaleString("fr-FR")} HTG</span>
        <span>Solde dû : <b>{t.balance.toFixed(2)} USD</b></span>
        <span className="text-muted-foreground">Taux : 1 USD = {rate} HTG</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => valid() && openInvoice(build())} className="rounded-2xl"><Printer className="h-4 w-4 mr-1" /> Télécharger / Imprimer PDF</Button>
        <Button onClick={share} variant="outline" className="rounded-2xl"><MessageCircle className="h-4 w-4 mr-1" /> Partager sur WhatsApp</Button>
      </div>
    </div>
  );
}
