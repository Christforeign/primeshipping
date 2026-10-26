// @ts-nocheck — legacy pages pending migration to real tables
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Wallet, CheckCircle2, AlertCircle, PlusCircle, ArrowRight, FileDown } from "lucide-react";
import { openInvoice } from "@/lib/invoice";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/StatusBadge";
import { PackageTimeline } from "@/components/PackageTimeline";
import { useSettings } from "@/lib/settings";
import { useUser } from "@/lib/session";
import { clientStore } from "@/lib/store";
import { formatDate } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { PackagePaymentModal } from "@/components/PackagePaymentModal";
import { WalletTopupModal } from "@/components/WalletTopupModal";

export const Route = createFileRoute("/_authenticated/compte/colis/$id")({
  component: PackageDetail,
});

function PackageDetail() {
  const { id } = Route.useParams();
  const { user } = useUser();
  const s = useSettings();
  const qc = useQueryClient();
  const rate = s?.usd_to_htg || 132;

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [topupOpen, setTopupOpen] = useState(false);

  const q = useQuery({
    queryKey: ["package", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("*, package_events(id,status,note,created_at,is_internal)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const walletQuery = useQuery({
    queryKey: ["my-wallet", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user!.id)
          .maybeSingle();
        if (!error && data) return Number(data.balance_usd) || 0;
      } catch {
        // fallback
      }
      return clientStore.getWalletBalance(user?.id || "anon");
    },
  });

  const walletBalance = walletQuery.data ?? clientStore.getWalletBalance(user?.id || "anon");

  if (q.isLoading) return <p>Chargement…</p>;
  const p = q.data;
  if (!p)
    return (
      <p>
        Colis introuvable.{" "}
        <Link to="/compte/colis" className="text-primary underline">
          Retour
        </Link>
      </p>
    );
  const events = [...p.package_events].sort((a, b) => b.created_at.localeCompare(a.created_at));

  // Shipping fees & Wallet payment status
  const totalDueUsd = p.total_due_usd ?? (p.shipping_fee ?? 0) + (p.extra_fees ?? 0);
  const paidUsd = Number(p.paid_amount_usd) || 0;
  const remainingDueUsd = Math.max(0, Number((totalDueUsd - paidUsd).toFixed(2)));
  const isFullyPaid = totalDueUsd > 0 && remainingDueUsd <= 0;
  const isPartiallyPaid = paidUsd > 0 && remainingDueUsd > 0;

  // Check if consolidated multi-colis package
  let isConsolidated = false;
  let subPackages: any[] = [];
  try {
    if (p.instructions && p.instructions.startsWith("{")) {
      const parsed = JSON.parse(p.instructions);
      if (
        parsed.is_consolidated &&
        Array.isArray(parsed.sub_packages) &&
        parsed.sub_packages.length > 0
      ) {
        isConsolidated = true;
        subPackages = parsed.sub_packages;
      }
    }
  } catch {}

  const handleDownloadInvoice = () => {
    const ratePerLb = Number(s?.shipping_rate_per_lb) || 0;
    const lines =
      subPackages.length > 0
        ? subPackages.map((sub: any, idx: number) => ({
            num: idx + 1,
            tracking_or_sku: sub.carrier_tracking || undefined,
            label: `${sub.merchant ? sub.merchant + " — " : ""}${sub.description || "Colis"}`,
            weight_lbs: Number(sub.weight_lb) || undefined,
            customs_fee_usd: Number(sub.customs_fee_usd) || undefined,
            qty: 1,
            unit: ratePerLb,
            total:
              Number(sub.fee_usd) ||
              (Number(sub.weight_lb) ? Number((Number(sub.weight_lb) * ratePerLb).toFixed(2)) : 0),
          }))
        : [
            {
              tracking_or_sku: p.carrier_tracking,
              label: `Transport — ${p.description}`,
              weight_lbs: p.actual_weight_lb ? Number(p.actual_weight_lb) : undefined,
              qty: p.quantity || 1,
              unit: p.actual_weight_lb ? ratePerLb : undefined,
              total: Number(p.shipping_fee) || 0,
            },
          ];

    if (p.extra_fees && Number(p.extra_fees) > 0) {
      lines.push({
        label: "Frais supplémentaires / Douane",
        total: Number(p.extra_fees),
      });
    }

    openInvoice({
      brand: "shipping",
      number: p.tracking_number,
      title: "FACTURE COLIS",
      template: "global-express",
      client: { email: user?.email, name: user?.user_metadata?.full_name || undefined },
      shipping_details: {
        package_count: subPackages.length > 0 ? subPackages.length : p.quantity || 1,
        total_weight_lbs: p.actual_weight_lb ? Number(p.actual_weight_lb) : undefined,
        rate_per_lb: ratePerLb,
        destination: p.destination || "Haïti",
      },
      lines,
      paid: paidUsd,
      rate,
      company: {
        name: "Prime Express Shipping",
        phone: s?.company_phone || s?.phone || "+509 3700-1122",
        whatsapp: s?.company_whatsapp || s?.whatsapp || "+509 3700-1122",
        email: s?.company_email || s?.email || "contact@prime-entreprise.com",
        address: s?.company_address || s?.hq_address || "",
        footer: s?.invoice_footer || "Prime Express Shipping • Fast, Reliable, Global",
        logo: "/assets/aistudio/WhatsApp_Image_2026-10-14_at_20.12.29_c1b1b367.jpeg",
      },
    });
  };

  const rows: [string, string | number | null][] = [
    ["Site marchand", p.merchant],
    ["N° commande", p.merchant_order_number],
    ["Suivi transporteur", p.carrier_tracking],
    ["Catégorie", p.category],
    ["Quantité", p.quantity],
    ["Poids estimé", p.estimated_weight_lb ? `${p.estimated_weight_lb} lb` : null],
    ["Poids réel", p.actual_weight_lb ? `${p.actual_weight_lb} lb` : null],
    ["Valeur déclarée", p.declared_value != null ? `${p.declared_value} ${p.currency}` : null],
    ["Frais de transport", p.shipping_fee != null ? `${p.shipping_fee} USD` : null],
    ["Frais supplémentaires", p.extra_fees != null ? `${p.extra_fees} USD` : null],
    ["Destination", p.destination],
    ["Reçu le", p.received_at ? formatDate(p.received_at) : null],
  ];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 sm:space-y-6">
      <Link to="/compte/colis" className="text-sm text-primary underline">
        ← Mes colis
      </Link>
      {/* CARTE COLIS */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div className="bg-forest p-5 text-primary-foreground">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <p className="text-xs opacity-80">N° d'expédition</p>
              <p className="truncate font-mono text-lg font-bold">{p.tracking_number}</p>
            </div>
            <StatusBadge status={p.status} />
          </div>
          <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
            <div className="min-w-0">
              <p className="text-xs opacity-80">Départ</p>
              <p className="truncate font-semibold">{p.merchant || "Entrepôt étranger"}</p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 opacity-80" />
            <div className="min-w-0 text-right">
              <p className="text-xs opacity-80">Destination</p>
              <p className="truncate font-semibold">{p.destination || "Haïti"}</p>
            </div>
          </div>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="break-words text-lg font-bold text-foreground sm:text-xl">
              {p.description}
            </h1>
            {isConsolidated && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200 border border-orange-300 dark:border-orange-800">
                Paquet groupé ({subPackages.length} colis)
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {[
              ["Catégorie", p.category],
              ["Colis inclus", isConsolidated ? `${subPackages.length} colis` : p.quantity],
              [
                "Poids total",
                (p.actual_weight_lb ?? p.estimated_weight_lb)
                  ? `${p.actual_weight_lb ?? p.estimated_weight_lb} lb`
                  : null,
              ],
              ["Total dû", `$${totalDueUsd.toFixed(2)}`],
              ["Payé", `$${paidUsd.toFixed(2)}`],
              ["Reste", `$${remainingDueUsd.toFixed(2)}`],
              ["Destinataire", user?.email],
              ["Mis à jour", formatDate(p.updated_at)],
            ]
              .filter(([, v]) => v != null && v !== "")
              .map(([k, v]) => (
                <div key={k as string} className="min-w-0 rounded-lg bg-muted/60 p-3">
                  <p className="text-xs text-muted-foreground">{k}</p>
                  <p className="truncate font-semibold">{v}</p>
                </div>
              ))}
          </div>

          {/* DÉTAILS DES SOUS-COLIS DU PAQUET GROUPÉ */}
          {isConsolidated && subPackages.length > 0 && (
            <div className="rounded-lg border border-border p-4 bg-muted/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Colis individuels réunis dans ce paquet ({subPackages.length})
                </p>
                <span className="text-[11px] text-muted-foreground font-medium">
                  Facture unique
                </span>
              </div>
              <div className="divide-y divide-border border rounded-md bg-card overflow-hidden">
                {subPackages.map((sub: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">#{idx + 1}</span>
                        {sub.carrier_tracking && (
                          <span className="font-mono bg-muted px-2 py-0.5 rounded text-[11px] border">
                            {sub.carrier_tracking}
                          </span>
                        )}
                        <span className="font-semibold text-foreground">
                          {sub.merchant ? `${sub.merchant} — ` : ""}
                          {sub.description}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      {sub.weight_lb ? (
                        <span className="font-bold text-foreground bg-muted px-2 py-0.5 rounded">
                          {sub.weight_lb} lb
                        </span>
                      ) : null}
                      {sub.fee_usd ? (
                        <span className="font-bold text-primary">
                          ${Number(sub.fee_usd).toFixed(2)} USD
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 pt-2">
            {remainingDueUsd > 0 && (
              <Button onClick={() => setPaymentOpen(true)} className="font-bold rounded-lg">
                <Wallet className="mr-1.5 h-4 w-4" /> Payer ${remainingDueUsd.toFixed(2)}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleDownloadInvoice}
              className="rounded-lg font-semibold gap-1.5"
            >
              <FileDown className="h-4 w-4" /> Télécharger la facture (
              {isConsolidated ? "Détaillée" : "PDF"})
            </Button>
          </div>
        </div>
      </div>

      {/* WALLET SHIPPING FEE PAYMENT BOX */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-forest text-accent shadow-xs flex-shrink-0">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Règlement des frais d'expédition
              </h2>
              <p className="text-xs text-muted-foreground">
                Paiement exclusif par Portefeuille (intégral ou par tranches)
              </p>
            </div>
          </div>

          <div>
            {isFullyPaid ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5" /> Frais 100% soldés
              </span>
            ) : isPartiallyPaid ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                Acompte partiel ({paidUsd} USD)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-muted text-muted-foreground border">
                En attente de règlement
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-muted/60">
            <span className="text-muted-foreground">Total transport :</span>
            <p className="font-bold text-sm text-forest mt-0.5">${totalDueUsd.toFixed(2)} USD</p>
            <p className="text-[10px] text-muted-foreground">
              ≈ {Math.round(totalDueUsd * rate).toLocaleString("fr-FR")} HTG
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-muted/60">
            <span className="text-muted-foreground">Déjà réglé :</span>
            <p className="font-bold text-sm text-emerald-700 mt-0.5">${paidUsd.toFixed(2)} USD</p>
          </div>
          <div className="p-3 rounded-2xl bg-muted/60">
            <span className="text-muted-foreground">Reste à payer :</span>
            <p className="font-extrabold text-sm text-destructive mt-0.5">
              ${remainingDueUsd.toFixed(2)} USD
            </p>
            <p className="text-[10px] text-muted-foreground">
              ≈ {Math.round(remainingDueUsd * rate).toLocaleString("fr-FR")} HTG
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-secondary/80 border border-primary/20">
            <span className="text-muted-foreground">Votre solde Portefeuille :</span>
            <p className="font-extrabold text-sm text-forest mt-0.5">
              ${walletBalance.toFixed(2)} USD
            </p>
          </div>
        </div>

        {remainingDueUsd > 0 ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <p className="text-xs text-muted-foreground">
              Réglez la totalité ou versez un acompte à votre rythme avant le retrait du colis.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:flex sm:items-center">
              <Button variant="outline" size="sm" onClick={() => setTopupOpen(true)}>
                <PlusCircle className="h-4 w-4 mr-1.5" /> Recharger portefeuille
              </Button>
              <Button size="sm" onClick={() => setPaymentOpen(true)} className="font-bold">
                Payer avec mon Portefeuille <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-emerald-700 font-semibold pt-1 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> Aucun reste à payer. Votre colis est prêt pour être
            récupéré ou livré !
          </p>
        )}
      </div>

      {p.status === "disponible_retrait" && (
        <div className="rounded-2xl border-2 border-accent bg-card p-5">
          <p className="font-semibold">Votre colis vous attend.</p>
          <p className="text-sm text-muted-foreground">
            {s?.pickup_address
              ? `Bureau de retrait : ${s.pickup_address}`
              : "Contactez-nous pour organiser le retrait."}
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 rounded-2xl border bg-card p-5 text-sm">
          {rows
            .filter(([, v]) => v != null && v !== "")
            .map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
        </dl>
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="mb-4 font-bold">Historique</h2>
          <PackageTimeline events={events} />
        </div>
      </div>

      {/* Package Payment Modal */}
      {user && (
        <PackagePaymentModal
          packageData={{
            id: p.id,
            tracking_number: p.tracking_number,
            description: p.description,
            shipping_fee: p.shipping_fee,
            extra_fees: p.extra_fees,
            paid_amount_usd: paidUsd,
            total_due_usd: totalDueUsd,
            payment_status: p.payment_status,
          }}
          userWalletBalance={walletBalance}
          userId={user.id}
          isOpen={paymentOpen}
          onClose={() => setPaymentOpen(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ["package", id] });
            qc.invalidateQueries({ queryKey: ["my-wallet", user.id] });
          }}
          onOpenTopup={() => setTopupOpen(true)}
        />
      )}

      {/* Wallet Topup Modal */}
      {user && (
        <WalletTopupModal
          userId={user.id}
          userName={user.email}
          isOpen={topupOpen}
          onClose={() => setTopupOpen(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ["my-wallet", user.id] });
          }}
        />
      )}
    </div>
  );
}
