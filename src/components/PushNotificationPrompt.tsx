import { useEffect, useState } from "react";
import { Bell, BellRing, CheckCircle2, ShieldCheck, X } from "lucide-react";
import {
  isPushSupported,
  getPushPermissionStatus,
  requestPushPermission,
  type PushPermissionState,
} from "@/lib/push-notifications";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function PushNotificationPrompt({ className = "" }: { className?: string }) {
  const [status, setStatus] = useState<PushPermissionState>("default");
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(isPushSupported());
    setStatus(getPushPermissionStatus());
    try {
      if (localStorage.getItem("prime_push_prompt_dismissed") === "true") setDismissed(true);
    } catch { /* Safari may deny optional device storage. */ }
  }, []);

  if (!supported || status === "granted" || dismissed) {
    return null;
  }

  const handleActivate = async () => {
    setLoading(true);
    const result = await requestPushPermission();
    setStatus(result);
    setLoading(false);
    if (result === "granted") {
      toast.success("Notifications activées !", {
        description: "Vous recevrez des alertes dès l'arrivée ou le dédouanement de vos colis.",
      });
    } else if (result === "denied") {
      toast.info("Notifications refusées dans les paramètres du navigateur.");
      setDismissed(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try { localStorage.setItem("prime_push_prompt_dismissed", "true"); } catch { /* dismissed for this visit */ }
  };

  return (
    <div
      className={`rounded-2xl border border-sun/40 bg-gradient-to-r from-forest/90 via-forest to-emerald/80 p-3.5 text-forest-foreground shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs w-full max-w-full overflow-hidden ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0 w-full">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-sun text-forest font-bold shrink-0 shadow-xs">
          <BellRing className="h-4 w-4 animate-pulse" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-white text-[13px] leading-tight">
            Alertes Colis & Suivi en direct sur mobile
          </p>
          <p className="text-[11px] text-forest-foreground/80">
            Soyez notifié dès qu'un colis arrive à Miami ou est prêt en Haïti.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 shrink-0 self-end sm:self-auto">
        <Button
          type="button"
          size="sm"
          onClick={handleActivate}
          disabled={loading}
          className="h-7.5 px-3 rounded-xl bg-sun text-forest hover:bg-sun/90 font-black text-xs shadow-xs"
        >
          {loading ? "Activation..." : "Activer"}
        </Button>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-lg text-forest-foreground/70 hover:text-white hover:bg-white/10 transition-colors"
          title="Masquer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function PushNotificationButton({ className = "" }: { className?: string }) {
  const [status, setStatus] = useState<PushPermissionState>("default");
  const [loading, setLoading] = useState(false);

  const [supported, setSupported] = useState(false);
  useEffect(() => {
    setSupported(isPushSupported());
    setStatus(getPushPermissionStatus());
  }, []);

  if (!supported) return null;

  const handleToggle = async () => {
    if (status === "granted") {
      toast.info("Notifications déjà activées pour Prime Shipping sur cet appareil.");
      return;
    }
    setLoading(true);
    const result = await requestPushPermission();
    setStatus(result);
    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
        status === "granted"
          ? "bg-emerald/15 text-emerald border border-emerald/30"
          : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 border border-border"
      } ${className}`}
      title={
        status === "granted"
          ? "Notifications push activées"
          : "Cliquer pour autoriser les alertes push"
      }
    >
      {status === "granted" ? (
        <>
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald" />
          <span className="hidden sm:inline">Alertes Push ON</span>
        </>
      ) : (
        <>
          <Bell className="h-3.5 w-3.5 text-sun" />
          <span>Activer Alertes</span>
        </>
      )}
    </button>
  );
}
