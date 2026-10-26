// @ts-nocheck — legacy pages pending migration to real tables
import { sendClientEmail } from "@/lib/email.functions";
import { useState } from "react";
import {
  Wallet,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/lib/settings";
import { clientStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WalletTopupModalProps {
  userId: string;
  userName?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function WalletTopupModal({
  userId,
  userName,
  isOpen,
  onClose,
  onSuccess,
}: WalletTopupModalProps) {
  const s = useSettings();
  const rate = s?.usd_to_htg || 132;

  const [amountUsd, setAmountUsd] = useState<string>("50");
  const [method, setMethod] = useState<"moncash" | "natcash" | "bank">("moncash");
  const [reference, setReference] = useState<string>("");
  const [proofUrl, setProofUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const numericUsd = parseFloat(amountUsd) || 0;
  const amountHtg = Math.round(numericUsd * rate);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProofUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numericUsd <= 0) {
      return toast.error("Veuillez saisir un montant valide (supérieur à 0).");
    }

    setIsSubmitting(true);
    try {
      const txPayload = {
        wallet_id: `w-${userId}`,
        user_id: userId,
        user_name: userName || "Client",
        type: "topup" as const,
        amount_usd: numericUsd,
        amount_htg: amountHtg,
        method:
          method === "moncash" ? "MonCash" : method === "natcash" ? "Natcash" : "Virement Bancaire",
        reference: reference.trim() || null,
        proof_url: proofUrl || null,
        status: "pending" as const,
        description: `Demande de recharge par ${method.toUpperCase()} (${numericUsd} USD)`,
      };

      const { data: txId, error: rpcErr } = await supabase.rpc("request_wallet_topup", {
        _amount_usd: txPayload.amount_usd,
        _amount_htg: txPayload.amount_htg,
        _method: txPayload.method,
        _reference: txPayload.reference ?? "",
        _proof_url: txPayload.proof_url ?? "",
      });
      if (rpcErr) throw new Error(rpcErr.message);
      if (typeof txId === "string") { try { const r = await sendClientEmail({ data: { kind: "portefeuille", walletTxId: txId } }); if (!r.sent) toast.warning(r.reason); } catch (e) { toast.warning(e instanceof Error ? e.message : "Recharge enregistrée, e-mail non envoyé"); } }

      toast.success(
        "Demande de recharge soumise avec succès ! Notre équipe validera votre solde sous peu.",
      );
      onSuccess();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la soumission");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[60] bg-background overflow-y-auto">
      <div className="relative mx-auto w-full max-w-lg px-4 pt-16 pb-10 sm:pt-20">
        <button
          onClick={onClose}
          aria-label="Fermer" className="fixed top-3 right-3 z-10 p-2.5 rounded-full border bg-card text-foreground shadow-md hover:bg-muted transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-forest text-accent shadow-soft">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-forest">Recharger mon Portefeuille</h2>
            <p className="text-xs text-muted-foreground">
              Créditez votre solde pour régler vos colis et commandes
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Amount input */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider">
              Montant à recharger
            </Label>
            <div className="relative">
              <Input
                type="number"
                min="1"
                step="any"
                value={amountUsd}
                onChange={(e) => setAmountUsd(e.target.value)}
                required
                className="text-lg font-bold pr-16 h-12"
              />
              <span className="absolute right-4 top-3 text-sm font-bold text-muted-foreground">
                USD
              </span>
            </div>
            <div className="flex items-center justify-between text-xs px-1 text-muted-foreground">
              <span>Équivalent estimé en Gourdes :</span>
              <span className="font-semibold text-foreground text-sm">
                {amountHtg.toLocaleString("fr-FR")} HTG
              </span>
            </div>
          </div>

          {/* Quick Amount Pills */}
          <div className="flex gap-2">
            {[20, 50, 100, 250].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmountUsd(String(val))}
                className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                  amountUsd === String(val)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:border-primary/50"
                }`}
              >
                ${val}
              </button>
            ))}
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">
              Mode de versement
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMethod("moncash")}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  method === "moncash"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 font-bold"
                    : "hover:border-primary/40 text-muted-foreground"
                }`}
              >
                <div className="text-sm font-extrabold text-red-600">MonCash</div>
                <div className="text-[10px] mt-0.5">En Gourdes (HTG)</div>
              </button>

              <button
                type="button"
                onClick={() => setMethod("natcash")}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  method === "natcash"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 font-bold"
                    : "hover:border-primary/40 text-muted-foreground"
                }`}
              >
                <div className="text-sm font-extrabold text-blue-600">Natcash</div>
                <div className="text-[10px] mt-0.5">Transfert direct</div>
              </button>

              <button
                type="button"
                onClick={() => setMethod("bank")}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  method === "bank"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 font-bold"
                    : "hover:border-primary/40 text-muted-foreground"
                }`}
              >
                <div className="text-sm font-extrabold text-forest">Banque</div>
                <div className="text-[10px] mt-0.5">USD ou HTG</div>
              </button>
            </div>
          </div>

          {/* Instructions Box */}
          <div className="rounded-2xl bg-secondary/80 border border-primary/20 p-4 text-xs space-y-2">
            <p className="font-bold text-forest uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" /> Coordonnées & Instructions
            </p>

            {method === "moncash" && (
              <div className="space-y-1 text-secondary-foreground">
                <p>
                  Numéro MonCash marchand / particulier :{" "}
                  <strong className="text-foreground font-mono">
                    {s?.moncash_merchant_number || s?.moncash_phone || "+509 3700-1122"}
                  </strong>
                </p>
                <p>
                  Montant à transférer :{" "}
                  <strong className="text-primary font-mono text-sm">
                    {amountHtg.toLocaleString("fr-FR")} HTG
                  </strong>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {s?.moncash_instructions ||
                    "Effectuez le transfert puis indiquez le numéro de transaction ci-dessous."}
                </p>
              </div>
            )}

            {method === "natcash" && (
              <div className="space-y-1 text-secondary-foreground">
                <p>
                  Numéro Natcash :{" "}
                  <strong className="text-foreground font-mono">
                    {s?.natcash_phone || "+509 4200-3344"}
                  </strong>
                </p>
                <p>
                  Montant à transférer :{" "}
                  <strong className="text-primary font-mono text-sm">
                    {amountHtg.toLocaleString("fr-FR")} HTG
                  </strong>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {s?.natcash_instructions || "Effectuez le transfert puis saisissez la référence."}
                </p>
              </div>
            )}

            {method === "bank" && (
              <div className="space-y-1 text-secondary-foreground whitespace-pre-line font-mono text-[11px]">
                {s?.bank_accounts?.trim() ? (
                  s.bank_accounts
                ) : (
                  <span className="text-amber-800 dark:text-amber-300 font-sans italic text-xs block">
                    Coordonnées bancaires en cours de configuration. Veuillez privilégier MonCash ou
                    Natcash pour une recharge immédiate.
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Reference & Proof Inputs */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Numéro de transaction ou référence</Label>
              <Input
                placeholder="Ex : MC-92810398 ou NTC-819203"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Preuve de dépôt ou reçu (capture d'écran)
              </Label>
              {proofUrl ? (
                <div className="flex items-center justify-between p-3 rounded-xl border bg-card text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Preuve jointe avec succès</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProofUrl("")}
                    className="text-destructive font-semibold hover:underline"
                  >
                    Changer
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed hover:border-primary cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-all">
                  <Upload className="h-4 w-4" />
                  <span>Ajouter une capture d'écran du reçu</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full font-bold" disabled={isSubmitting}>
            {isSubmitting ? "Envoi en cours..." : "Confirmer ma demande de recharge"}
          </Button>
        </form>
      </div>
    </div>
  );
}
