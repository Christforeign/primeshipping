// @ts-nocheck — legacy pages pending migration to real tables
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  PackagePlus,
  Search,
  ShoppingBag,
  Wallet,
  PlusCircle,
  ArrowRight,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery } from "@/lib/session";
import { useSettings } from "@/lib/settings";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/labels";
import { clientStore } from "@/lib/store";
import { WalletTopupModal } from "@/components/WalletTopupModal";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";
import type { OrderItem } from "@/lib/types-store";

export const Route = createFileRoute("/_authenticated/compte/")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const s = useSettings();
  const rate = s?.usd_to_htg || 132;
  const [topupOpen, setTopupOpen] = useState(false);

  const profile = useQuery(profileQuery(user.id)).data;

  const walletQuery = useQuery({
    queryKey: ["my-wallet", user.id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!error && data) return Number(data.balance_usd) || 0;
      } catch {
        // fallback
      }
      return clientStore.getWalletBalance(user.id);
    },
  });
  const walletBalance = Number(walletQuery.data ?? clientStore.getWalletBalance(user.id)) || 0;

  const pk =
    useQuery({
      queryKey: ["my-packages", user.id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("packages")
          .select("id,tracking_number,description,status,updated_at")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false });
        if (error) throw error;
        return data;
      },
    }).data ?? [];

  const orders =
    useQuery({
      queryKey: ["my-orders-dashboard", user.id],
      queryFn: async () => {
        try {
          const { data, error } = await supabase
            .from("shop_orders")
            .select("*")
            .order("created_at", { ascending: false });
          if (!error && data) return data as unknown as OrderItem[];
        } catch {
          // fallback
        }
        return clientStore.getOrders();
      },
    }).data ?? [];

  const active = pk.filter((p) => !["livre", "retourne"].includes(p.status));
  const ready = pk.filter((p) => p.status === "disponible_retrait");

  return (
    <div className="space-y-6">
      <PushNotificationPrompt />


      {/* Profile & Wallet Banner */}
      <div className="rounded-3xl bg-forest p-5 sm:p-7 text-forest-foreground flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-soft">
        <div className="min-w-0 max-w-full">
          <p className="text-forest-foreground/70">Bienvenue,</p>
          <h1 className="text-2xl sm:text-3xl font-bold break-words">{profile?.full_name || user.email}</h1>
          <p className="mt-3 inline-block rounded-lg bg-accent px-3 py-1 font-mono text-sm font-bold text-accent-foreground">
            Identifiant client : {profile?.client_code ?? "…"}
          </p>
        </div>

        {/* Wallet widget inside header */}
        <div className="rounded-2xl bg-forest/40 border border-forest-foreground/20 p-4 w-full md:w-auto md:min-w-[240px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-forest-foreground/80 flex items-center gap-1.5">
              <Wallet className="h-4 w-4 text-accent" /> Solde Portefeuille
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTopupOpen(true)}
              className="h-7 text-xs text-accent hover:text-white hover:bg-forest/60 px-2"
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1" /> Recharger
            </Button>
          </div>
          <p className="text-2xl font-extrabold text-white mt-1">${walletBalance.toFixed(2)} USD</p>
          <p className="text-xs text-forest-foreground/75">
            ≈ {Math.round(walletBalance * rate).toLocaleString("fr-FR")} HTG
          </p>
        </div>
      </div>

      {ready.length > 0 && (
        <div className="rounded-2xl border-2 border-accent bg-card p-5">
          <p className="font-semibold text-forest">
            Action attendue : {ready.length} colis disponible(s) au retrait.
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Colis en cours" value={active.length} />
        <Stat label="Disponibles au retrait" value={ready.length} />
        <Stat label="Commandes passées" value={orders.length} />
        <Stat label="Total colis enregistrés" value={pk.length} />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/compte/colis/nouveau">
            <PackagePlus /> Déclarer un colis
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/boutique">
            <ShoppingBag /> Boutique & Demande d'achat
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/compte/portefeuille">
            <Wallet /> Mon Portefeuille
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/suivi">
            <Search /> Suivi de colis
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Packages */}
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-forest">Derniers colis</h2>
            <Link to="/compte/colis" className="text-xs font-semibold text-primary hover:underline">
              Voir tout
            </Link>
          </div>

          {pk.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4">Aucun colis pour l'instant.</p>
          ) : (
            <ul className="divide-y text-xs">
              {pk.slice(0, 4).map((p) => (
                <li key={p.id}>
                  <Link
                    to="/compte/colis/$id"
                    params={{ id: p.id }}
                    className="flex items-center justify-between gap-3 py-3 hover:text-primary"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{p.description}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {p.tracking_number} · {formatDate(p.updated_at)}
                      </p>
                    </div>
                    <StatusBadge status={p.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Orders */}
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-forest">Commandes & Achats récents</h2>
            <Link
              to="/compte/commandes"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Voir tout
            </Link>
          </div>

          {orders.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4">Aucune commande pour l'instant.</p>
          ) : (
            <ul className="divide-y text-xs">
              {orders.slice(0, 4).map((o) => (
                <li key={o.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{o.product_title}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {o.order_number} · ${o.total_usd} USD
                    </p>
                  </div>
                  <span className="capitalize font-bold text-[11px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                    {o.status.replace("_", " ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <WalletTopupModal
        userId={user.id}
        userName={user.email}
        isOpen={topupOpen}
        onClose={() => setTopupOpen(false)}
        onSuccess={() => {
          walletQuery.refetch();
        }}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-card p-4 sm:p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-3xl sm:text-4xl font-extrabold text-forest mt-1">{value}</p>
    </div>
  );
}
