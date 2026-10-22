// @ts-nocheck
import React, { useState } from "react";
import type { AdminPaymentConfig } from "@/lib/types-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CreditCard,
  Plus,
  Trash2,
  Check,
  Edit2,
  Save,
  QrCode,
  ShieldCheck,
  DollarSign,
  Layers,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  configs: AdminPaymentConfig[];
  onChange: (configs: AdminPaymentConfig[]) => void;
}

export function AdminPaymentsManager({ configs, onChange }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);

  // New method modal state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [newInstructions, setNewInstructions] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAccount, setNewAccount] = useState("");
  const [newFeePercent, setNewFeePercent] = useState<number>(0);
  const [newFeeFixed, setNewFeeFixed] = useState<number>(0);
  const [newRequireProof, setNewRequireProof] = useState(true);

  // Toggle enabled
  const handleToggle = (id: string) => {
    const updated = configs.map((c) => (c.id === id ? { ...c, is_enabled: !c.is_enabled } : c));
    onChange(updated);
    toast.success("Statut du mode de paiement mis à jour.");
  };

  // Update config
  const handleUpdate = (id: string, updates: Partial<AdminPaymentConfig>) => {
    const updated = configs.map((c) => (c.id === id ? { ...c, ...updates } : c));
    onChange(updated);
  };

  // Delete custom config
  const handleDelete = (id: string) => {
    onChange(configs.filter((c) => c.id !== id));
    toast.success("Mode de paiement supprimé.");
  };

  // Create new method
  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const id = newId.trim().toLowerCase().replace(/\s+/g, "_") || `custom_${Date.now()}`;
    const newConfig: AdminPaymentConfig = {
      id,
      name: newName.trim(),
      is_enabled: true,
      instructions:
        newInstructions.trim() ||
        "Veuillez effectuer votre paiement selon les consignes ci-dessus.",
      phone_number: newPhone.trim() || undefined,
      account_number: newAccount.trim() || undefined,
      fee_percentage: Number(newFeePercent) || 0,
      fee_fixed_usd: Number(newFeeFixed) || 0,
      require_proof: newRequireProof,
    };

    onChange([...configs, newConfig]);
    setIsAddingNew(false);
    setNewId("");
    setNewName("");
    setNewInstructions("");
    setNewPhone("");
    setNewAccount("");
    setNewFeePercent(0);
    setNewFeeFixed(0);
    toast.success(`Mode de paiement « ${newConfig.name} » ajouté avec succès.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b">
        <div>
          <h3 className="text-xl font-black text-foreground flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-amber-500" /> Gestion des Passerelles & Modes de
            Paiement
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Activez, désactivez ou personnalisez les consignes, numéros, frais et preuves de
            paiement pour chaque passerelle.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setIsAddingNew(true)}
          className="rounded-2xl font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs shadow-md"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Ajouter un mode personnalisé
        </Button>
      </div>

      {/* Grid of Payment Configs */}
      <div className="grid gap-4 sm:grid-cols-2">
        {configs.map((pay) => {
          const isEditing = editingId === pay.id;

          return (
            <div
              key={pay.id}
              className={`rounded-3xl border p-5 bg-card shadow-sm space-y-4 transition-all ${
                pay.is_enabled ? "border-slate-300" : "border-dashed opacity-60 bg-muted/20"
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between gap-2 border-b pb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      pay.is_enabled ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  />
                  <div>
                    <h4 className="font-extrabold text-sm text-foreground">{pay.name}</h4>
                    <span className="font-mono text-[10px] text-muted-foreground uppercase">
                      ID: {pay.id}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggle(pay.id)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                      pay.is_enabled
                        ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {pay.is_enabled ? "Actif" : "Désactivé"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingId(isEditing ? null : pay.id)}
                    className="p-1.5 rounded-lg border text-muted-foreground hover:text-foreground hover:bg-muted"
                    title="Modifier"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(pay.id)}
                    className="p-1.5 rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/10"
                    title="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Quick Details / Summary */}
              {!isEditing ? (
                <div className="space-y-2 text-xs">
                  {pay.phone_number && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Numéro téléphone / WhatsApp :</span>
                      <span className="font-mono font-bold">{pay.phone_number}</span>
                    </div>
                  )}
                  {pay.account_number && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Compte / Adresse / Clé :</span>
                      <span className="font-mono font-bold truncate max-w-[180px]">
                        {pay.account_number}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frais passerelle :</span>
                    <span className="font-bold">
                      {pay.fee_percentage ? `+${pay.fee_percentage}%` : "0%"}{" "}
                      {pay.fee_fixed_usd ? `+ ${pay.fee_fixed_usd}$` : ""}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preuve obligatoire :</span>
                    <span className="font-bold">
                      {pay.require_proof ? "Oui (Capture/Reçu requis)" : "Non (Validation directe)"}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed pt-1 border-t line-clamp-2">
                    {pay.instructions}
                  </p>
                </div>
              ) : (
                /* Edit Mode */
                <div className="space-y-3 pt-2 text-xs">
                  <div>
                    <Label className="text-[11px] font-bold">Nom affiché</Label>
                    <Input
                      value={pay.name}
                      onChange={(e) => handleUpdate(pay.id, { name: e.target.value })}
                      className="rounded-xl text-xs h-9"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px] font-bold">Téléphone / WhatsApp</Label>
                      <Input
                        value={pay.phone_number || ""}
                        onChange={(e) => handleUpdate(pay.id, { phone_number: e.target.value })}
                        placeholder="+509 3700-0000"
                        className="rounded-xl text-xs h-9 font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] font-bold">N° Compte / Identifiant</Label>
                      <Input
                        value={pay.account_number || ""}
                        onChange={(e) => handleUpdate(pay.id, { account_number: e.target.value })}
                        placeholder="Ex : 001-2394..."
                        className="rounded-xl text-xs h-9 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px] font-bold">Frais en %</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={pay.fee_percentage ?? 0}
                        onChange={(e) =>
                          handleUpdate(pay.id, { fee_percentage: parseFloat(e.target.value) || 0 })
                        }
                        className="rounded-xl text-xs h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] font-bold">Frais fixes ($ USD)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={pay.fee_fixed_usd ?? 0}
                        onChange={(e) =>
                          handleUpdate(pay.id, { fee_fixed_usd: parseFloat(e.target.value) || 0 })
                        }
                        className="rounded-xl text-xs h-9"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-[11px] font-bold">
                      Instructions affichées au client
                    </Label>
                    <Textarea
                      value={pay.instructions}
                      onChange={(e) => handleUpdate(pay.id, { instructions: e.target.value })}
                      rows={2}
                      className="rounded-xl text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pay.require_proof}
                        onChange={(e) => handleUpdate(pay.id, { require_proof: e.target.checked })}
                        className="rounded accent-amber-500"
                      />
                      Exiger une preuve (capture/reçu)
                    </label>

                    <Button
                      size="sm"
                      onClick={() => setEditingId(null)}
                      className="rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 h-8 px-3"
                    >
                      <Check className="h-3.5 w-3.5 mr-1" /> Terminé
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Custom Method Modal */}
      {isAddingNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-card border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-foreground">
                Ajouter un Nouveau Mode de Paiement
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="p-1.5 text-muted-foreground hover:bg-muted rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNew} className="space-y-3 text-xs">
              <div>
                <Label className="text-xs font-bold">Nom du mode de paiement *</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex : Transfert Zelle Pro, Western Union..."
                  required
                  className="rounded-xl text-xs h-9 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold">Identifiant / Clé (Unique)</Label>
                  <Input
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    placeholder="Ex : zelle_pro, western_union"
                    className="rounded-xl text-xs h-9 mt-1 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">Numéro ou Téléphone</Label>
                  <Input
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+509 ... ou email"
                    className="rounded-xl text-xs h-9 mt-1 font-mono"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold">Numéro de Compte / Adresse de réception</Label>
                <Input
                  value={newAccount}
                  onChange={(e) => setNewAccount(e.target.value)}
                  placeholder="Ex : 002-392910... ou adresse crypto"
                  className="rounded-xl text-xs h-9 mt-1 font-mono"
                />
              </div>

              <div>
                <Label className="text-xs font-bold">Instructions pour le client</Label>
                <Textarea
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  placeholder="Expliquez comment envoyer les fonds et quoi faire ensuite..."
                  rows={2}
                  className="rounded-xl text-xs mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold">Frais (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newFeePercent}
                    onChange={(e) => setNewFeePercent(parseFloat(e.target.value) || 0)}
                    className="rounded-xl text-xs h-9 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">Frais fixes ($)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newFeeFixed}
                    onChange={(e) => setNewFeeFixed(parseFloat(e.target.value) || 0)}
                    className="rounded-xl text-xs h-9 mt-1"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={newRequireProof}
                  onChange={(e) => setNewRequireProof(e.target.checked)}
                  className="rounded accent-amber-500"
                />
                Exiger une preuve de paiement (capture / document)
              </label>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsAddingNew(false)}
                  className="rounded-xl text-xs"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-5"
                >
                  Créer la passerelle
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
