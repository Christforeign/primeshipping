// @ts-nocheck — legacy pages pending migration to real tables
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  AlertCircle,
  ArrowRight,
  Eye,
  Printer,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { clientStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import type { OrderItem, OrderStatus } from "@/lib/types-store";

export const Route = createFileRoute("/_authenticated/compte/commandes")({
  component: MyOrdersPage,
});

const STATUS_CONFIG: Record<OrderStatus, { label: string; tone: string; icon: LucideIcon }> = {
  en_attente: {
    label: "En attente de validation",
    tone: "bg-amber-100 text-amber-800 border-amber-300",
    icon: Clock,
  },
  payee: {
    label: "Payée / Validée",
    tone: "bg-emerald-100 text-emerald-800 border-emerald-300",
    icon: CheckCircle2,
  },
  preparation: {
    label: "En préparation",
    tone: "bg-blue-100 text-blue-800 border-blue-300",
    icon: PackageCheck,
  },
  expediee: {
    label: "Expédiée vers Haïti",
    tone: "bg-purple-100 text-purple-800 border-purple-300",
    icon: Truck,
  },
  livree: {
    label: "Livrée / Retirée",
    tone: "bg-green-100 text-green-800 border-green-300",
    icon: CheckCircle2,
  },
  annulee: { label: "Annulée", tone: "bg-red-100 text-red-800 border-red-300", icon: AlertCircle },
};

function MyOrdersPage() {
  const { user } = Route.useRouteContext();
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);

  const ordersQuery = useQuery({
    queryKey: ["my-orders", user.id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("shop_orders")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && data) {
          return data as unknown as OrderItem[];
        }
      } catch {
        // fallback
      }
      return clientStore.getOrders();
    },
  });

  const orders = ordersQuery.data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes commandes & achats"
        subtitle="Suivez l'avancement en direct de vos achats assistés et commandes passées en boutique."
      >
        <Button asChild size="sm">
          <Link to="/boutique">
            <ShoppingBag className="h-4 w-4 mr-2" /> Passer une commande
          </Link>
        </Button>
      </PageHeader>

      {ordersQuery.isLoading ? (
        <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
          Chargement de vos commandes...
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border bg-card p-12 text-center shadow-soft">
          <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-bold text-forest">Aucune commande pour l'instant</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Vous n'avez pas encore passé de commande d'achat assisté ou d'article en boutique.
          </p>
          <Button asChild className="mt-5 rounded-full" size="sm">
            <Link to="/boutique">Découvrir la Boutique</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.en_attente;
            const Icon = cfg.icon;

            return (
              <div
                key={order.id}
                className="rounded-2xl border bg-card p-5 shadow-soft hover:border-primary/50 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                      {order.order_number}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-forest truncate">
                    {order.product_title} {order.quantity > 1 && `(x${order.quantity})`}
                  </h3>

                  <p className="text-xs text-muted-foreground">
                    Livraison :{" "}
                    <span className="font-medium text-foreground">{order.delivery_address}</span> ·
                    Paiement :{" "}
                    <span className="capitalize font-medium text-foreground">
                      {order.payment_method}
                    </span>
                  </p>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0">
                  <div className="text-left md:text-right">
                    <p className="text-base font-extrabold text-forest">{order.total_usd} USD</p>
                    <p className="text-xs text-muted-foreground">
                      {order.total_htg ? `${order.total_htg.toLocaleString("fr-FR")} HTG` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.tone}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {cfg.label}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                      className="rounded-full"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-card border shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div>
                <span className="text-xs font-bold font-mono text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                  {selectedOrder.order_number}
                </span>
                <h3 className="text-lg font-bold text-forest mt-1.5">
                  {selectedOrder.product_title}
                </h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)}>
                Fermer
              </Button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-muted/60 border">
                <div>
                  <span className="text-muted-foreground">Destinataire :</span>
                  <p className="font-semibold text-foreground">{selectedOrder.customer_name}</p>
                  <p className="text-muted-foreground">{selectedOrder.customer_phone}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Adresse :</span>
                  <p className="font-semibold text-foreground">{selectedOrder.delivery_address}</p>
                </div>
              </div>

              {selectedOrder.custom_field_responses &&
                Object.keys(selectedOrder.custom_field_responses).length > 0 && (
                  <div className="p-3.5 rounded-2xl border space-y-2">
                    <p className="font-bold text-forest uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-primary" /> Spécifications de la commande
                    </p>
                    {Object.entries(selectedOrder.custom_field_responses).map(([k, v]) => (
                      <div key={k} className="border-t pt-1.5">
                        <span className="text-muted-foreground">{k} :</span>
                        <p className="font-medium text-foreground break-all">{v || "—"}</p>
                      </div>
                    ))}
                  </div>
                )}

              <div className="p-3.5 rounded-2xl bg-secondary/80 border border-primary/20 space-y-1.5">
                <div className="flex justify-between">
                  <span>Sous-total article(s) :</span>
                  <span>{selectedOrder.subtotal_usd} USD</span>
                </div>
                {selectedOrder.tax_amount_usd > 0 && (
                  <div className="flex justify-between">
                    <span>Taxes :</span>
                    <span>{selectedOrder.tax_amount_usd} USD</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Frais de service :</span>
                  <span>{selectedOrder.service_fee_usd} USD</span>
                </div>
                <div className="border-t pt-1.5 flex justify-between font-bold text-sm text-forest">
                  <span>Total payé / dû :</span>
                  <span>
                    {selectedOrder.total_usd} USD (
                    {selectedOrder.total_htg?.toLocaleString("fr-FR")} HTG)
                  </span>
                </div>
              </div>

              {selectedOrder.payment_reference && (
                <div className="text-muted-foreground">
                  Référence de transaction :{" "}
                  <span className="font-mono font-bold text-foreground">
                    {selectedOrder.payment_reference}
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-1.5" /> Imprimer
                </Button>
                <Button size="sm" onClick={() => setSelectedOrder(null)}>
                  OK
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
