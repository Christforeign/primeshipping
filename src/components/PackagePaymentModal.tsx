// @ts-nocheck — legacy pages pending migration to real tables
import { useState } from "react";
import { Wallet, CheckCircle2, AlertTriangle, ArrowRight, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/lib/settings";
import { clientStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PackagePaymentModalProps {
  packageData: {
    id: string;
    tracking_number: string;
    description: string;
    shipping_fee: number | null;
    extra_fees: number | null;
    paid_amount_usd?: number;
    total_due_usd?: number;
    payment_status?: "unpaid" | "partial" | "paid";
  };
  userWalletBalance: number;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onOpenTopup: () => void;
}

export function PackagePaymentModal({
  packageData,
  userWalletBalance,
  userId,
  isOpen,
  onClose,
  onSuccess,
  onOpenTopup,
}: PackagePaymentModalProps) {
  const s = useSettings();
  const rate = s?.usd_to_htg || 132;

  const totalFeeUsd =
    packageData.total_due_usd ?? (packageData.shipping_fee ?? 0) + (packageData.extra_fees ?? 0);
  const paidUsd = packageData.paid_amount_usd ?? 0;
  const remainingDueUsd = Math.max(0, Number((totalFeeUsd - paidUsd).toFixed(2)));

  const [paymentType, setPaymentType] = useState<"full" | "partial">("full");
  const [partialAmount, setPartialAmount] = useState<string>(
    remainingDueUsd > 0
      ? String(Math.min(remainingDueUsd, userWalletBalance > 0 ? userWalletBalance : 10))
      : "0",
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const amountToPay = paymentType === "full" ? remainingDueUsd : parseFloat(partialAmount) || 0;
  const amountToPayHtg = Math.round(amountToPay * rate);

  const canPay = userWalletBalance >= amountToPay && amountToPay > 0;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amountToPay <= 0) {
      return toast.error("Veuillez saisir un montant valide.");
    }
    if (amountToPay > remainingDueUsd) {
      return toast.error("Le montant saisi dépasse le solde restant dû pour ce colis.");
    }
    if (userWalletBalance < amountToPay) {
      return toast.error(
        "Solde insuffisant dans votre portefeuille. Veuillez d'abord le recharger.",
      );
    }

    setIsSubmitting(true);
    try {
      const newPaidAmount = Number((paidUsd + amountToPay).toFixed(2));
      const isNowFullyPaid = newPaidAmount >= totalFeeUsd;
      const newStatus = isNowFullyPaid ? "paid" : "partial";
      const newBalance = Number((userWalletBalance - amountToPay).toFixed(2));

      // 1. Sync clientStore
      clientStore.setWalletBalance(userId, newBalance);
      clientStore.setPackagePaidAmount(packageData.id, newPaidAmount);
      clientStore.addWalletTransaction({
        wallet_id: `w-${userId}`,
        user_id: userId,
        type: "debit",
        amount_usd: amountToPay,
        amount_htg: amountToPayHtg,
        method: "Portefeuille",
        reference: `COLIS-${packageData.tracking_number}`,
        package_id: packageData.id,
        status: "approved",
        description: isNowFullyPaid
          ? `Règlement total frais de transport colis ${packageData.tracking_number}`
          : `Acompte partiel (${amountToPay} USD) pour colis ${packageData.tracking_number}`,
      });

      // 2. Persist to Supabase if available
      try {
        await supabase.from("wallets").update({ balance_usd: newBalance }).eq("user_id", userId);

        await supabase.from("wallet_transactions").insert({
          wallet_id: `w-${userId}`,
          user_id: userId,
          type: "debit",
          amount_usd: amountToPay,
          amount_htg: amountToPayHtg,
          method: "Portefeuille",
          reference: `COLIS-${packageData.tracking_number}`,
          package_id: packageData.id,
          status: "approved",
          description: isNowFullyPaid
            ? `Règlement total frais de transport colis ${packageData.tracking_number}`
            : `Acompte partiel (${amountToPay} USD) pour colis ${packageData.tracking_number}`,
        });

        await supabase
          .from("packages")
          .update({
            paid_amount_usd: newPaidAmount,
            total_due_usd: totalFeeUsd,
            payment_status: newStatus,
          })
          .eq("id", packageData.id);

        await supabase.from("package_events").insert({
          package_id: packageData.id,
          status: newStatus === "paid" ? "disponible_retrait" : "preparation",
          note: isNowFullyPaid
            ? `Frais de transport 100% soldés via Portefeuille (${amountToPay} USD). Prêt pour retrait/livraison.`
            : `Paiement d'acompte de ${amountToPay} USD reçu via Portefeuille. Reste dû : ${(totalFeeUsd - newPaidAmount).toFixed(2)} USD.`,
          is_internal: false,
        });
      } catch (e) {
        console.warn("Supabase package payment update fallback:", e);
      }

      toast.success(
        isNowFullyPaid
          ? "Frais de transport intégralement réglés ! Votre colis est prêt pour retrait ou livraison."
          : `Acompte de ${amountToPay} USD validé avec succès.`,
      );

      onSuccess();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors du règlement");
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
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
              Règlement exclusif par Portefeuille
            </span>
            <h2 className="text-xl font-bold text-forest leading-tight">
              Payer les frais de transport
            </h2>
          </div>
        </div>

        {/* Package summary info */}
        <div className="rounded-2xl bg-muted/60 p-4 space-y-2 text-xs border mb-5">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Numéro de suivi :</span>
            <span className="font-mono font-bold text-foreground">
              {packageData.tracking_number}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Description :</span>
            <span className="font-semibold text-foreground truncate max-w-[200px]">
              {packageData.description}
            </span>
          </div>
          <div className="border-t pt-2 flex justify-between font-bold text-sm">
            <span>Frais totaux d'expédition :</span>
            <span className="text-forest">
              {totalFeeUsd.toFixed(2)} USD ({(totalFeeUsd * rate).toLocaleString("fr-FR")} HTG)
            </span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Déjà payé :</span>
            <span>{paidUsd.toFixed(2)} USD</span>
          </div>
          <div className="flex justify-between text-xs font-bold text-primary">
            <span>Reste à payer :</span>
            <span>
              {remainingDueUsd.toFixed(2)} USD ({(remainingDueUsd * rate).toLocaleString("fr-FR")}{" "}
              HTG)
            </span>
          </div>
        </div>

        {/* User wallet balance */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/80 border border-primary/20 mb-5">
          <div className="flex items-center gap-2.5">
            <Wallet className="h-5 w-5 text-primary" />
            <div>
              <p className="text-[11px] font-medium text-secondary-foreground">
                Solde de votre Portefeuille
              </p>
              <p className="font-extrabold text-forest text-base">
                {userWalletBalance.toFixed(2)} USD{" "}
                <span className="text-xs text-muted-foreground font-normal">
                  ({(userWalletBalance * rate).toLocaleString("fr-FR")} HTG)
                </span>
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onClose();
              onOpenTopup();
            }}
          >
            Recharger
          </Button>
        </div>

        <form onSubmit={handlePay} className="space-y-4">
          {/* Payment option: Full vs Tranche / Acompte */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">
              Option de paiement
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentType("full")}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  paymentType === "full"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 font-bold"
                    : "hover:border-primary/40 text-muted-foreground"
                }`}
              >
                <div className="text-xs sm:text-sm font-bold">
                  Totalité ({remainingDueUsd.toFixed(2)} USD)
                </div>
                <div className="text-[10px] mt-0.5">Règlement complet</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType("partial")}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  paymentType === "partial"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 font-bold"
                    : "hover:border-primary/40 text-muted-foreground"
                }`}
              >
                <div className="text-xs sm:text-sm font-bold">Par tranches (Acompte)</div>
                <div className="text-[10px] mt-0.5">Montant libre</div>
              </button>
            </div>
          </div>

          {/* Partial amount input if partial selected */}
          {paymentType === "partial" && (
            <div className="space-y-1.5 animate-in fade-in duration-150">
              <Label className="text-xs font-semibold">Montant de l'acompte à débiter (USD)</Label>
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  max={remainingDueUsd}
                  step="any"
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                  required
                  className="font-bold text-base h-11 pr-16"
                />
                <span className="absolute right-4 top-2.5 text-xs font-bold text-muted-foreground">
                  USD
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Équivalent : {amountToPayHtg.toLocaleString("fr-FR")} HTG — Vous pourrez solder le
                reste ultérieurement.
              </p>
            </div>
          )}

          {/* Warning if insufficient balance */}
          {!canPay && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Solde portefeuille insuffisant</p>
                <p className="mt-0.5">
                  Il vous manque {(amountToPay - userWalletBalance).toFixed(2)} USD pour ce
                  règlement. Veuillez recharger votre portefeuille.
                </p>
              </div>
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              size="lg"
              className="w-full font-bold"
              disabled={!canPay || isSubmitting}
            >
              {isSubmitting
                ? "Règlement en cours..."
                : `Confirmer le paiement (${amountToPay.toFixed(2)} USD)`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
