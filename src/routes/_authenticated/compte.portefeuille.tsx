// @ts-nocheck — legacy pages pending migration to real tables
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Wallet,
  PlusCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Package,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/lib/settings";
import { clientStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { WalletTopupModal } from "@/components/WalletTopupModal";
import type { WalletTransaction } from "@/lib/types-store";

export const Route = createFileRoute("/_authenticated/compte/portefeuille")({
  component: WalletPage,
});

function WalletPage() {
  const { user } = Route.useRouteContext();
  const s = useSettings();
  const qc = useQueryClient();
  const rate = s?.usd_to_htg || 132;

  const [topupOpen, setTopupOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");

  // Load wallet
  const walletQuery = useQuery({
    queryKey: ["my-wallet", user.id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!error && data) return data;
      } catch {
        // fallback
      }
      return { id: `w-${user.id}`, balance_usd: clientStore.getWalletBalance(user.id) };
    },
  });

  // Load transactions
  const txQuery = useQuery({
    queryKey: ["my-wallet-transactions", user.id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("wallet_transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (!error && data && data.length > 0) {
          return data as unknown as WalletTransaction[];
        }
      } catch {
        // fallback
      }
      return clientStore.getWalletTransactions();
    },
  });

  const balanceUsd = walletQuery.data?.balance_usd ?? 0;
  const balanceHtg = Math.round(balanceUsd * rate);

  const transactions = txQuery.data || [];

  const filteredTx = transactions.filter((t) => {
    if (filterType === "all") return true;
    return t.type === filterType;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mon Portefeuille"
        subtitle="Gérez votre solde et réglez vos expéditions de colis exclusivement via votre portefeuille."
      >
        <Button onClick={() => setTopupOpen(true)} className="rounded-full font-bold">
          <PlusCircle className="h-4 w-4 mr-2" /> Recharger mon portefeuille
        </Button>
      </PageHeader>

      {/* Main Balance Banner */}
      <div className="rounded-3xl bg-forest p-8 sm:p-10 text-forest-foreground shadow-soft relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/20 border border-accent/30 px-3 py-1 text-xs font-bold text-accent uppercase tracking-wider">
            <Wallet className="h-3.5 w-3.5" /> Solde disponible
          </div>
          <div className="flex items-baseline gap-3">
            <span className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight">
              ${balanceUsd.toFixed(2)}
            </span>
            <span className="text-xl sm:text-2xl font-bold text-forest-foreground/80">USD</span>
          </div>
          <p className="text-sm sm:text-base text-forest-foreground/85 font-medium">
            ≈ {balanceHtg.toLocaleString("fr-FR")} HTG (Gourdes)
          </p>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button
            onClick={() => setTopupOpen(true)}
            size="lg"
            variant="sun"
            className="rounded-2xl font-bold shadow-md"
          >
            <PlusCircle className="h-5 w-5 mr-2" /> Recharger maintenant
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-2xl bg-forest/40 border-forest-foreground/20 text-forest-foreground hover:bg-forest/60"
          >
            <Link to="/compte/colis">
              <Package className="h-5 w-5 mr-2" /> Payer un colis
            </Link>
          </Button>
        </div>
      </div>

      {/* Info Notice Box */}
      <div className="rounded-2xl bg-secondary/80 border border-primary/20 p-4 sm:p-5 flex items-start gap-3 text-xs sm:text-sm text-secondary-foreground">
        <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-forest">Paiement exclusif des colis par Portefeuille</p>
          <p className="mt-0.5 leading-relaxed text-muted-foreground">
            Les frais de transport de vos colis sont débités <strong>exclusivement</strong> depuis
            votre solde. Vous avez la liberté de régler la totalité en une fois ou par tranches
            (acomptes partiels) selon votre convenance jusqu'à complet règlement avant la livraison
            ou le retrait.
          </p>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="rounded-3xl border bg-card p-6 shadow-soft space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4">
          <div>
            <h2 className="text-lg font-bold text-forest">Historique des transactions</h2>
            <p className="text-xs text-muted-foreground">
              Recharges, débits de colis et remboursements
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
            {["all", "topup", "debit"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  filterType === type
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {type === "all" ? "Toutes" : type === "topup" ? "Recharges (+)" : "Débits (-)"}
              </button>
            ))}
          </div>
        </div>

        {txQuery.isLoading ? (
          <p className="text-center py-8 text-sm text-muted-foreground">
            Chargement de vos transactions...
          </p>
        ) : filteredTx.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Wallet className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="font-medium text-sm">Aucune transaction enregistrée</p>
            <p className="text-xs mt-1">
              Rechargez votre portefeuille pour commencer à régler vos colis.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredTx.map((tx) => {
              const isTopup = tx.type === "topup";
              const isApproved = tx.status === "approved";
              const isPending = tx.status === "pending";

              return (
                <div key={tx.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`grid h-10 w-10 place-items-center rounded-2xl flex-shrink-0 ${
                        isTopup
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60"
                          : "bg-forest/10 text-forest dark:bg-forest/30"
                      }`}
                    >
                      {isTopup ? (
                        <ArrowDownLeft className="h-5 w-5" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{tx.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>
                          {new Date(tx.created_at).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span>·</span>
                        <span className="capitalize">{tx.method}</span>
                        {tx.reference && (
                          <>
                            <span>·</span>
                            <span className="font-mono">{tx.reference}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p
                      className={`font-extrabold text-sm sm:text-base ${
                        isTopup ? "text-emerald-600" : "text-foreground"
                      }`}
                    >
                      {isTopup ? "+" : "-"}${Number(tx.amount_usd).toFixed(2)} USD
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                          <CheckCircle2 className="h-3 w-3" /> Validé
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                          <Clock className="h-3 w-3" /> En attente validation
                        </span>
                      )}
                      {tx.status === "rejected" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-destructive">
                          <XCircle className="h-3 w-3" /> Rejeté
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Topup Modal */}
      <WalletTopupModal
        userId={user.id}
        userName={user.email}
        isOpen={topupOpen}
        onClose={() => setTopupOpen(false)}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ["my-wallet", user.id] });
          qc.invalidateQueries({ queryKey: ["my-wallet-transactions", user.id] });
        }}
      />
    </div>
  );
}
