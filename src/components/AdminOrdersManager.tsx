// @ts-nocheck
import { Label } from "@/components/ui/label";
import React, { useState } from "react";
import type { OrderItem, OrderStatus } from "@/lib/types-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  FileText,
  Eye,
  Trash2,
  Printer,
  Download,
  AlertCircle,
  X,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  orders: OrderItem[];
  onUpdateStatus: (orderId: string, status: OrderStatus, adminNotes?: string) => void;
  onDeleteOrder: (orderId: string) => void;
}

export function AdminOrdersManager({ orders, onUpdateStatus, onDeleteOrder }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [proofModalUrl, setProofModalUrl] = useState<string | null>(null);

  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone.includes(search) ||
      o.product_title.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "en_attente":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 border border-amber-500/30">
            <Clock className="h-3 w-3" /> En attente validation
          </span>
        );
      case "payee":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3" /> Payée / Validée
          </span>
        );
      case "preparation":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-700 border border-blue-500/30">
            <FileText className="h-3 w-3" /> En préparation
          </span>
        );
      case "expediee":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-700 border border-purple-500/30">
            <Truck className="h-3 w-3" /> Expédiée / En route
          </span>
        );
      case "livree":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-600 text-white">
            <CheckCircle2 className="h-3 w-3" /> Livrée au client
          </span>
        );
      case "annulee":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-destructive/10 text-destructive border border-destructive/30">
            <XCircle className="h-3 w-3" /> Annulée
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <h3 className="text-xl font-black text-foreground flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-amber-500" /> Commandes Clients & Preuves (
            {orders.length})
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Consultez les réponses des formulaires dynamiques, téléchargez les preuves de paiement
            et mettez à jour le statut.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par N°, nom, tél..."
            className="rounded-xl text-xs h-9 w-48"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-input bg-background p-2 text-xs font-semibold"
          >
            <option value="all">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="payee">Payée</option>
            <option value="preparation">En préparation</option>
            <option value="expediee">Expédiée</option>
            <option value="livree">Livrée</option>
            <option value="annulee">Annulée</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      {filtered.length === 0 ? (
        <div className="p-12 rounded-3xl border-2 border-dashed text-center bg-muted/20">
          <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
          <h4 className="font-bold text-sm text-foreground">Aucune commande trouvée</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Les nouvelles commandes passées par vos clients apparaîtront instantanément ici.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-4">N° Commande</th>
                  <th className="p-4">Article / Variante</th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Montant</th>
                  <th className="p-4">Paiement & Preuve</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-foreground">
                      {order.order_number}
                      <span className="block text-[10px] text-muted-foreground font-normal">
                        {new Date(order.created_at).toLocaleDateString("fr-FR")}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="font-bold text-foreground block max-w-xs truncate">
                        {order.product_title}
                      </span>
                      {order.variant_name && (
                        <span className="text-[11px] font-semibold text-amber-600 block">
                          Formule : {order.variant_name}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        Qté : {order.quantity}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="font-bold text-foreground block">{order.customer_name}</span>
                      <span className="text-[11px] text-muted-foreground block font-mono">
                        {order.customer_phone}
                      </span>
                      <span className="text-[10px] text-muted-foreground block truncate max-w-xs">
                        {order.delivery_address}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="font-black text-foreground block">
                        {order.total_usd.toFixed(2)} USD
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        ≈ {formatNumber(order.total_htg)} HTG
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="font-bold uppercase text-[11px] px-2 py-0.5 rounded-md bg-muted">
                        {order.payment_method}
                      </span>
                      {order.payment_reference && (
                        <span className="block text-[10px] font-mono text-muted-foreground mt-1 truncate max-w-[120px]">
                          Réf: {order.payment_reference}
                        </span>
                      )}
                      {order.payment_proof_url && (
                        <button
                          type="button"
                          onClick={() => setProofModalUrl(order.payment_proof_url!)}
                          className="mt-1 text-[10px] font-bold text-amber-600 hover:underline flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" /> Voir la preuve
                        </button>
                      )}
                    </td>

                    <td className="p-4">{getStatusBadge(order.status)}</td>

                    <td className="p-4 text-right space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedOrder(order)}
                        className="rounded-xl text-[11px] h-8 px-2.5 font-bold"
                      >
                        Détails
                      </Button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Supprimer la commande ${order.order_number} ?`)) {
                            onDeleteOrder(order.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10"
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-card border shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <span className="text-xs font-black uppercase text-amber-500">Fiche Commande</span>
                <h3 className="text-xl font-black text-foreground">
                  N° {selectedOrder.order_number}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Status Change Selector */}
            <div className="p-4 rounded-2xl bg-secondary/50 border space-y-2">
              <Label className="text-xs font-bold text-foreground">
                Mettre à jour le statut de la commande
              </Label>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    "en_attente",
                    "payee",
                    "preparation",
                    "expediee",
                    "livree",
                    "annulee",
                  ] as OrderStatus[]
                ).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      onUpdateStatus(selectedOrder.id, st);
                      setSelectedOrder({ ...selectedOrder, status: st });
                      toast.success(`Statut mis à jour : ${st}`);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedOrder.status === st
                        ? "bg-amber-500 text-slate-950 shadow-md"
                        : "bg-background border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    {st === "en_attente"
                      ? "En attente"
                      : st === "payee"
                        ? "Payée"
                        : st === "preparation"
                          ? "En préparation"
                          : st === "expediee"
                            ? "Expédiée"
                            : st === "livree"
                              ? "Livrée"
                              : "Annulée"}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Form Answers */}
            {selectedOrder.custom_field_responses &&
              Object.keys(selectedOrder.custom_field_responses).length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                    Réponses au Formulaire Dédié du Produit
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {Object.entries(selectedOrder.custom_field_responses).map(([k, v]) => (
                      <div key={k} className="p-3 rounded-xl border bg-background text-xs">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                          {k}
                        </span>
                        <span className="font-semibold text-foreground break-all">
                          {typeof v === "object" ? JSON.stringify(v) : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Payment Proof View */}
            {selectedOrder.payment_proof_url && (
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                  Preuve de Paiement Fournie
                </h4>
                <div className="rounded-2xl border p-2 bg-background flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600">
                    Capture / Document joint ({selectedOrder.payment_proof_name || "Preuve"})
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setProofModalUrl(selectedOrder.payment_proof_url!)}
                    className="rounded-xl text-xs font-bold"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" /> Agrandir
                  </Button>
                </div>
              </div>
            )}

            {/* Client Coordinates */}
            <div className="space-y-2 text-xs border-t pt-4">
              <h4 className="font-black uppercase text-muted-foreground text-[11px]">
                Coordonnées Client & Livraison
              </h4>
              <p>
                <strong>Nom :</strong> {selectedOrder.customer_name}
              </p>
              <p>
                <strong>Téléphone :</strong> {selectedOrder.customer_phone}
              </p>
              <p>
                <strong>Email :</strong> {selectedOrder.customer_email}
              </p>
              <p>
                <strong>Adresse de livraison :</strong> {selectedOrder.delivery_address}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Proof Lightbox Modal */}
      {proofModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative max-w-3xl max-h-[90vh] rounded-2xl overflow-hidden bg-card border p-2">
            <button
              type="button"
              onClick={() => setProofModalUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/70 text-white hover:bg-black"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={proofModalUrl}
              alt="Preuve de paiement"
              className="max-h-[85vh] w-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
