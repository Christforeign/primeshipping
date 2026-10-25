// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PACKAGE_STATUSES, statusLabel, type PackageStatus } from "@/lib/labels";
import { useRoles, useUser } from "@/lib/session";
import { useSettings } from "@/lib/settings";
import { openInvoice } from "@/lib/invoice";
import { AdminPackageEditDialog } from "@/components/AdminPackageEditDialog";
import { sendClientEmail } from "@/lib/email.functions";
import { notifyNewPackage, notifyPackageStatusChange } from "@/lib/push-notifications";
import {
  Package,
  Layers,
  Plus,
  Trash2,
  FileDown,
  MessageCircle,
  Mail,
  UserCheck,
  Scale,
  Calculator,
  Search,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/compte/admin-colis")({
  head: () => ({
    meta: [
      { title: "Gestion des colis & Envois Groupés — Prime Shipping" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminColis,
});

type SubItem = {
  id: string;
  carrier_tracking: string;
  merchant: string;
  description: string;
  weight_lb: string;
  fee_usd: string;
  customs_fee_usd: string;
};

function AdminColis() {
  const { user } = useUser();
  const { isAdmin } = useRoles(user?.id);
  const qc = useQueryClient();
  const st: any = useSettings();

  // Mode: single (standard) or multi (consolidated)
  const [colisMode, setColisMode] = useState<"single" | "multi">("single");

  const [f, setF] = useState<any>({ status: "recu_entrepot" });
  const [search, setSearch] = useState("");
  const [editPkg, setEditPkg] = useState<any>(null);
  const [pkgSearch, setPkgSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [staffEmail, setStaffEmail] = useState("");
  const [staffRole, setStaffRole] = useState("admin");

  const ratePerLb = Number(st?.shipping_rate_per_lb) || 4.5;
  const usdToHtg = Number(st?.usd_to_htg) || 132;

  // Multi-colis items
  const [subItems, setSubItems] = useState<SubItem[]>([
    {
      id: "1",
      carrier_tracking: "",
      merchant: "Amazon",
      description: "Colis 1",
      weight_lb: "",
      fee_usd: "",
      customs_fee_usd: "",
    },
    {
      id: "2",
      carrier_tracking: "",
      merchant: "Shein",
      description: "Colis 2",
      weight_lb: "",
      fee_usd: "",
      customs_fee_usd: "",
    },
  ]);

  const addSubItem = () => {
    setSubItems((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        carrier_tracking: "",
        merchant: "Amazon",
        description: `Colis ${prev.length + 1}`,
        weight_lb: "",
        fee_usd: "",
        customs_fee_usd: "",
      },
    ]);
  };

  const removeSubItem = (id: string) => {
    if (subItems.length <= 1) {
      toast.error("Le paquet groupé doit contenir au moins un colis.");
      return;
    }
    setSubItems((prev) => prev.filter((it) => it.id !== id));
  };

  const updateSubItem = (id: string, field: keyof SubItem, val: string) => {
    setSubItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: val };
        // Auto-calculate fee when weight changes if user hasn't explicitly entered a fee
        if (field === "weight_lb") {
          const w = parseFloat(val);
          if (!isNaN(w) && w > 0) {
            updated.fee_usd = (w * ratePerLb).toFixed(2);
          }
        }
        return updated;
      }),
    );
  };

  // Aggregated totals for multi-colis
  const multiTotalWeight = subItems.reduce((acc, it) => acc + (parseFloat(it.weight_lb) || 0), 0);
  const multiTotalFee = subItems.reduce(
    (acc, it) => acc + (parseFloat(it.fee_usd) || (parseFloat(it.weight_lb) || 0) * ratePerLb),
    0,
  );
  const multiTotalCustoms = subItems.reduce(
    (acc, it) => acc + (parseFloat(it.customs_fee_usd) || 0),
    0,
  );

  const clients = useQuery({
    queryKey: ["admin-clients"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, client_code")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const pkgs = useQuery({
    queryKey: ["admin-packages"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select(
          "id, tracking_number, description, status, user_id, shipping_fee, extra_fees, declared_value, quantity, actual_weight_lb, estimated_weight_lb, internal_notes, instructions, merchant, carrier_tracking, created_at, destination",
        )
        .order("created_at", { ascending: false })
        .limit(150);
      if (error) throw error;
      return data;
    },
  });

  if (!isAdmin) return <p className="text-sm text-muted-foreground">Accès refusé.</p>;
  const editDialog = (
    <AdminPackageEditDialog
      pkg={editPkg}
      userId={user?.id ?? ""}
      onClose={() => setEditPkg(null)}
      onSaved={() => qc.invalidateQueries({ queryKey: ["admin-packages"] })}
    />
  );

  const list = (clients.data ?? []).filter((c) =>
    `${c.full_name} ${c.email} ${c.client_code} ${c.phone}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const byId = new Map((clients.data ?? []).map((c) => [c.id, c]));
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  // Creation handler
  const create = async (e: React.FormEvent): Promise<unknown> => {
    e.preventDefault();
    if (!f.user_id) return toast.error("Veuillez sélectionner un client.");

    setBusy(true);

    if (colisMode === "multi") {
      // Validate sub-items
      const validItems = subItems.filter(
        (it) => it.carrier_tracking.trim() || it.description.trim() || parseFloat(it.weight_lb) > 0,
      );

      if (validItems.length === 0) {
        setBusy(false);
        return toast.error("Veuillez renseigner au moins un colis avec son numéro et son poids.");
      }

      const allMerchants =
        Array.from(new Set(validItems.map((it) => it.merchant.trim()).filter(Boolean))).join(
          ", ",
        ) || "Multi-marchands";

      const rows = validItems.map((it, i) => {
        const w = parseFloat(it.weight_lb) || 0;
        const fee = parseFloat(it.fee_usd) || w * ratePerLb;
        const customs = parseFloat(it.customs_fee_usd) || 0;
        return {
          user_id: f.user_id,
          merchant: it.merchant.trim() || "Non précisé",
          description: it.description.trim() || `Colis #${i + 1}`,
          carrier_tracking: it.carrier_tracking.trim() || null,
          actual_weight_lb: w ? Number(w.toFixed(2)) : null,
          shipping_fee: Number(fee.toFixed(2)),
          extra_fees: customs ? Number(customs.toFixed(2)) : null,
          destination: f.destination || "Haïti",
          quantity: 1,
          instructions: f.note || null,
          status: (f.status as PackageStatus) || "recu_entrepot",
          created_by: user!.id,
        };
      });

      const { data: created, error } = await supabase
        .from("packages")
        .insert(rows)
        .select("tracking_number");

      setBusy(false);
      if (error) return toast.error("Erreur : " + error.message);
      const data = { tracking_number: (created || []).map((r: any) => r.tracking_number).join(", ") };

      toast.success(`${validItems.length} colis enregistrés pour ce client : ${data.tracking_number}`);

      notifyNewPackage(data.tracking_number, {
        userId: f.user_id,
        merchant: allMerchants,
        weightLb: multiTotalWeight,
      });

      setF({ status: "recu_entrepot" });
      setSubItems([
        {
          id: "1",
          carrier_tracking: "",
          merchant: "Amazon",
          description: "Colis 1",
          weight_lb: "",
          fee_usd: "",
          customs_fee_usd: "",
        },
        {
          id: "2",
          carrier_tracking: "",
          merchant: "Shein",
          description: "Colis 2",
          weight_lb: "",
          fee_usd: "",
          customs_fee_usd: "",
        },
      ]);
      qc.invalidateQueries({ queryKey: ["admin-packages"] });
    } else {
      // Standard Single Package Mode
      if (!f.description || !f.merchant) {
        setBusy(false);
        return toast.error("Description et marchand requis");
      }

      const { data, error } = await supabase
        .from("packages")
        .insert({
          user_id: f.user_id,
          merchant: f.merchant,
          description: f.description,
          carrier_tracking: f.carrier_tracking || null,
          actual_weight_lb: f.weight ? Number(f.weight) : null,
          shipping_fee: f.fee ? Number(f.fee) : null,
          destination: f.destination || null,
          extra_fees: f.extra ? Number(f.extra) : null,
          declared_value: f.paid ? Number(f.paid) : null,
          quantity: f.qty ? Number(f.qty) : 1,
          instructions: f.note || null,
          status: (f.status as PackageStatus) || "recu_entrepot",
          created_by: user!.id,
        })
        .select("tracking_number")
        .single();

      setBusy(false);
      if (error) return toast.error("Erreur : " + error.message);

      toast.success(`Colis ${data.tracking_number} créé — le client est notifié`);
      notifyNewPackage(data.tracking_number, {
        userId: f.user_id,
        merchant: f.merchant,
        weightLb: f.weight ? Number(f.weight) : undefined,
      });
      setF({ status: "recu_entrepot" });
      qc.invalidateQueries({ queryKey: ["admin-packages"] });
    }
  };

  const changeStatus = async (id: string, status: PackageStatus): Promise<unknown> => {
    const { error } = await supabase
      .from("package_events")
      .insert({ package_id: id, status, note: statusLabel(status), created_by: user!.id });
    if (error) return toast.error(error.message);
    const targetPkg = (pkgs.data ?? []).find((p: any) => p.id === id);
    if (targetPkg) {
      notifyPackageStatusChange(targetPkg.tracking_number, statusLabel(status), {
        userId: targetPkg.user_id,
        description: targetPkg.description,
      });
    }
    if (targetPkg) {
      const kind =
        status === "recu_entrepot"
          ? "colis_recu"
          : status === "expedie" || status === "en_transit"
            ? "transit"
            : status === "arrive_haiti" || status === "disponible_retrait"
              ? "arrivee"
              : null;
      if (kind) {
        sendClientEmail({
          data: {
            kind,
            userId: targetPkg.user_id,
            vars: { tracking: targetPkg.tracking_number, details: targetPkg.description },
          },
        })
          .then((r: any) => !r?.sent && r?.reason && toast.info(`E-mail non envoyé : ${r.reason}`))
          .catch((e: any) => toast.error(e?.message ?? "E-mail non envoyé"));
      }
    }
    toast.success("Statut mis à jour — client notifié");
    qc.invalidateQueries({ queryKey: ["admin-packages"] });
  };

  const whatsapp = (userId: string, tracking: string, status: PackageStatus) => {
    const c = byId.get(userId);
    const targetPkg = (pkgs.data ?? []).find((pkg: any) => pkg.tracking_number === tracking);
    let subPackagesText = "";
    if (targetPkg?.instructions && targetPkg.instructions.startsWith("{")) {
      try {
        const parsed = JSON.parse(targetPkg.instructions);
        if (parsed.is_consolidated && Array.isArray(parsed.sub_packages)) {
          subPackagesText =
            "\n\n📦 *Détails des colis réunis :*\n" +
            parsed.sub_packages
              .map(
                (s: any, idx: number) =>
                  `  ${idx + 1}. ${s.carrier_tracking ? `[${s.carrier_tracking}] ` : ""}${s.merchant ? s.merchant + " — " : ""}${s.description} (${s.weight_lb || 0} lb)`,
              )
              .join("\n");
        }
      } catch {
        // fallback
      }
    }
    const phone = (c?.phone ?? "").replace(/\D/g, "");
    const msg = `Bonjour ${c?.full_name ?? ""}, votre expédition Prime Shipping *${tracking}* est actuellement : *${statusLabel(status)}*.${subPackagesText}\n\nMerci de votre confiance ! — Prime Express Shipping`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // Generate multi-item consolidated or standard invoice
  const invoice = (p: any) => {
    const c = byId.get(p.user_id);
    let lines: any[] = [];
    let subPackages: any[] = [];
    let customNote = p.instructions;

    try {
      if (p.instructions && p.instructions.startsWith("{")) {
        const parsed = JSON.parse(p.instructions);
        if (
          parsed.is_consolidated &&
          Array.isArray(parsed.sub_packages) &&
          parsed.sub_packages.length > 0
        ) {
          subPackages = parsed.sub_packages;
          customNote = parsed.note || undefined;
        }
      }
    } catch {
      // not JSON
    }

    if (subPackages.length > 0) {
      lines = subPackages.map((sub: any, i: number) => ({
        num: i + 1,
        tracking_or_sku: sub.carrier_tracking || undefined,
        label: `${sub.merchant ? sub.merchant + " — " : ""}${sub.description || "Colis"}`,
        weight_lbs: Number(sub.weight_lb) || undefined,
        customs_fee_usd: Number(sub.customs_fee_usd) || undefined,
        unit: ratePerLb,
        qty: 1,
        total:
          Number(sub.fee_usd) ||
          (Number(sub.weight_lb) ? Number((Number(sub.weight_lb) * ratePerLb).toFixed(2)) : 0),
      }));
    } else {
      lines = [
        {
          tracking_or_sku: p.carrier_tracking,
          label: `Fret — ${p.description}`,
          weight_lbs: p.actual_weight_lb ? Number(p.actual_weight_lb) : undefined,
          qty: p.quantity || 1,
          unit: p.actual_weight_lb ? ratePerLb : undefined,
          total: Number(p.shipping_fee) || 0,
        },
      ];
    }

    if (p.extra_fees && Number(p.extra_fees) > 0) {
      lines.push({
        label: "Frais supplémentaires / Douane / Manutention",
        total: Number(p.extra_fees),
      });
    }

    openInvoice({
      brand: "shipping",
      number: p.tracking_number,
      title: "FACTURE COLIS",
      template: "global-express",
      client: {
        name: c?.full_name || "Client",
        code: c?.client_code,
        email: c?.email,
        phone: c?.phone,
      },
      shipping_details: {
        package_count: subPackages.length > 0 ? subPackages.length : p.quantity || 1,
        total_weight_lbs: p.actual_weight_lb ? Number(p.actual_weight_lb) : undefined,
        rate_per_lb: ratePerLb,
        destination: p.destination || "Haïti",
      },
      lines,
      paid: Number(p.declared_value) || 0,
      note: customNote,
      rate: usdToHtg,
      company: {
        name: "Prime Express Shipping",
        phone: st?.company_phone || st?.phone || "+509 3700-1122",
        whatsapp: st?.company_whatsapp || st?.whatsapp || "+509 3700-1122",
        email: st?.company_email || st?.email || "contact@prime-entreprise.com",
        address: st?.company_address || st?.hq_address || "",
        footer: st?.invoice_footer || "Prime Express Shipping • Fast, Reliable, Global",
        logo: "/assets/aistudio/WhatsApp_Image_2026-10-14_at_20.12.29_c1b1b367.jpeg",
      },
    });
  };

  const email = (p: any) => {
    const c = byId.get(p.user_id);
    if (!c?.email) return toast.error("Ce client n'a pas d'e-mail");
    const body = `Bonjour ${c.full_name ?? ""},\n\nVotre colis ${p.tracking_number} (${p.description}) est : ${statusLabel(p.status)}.\n\nPrime Express Shipping`;
    window.location.href = `mailto:${c.email}?subject=${encodeURIComponent("Votre colis " + p.tracking_number)}&body=${encodeURIComponent(body)}`;
  };

  const addStaff = async () => {
    const { data, error } = await supabase.rpc("add_staff_by_email", {
      _email: staffEmail,
      _role: staffRole,
    });
    if (error) return toast.error(error.message);
    if (data === "not_found")
      return toast.error("Aucun compte avec cet e-mail. La personne doit d'abord s'inscrire.");
    toast.success("Accès donné à " + staffEmail);
    setStaffEmail("");
  };

  // Filter package list
  const filteredPkgs = (pkgs.data ?? []).filter((p) => {
    const client = byId.get(p.user_id);
    const text =
      `${p.tracking_number} ${p.carrier_tracking || ""} ${p.description || ""} ${client?.full_name || ""} ${client?.client_code || ""} ${client?.email || ""}`.toLowerCase();
    return text.includes(pkgSearch.toLowerCase());
  });

  return (
    <div className="space-y-8">
      {editDialog}
      {/* HEADER / NAVIGATION BAR */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" /> Gestion des Colis & Fret
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Enregistrement de colis uniques ou consolidation de plusieurs colis et poids dans un
              seul paquet pour une facture unique.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold bg-muted px-3 py-1.5 rounded-lg border border-border w-fit">
            <span>Tarif actuel :</span>
            <span className="text-primary font-bold">{ratePerLb.toFixed(2)}$ / lb</span>
            <span className="text-muted-foreground">·</span>
            <span>1 USD = {usdToHtg} HTG</span>
          </div>
        </div>
      </div>

      {/* FORMULAIRE : CRÉATION DE COLIS OU PAQUET GROUPÉ */}
      <form
        onSubmit={create}
        className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Ajouter une expédition client</h2>
            <p className="text-xs text-muted-foreground">
              Choisissez entre un colis simple individuel ou un paquet groupé multi-colis.
            </p>
          </div>

          {/* SÉLECTEUR DE MODE : SIMPLE VS GROUPÉ */}
          <div className="inline-flex rounded-lg border border-border bg-muted p-1">
            <button
              type="button"
              onClick={() => setColisMode("single")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                colisMode === "single"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              Colis Simple (1 seul tracking)
            </button>
            <button
              type="button"
              onClick={() => setColisMode("multi")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                colisMode === "multi"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Colis Groupé (Multi-colis dans 1 paquet)
            </button>
          </div>
        </div>

        {/* SÉLECTION DU CLIENT */}
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Client Destinataire
          </Label>
          <Input
            placeholder="Rechercher par nom, e-mail, code PS-XXXX, téléphone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg"
          />
          <select
            value={f.user_id ?? ""}
            onChange={set("user_id")}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            required
          >
            <option value="">— Sélectionner le client bénéficiaire —</option>
            {list.map((c) => (
              <option key={c.id} value={c.id}>
                {c.client_code ? `[${c.client_code}] ` : ""}
                {c.full_name || c.email} {c.phone ? `· Tél: ${c.phone}` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* ========================================================================= */}
        {/* MODE 1 : COLIS SIMPLE (ANCIEN SYSTÈME CONSERVÉ INTÉGRALEMENT)             */}
        {/* ========================================================================= */}
        {colisMode === "single" && (
          <div className="space-y-4 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs font-medium">Marchand / Provenance</Label>
                <Input
                  value={f.merchant ?? ""}
                  onChange={set("merchant")}
                  placeholder="Amazon, Shein, eBay, Temu…"
                  className="rounded-lg"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">
                  N° de suivi transporteur (Carrier tracking)
                </Label>
                <Input
                  value={f.carrier_tracking ?? ""}
                  onChange={set("carrier_tracking")}
                  placeholder="Ex: TBA304918239, 1Z9999999999…"
                  className="rounded-lg font-mono text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs font-medium">Description du contenu</Label>
                <Input
                  value={f.description ?? ""}
                  onChange={set("description")}
                  placeholder="Ex: Vêtements, Électronique, Chaussures…"
                  className="rounded-lg"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Poids réel (lb)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={f.weight ?? ""}
                  onChange={(e) => {
                    const w = parseFloat(e.target.value);
                    setF({
                      ...f,
                      weight: e.target.value,
                      fee: !isNaN(w) && w > 0 ? (w * ratePerLb).toFixed(2) : f.fee,
                    });
                  }}
                  placeholder="Ex: 3.50"
                  className="rounded-lg"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Frais d'expédition Fret (USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={f.fee ?? ""}
                  onChange={set("fee")}
                  placeholder="Ex: 15.75"
                  className="rounded-lg"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Autres frais / Douane (USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={f.extra ?? ""}
                  onChange={set("extra")}
                  placeholder="0.00"
                  className="rounded-lg"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Montant déjà payé (USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={f.paid ?? ""}
                  onChange={set("paid")}
                  placeholder="0.00"
                  className="rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE 2 : COLIS GROUPÉ (MULTI-NUMÉROS & POIDS RÉUNIS DANS 1 SEUL PAQUET)   */}
        {/* ========================================================================= */}
        {colisMode === "multi" && (
          <div className="space-y-4 pt-2">
            <div className="rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 p-3.5 text-xs text-orange-900 dark:text-orange-200">
              <span className="font-bold">Mode Paquet Groupé :</span> Ajoutez tous les colis et
              numéros de suivi reçus pour ce client. Le système calcule automatiquement le poids
              cumulé et génère <b>une seule facture complète</b> listant chaque colis
              individuellement.
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label className="text-xs font-medium">
                  Titre ou Référence globale du paquet groupé
                </Label>
                <Input
                  value={f.description ?? ""}
                  onChange={set("description")}
                  placeholder="Ex: Lot groupé Miami (Vêtements Shein + Chaussures Amazon)"
                  className="rounded-lg"
                />
              </div>
            </div>

            {/* TABLEAU DES SOUS-COLIS */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Colis inclus dans ce paquet ({subItems.length})
                </Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addSubItem}
                  className="h-8 text-xs font-semibold gap-1.5 rounded-lg border-primary text-primary hover:bg-primary/10"
                >
                  <Plus className="h-3.5 w-3.5" /> Ajouter un autre colis au lot
                </Button>
              </div>

              <div className="space-y-2.5">
                {subItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-lg border border-border bg-muted/40 grid gap-2.5 sm:grid-cols-12 items-center"
                  >
                    <div className="sm:col-span-1 text-center font-bold text-xs text-muted-foreground">
                      #{index + 1}
                    </div>

                    <div className="sm:col-span-3">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                        N° de suivi transporteur
                      </Label>
                      <Input
                        value={item.carrier_tracking}
                        onChange={(e) => updateSubItem(item.id, "carrier_tracking", e.target.value)}
                        placeholder="Ex: TBA..., 1Z..."
                        className="h-8 text-xs font-mono rounded-md"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                        Marchand
                      </Label>
                      <Input
                        value={item.merchant}
                        onChange={(e) => updateSubItem(item.id, "merchant", e.target.value)}
                        placeholder="Amazon, Shein…"
                        className="h-8 text-xs rounded-md"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                        Description contenu
                      </Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateSubItem(item.id, "description", e.target.value)}
                        placeholder="Vêtements, Électronique…"
                        className="h-8 text-xs rounded-md"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                        Poids (lb)
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.weight_lb}
                        onChange={(e) => updateSubItem(item.id, "weight_lb", e.target.value)}
                        placeholder="1.5"
                        className="h-8 text-xs rounded-md"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                        Frais ($)
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.fee_usd}
                        onChange={(e) => updateSubItem(item.id, "fee_usd", e.target.value)}
                        placeholder="6.75"
                        className="h-8 text-xs rounded-md"
                      />
                    </div>

                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeSubItem(item.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-muted"
                        title="Supprimer cette ligne"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RÉSUMÉ AUTOMATIQUE DU PAQUET GROUPÉ */}
            <div className="rounded-lg bg-card border border-border p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-md bg-muted/60">
                <span className="text-muted-foreground block text-[11px]">
                  Nombre de colis réunis :
                </span>
                <span className="text-base font-black text-foreground">{subItems.length}</span>
              </div>
              <div className="p-2.5 rounded-md bg-muted/60">
                <span className="text-muted-foreground block text-[11px]">
                  Poids total cumulé :
                </span>
                <span className="text-base font-black text-primary">
                  {multiTotalWeight.toFixed(2)} lbs
                </span>
              </div>
              <div className="p-2.5 rounded-md bg-muted/60">
                <span className="text-muted-foreground block text-[11px]">Total Fret (USD) :</span>
                <span className="text-base font-black text-foreground">
                  ${multiTotalFee.toFixed(2)}
                </span>
              </div>
              <div className="p-2.5 rounded-md bg-muted/60">
                <span className="text-muted-foreground block text-[11px]">
                  Équivalent en Gourdes :
                </span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  {Math.round(multiTotalFee * usdToHtg).toLocaleString("fr-FR")} HTG
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs font-medium">Montant déjà payé (USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={f.paid ?? ""}
                  onChange={set("paid")}
                  placeholder="0.00"
                  className="rounded-lg"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">
                  Frais supplémentaires / Douane globale (USD)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={f.extra ?? ""}
                  onChange={set("extra")}
                  placeholder="0.00"
                  className="rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* CHAMPS COMMUNS (DESTINATION, STATUT, NOTE) */}
        <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-border">
          <div>
            <Label className="text-xs font-medium">Lieu de retrait / livraison en Haïti</Label>
            <Input
              value={f.destination ?? ""}
              onChange={set("destination")}
              placeholder="Ex: Delmas 33, Pétion-Ville, Cap-Haïtien…"
              className="rounded-lg"
            />
          </div>
          <div>
            <Label className="text-xs font-medium">Statut d'expédition initial</Label>
            <select
              value={f.status}
              onChange={set("status")}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {PACKAGE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs font-medium">Note interne ou mention pour le client</Label>
            <Input
              value={f.note ?? ""}
              onChange={set("note")}
              placeholder="Instructions de retrait, code de sécurité, observations…"
              className="rounded-lg"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={busy}
          className="w-full sm:w-auto px-6 font-bold rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
        >
          {busy
            ? "Enregistrement…"
            : colisMode === "multi"
              ? `Créer le paquet groupé (${subItems.length} colis) & Préparer la facture`
              : "Créer le colis et notifier le client"}
        </Button>
      </form>

      {/* LISTE DE TOUS LES COLIS & PAQUETS GROUPÉS */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Tous les colis & envois ({pkgs.data?.length ?? 0})
            </h2>
            <p className="text-xs text-muted-foreground">
              Téléchargez la facture PDF unique, notifiez par WhatsApp ou mettez à jour le statut en
              un clic.
            </p>
          </div>
          <div className="w-full sm:w-72">
            <Input
              placeholder="Filtrer par n° suivi, client, marchand…"
              value={pkgSearch}
              onChange={(e) => setPkgSearch(e.target.value)}
              className="rounded-lg text-xs"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredPkgs.map((p) => {
            const client = byId.get(p.user_id);
            let isConsolidated = false;
            let subList: any[] = [];
            try {
              if (p.instructions && p.instructions.startsWith("{")) {
                const parsed = JSON.parse(p.instructions);
                if (parsed.is_consolidated && Array.isArray(parsed.sub_packages)) {
                  isConsolidated = true;
                  subList = parsed.sub_packages;
                }
              }
            } catch {
              // fallback
            }

            return (
              <div
                key={p.id}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-lg border border-border p-3.5 text-sm bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-foreground text-sm">
                      {p.tracking_number}
                    </span>
                    {isConsolidated ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200 border border-orange-300 dark:border-orange-800">
                        <Layers className="h-3 w-3" /> Paquet groupé ({subList.length} colis)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-muted-foreground border">
                        <Package className="h-3 w-3" /> Colis simple
                      </span>
                    )}
                    {p.actual_weight_lb && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-foreground">
                        <Scale className="h-3 w-3 text-muted-foreground" />
                        {p.actual_weight_lb} lbs
                      </span>
                    )}
                    <span className="font-bold text-xs text-foreground">
                      ${Number(p.shipping_fee || 0).toFixed(2)} USD
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {client?.client_code ? `[${client.client_code}] ` : ""}
                      {client?.full_name || client?.email || "Client inconnu"}
                    </span>
                    {client?.phone && <span> · Tél: {client.phone}</span>}
                    <span> — {p.description}</span>
                  </div>

                  {/* Affichage des sous-numéros de suivi si paquet groupé */}
                  {isConsolidated && subList.length > 0 && (
                    <div className="pt-1.5 flex flex-wrap gap-1.5">
                      {subList.map((sub: any, idx: number) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-[10px] font-mono border"
                        >
                          <span className="font-bold text-foreground">#{idx + 1}</span>
                          <span>{sub.carrier_tracking || "Sans tracking"}</span>
                          {sub.weight_lb ? (
                            <span className="text-primary font-bold">({sub.weight_lb} lb)</span>
                          ) : null}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    type="button"
                    onClick={() => setEditPkg(p)}
                    className={`h-8 text-xs rounded-lg gap-1 font-bold ${p.status === "declare" ? "bg-sun text-forest hover:bg-sun/90" : ""}`}
                    variant={p.status === "declare" ? "default" : "outline"}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> {p.status === "declare" ? "Valider / Modifier" : "Modifier"}
                  </Button>
                  <select
                    value={p.status}
                    onChange={(e) => changeStatus(p.id, e.target.value as PackageStatus)}
                    className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-primary"
                  >
                    {PACKAGE_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>

                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => whatsapp(p.user_id, p.tracking_number, p.status)}
                    className="h-8 text-xs rounded-lg gap-1 border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => email(p)}
                    className="h-8 text-xs rounded-lg gap-1"
                  >
                    <Mail className="h-3.5 w-3.5" /> E-mail
                  </Button>

                  <Button
                    size="sm"
                    type="button"
                    onClick={() => invoice(p)}
                    className="h-8 text-xs rounded-lg gap-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                  >
                    <FileDown className="h-3.5 w-3.5" /> Facture PDF
                  </Button>
                </div>
              </div>
            );
          })}
          {filteredPkgs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucun colis correspondant trouvé.
            </p>
          )}
        </div>
      </div>

      {/* GESTION DES CLIENTS & STAFF */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* CLIENTS */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">
              Clients Inscrits ({clients.data?.length ?? 0})
            </h2>
            <Input
              placeholder="Filtrer client…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-40 h-8 text-xs rounded-lg"
            />
          </div>
          <div className="max-h-60 space-y-1 overflow-auto text-xs divide-y divide-border">
            {list.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between py-1.5 gap-2">
                <div>
                  <span className="font-mono font-bold text-primary mr-2">
                    {c.client_code || "N/A"}
                  </span>
                  <span className="font-semibold text-foreground">{c.full_name}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  {c.phone && <span>{c.phone}</span>}
                  {c.email && <span className="text-[11px]">{c.email}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AJOUTER UN MEMBRE DU PERSONNEL */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-base font-bold text-foreground flex items-center gap-1.5">
            <UserCheck className="h-4 w-4 text-primary" /> Rôles & Accès Administrateur
          </h2>
          <p className="text-xs text-muted-foreground">
            Donnez des droits de gestion d'entrepôt, colis ou caisse à un collaborateur.
          </p>
          <div className="flex flex-wrap gap-2">
            <Input
              className="flex-1 min-w-0 h-9 text-xs rounded-lg"
              type="email"
              placeholder="E-mail du collaborateur"
              value={staffEmail}
              onChange={(e) => setStaffEmail(e.target.value)}
            />
            <select
              value={staffRole}
              onChange={(e) => setStaffRole(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs"
            >
              <option value="admin">Admin</option>
              <option value="super_admin">Super admin</option>
              <option value="agent_colis">Agent colis</option>
              <option value="agent_finance">Agent finance</option>
              <option value="agent_support">Agent support</option>
            </select>
            <Button
              type="button"
              onClick={addStaff}
              className="h-9 text-xs font-semibold rounded-lg"
            >
              Donner l'accès
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
