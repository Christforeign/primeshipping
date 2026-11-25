import { useEffect, useState } from "react";
import { Bell, BellRing, CheckCircle2, Download, Share, X } from "lucide-react";
import { isPushSupported, getPushPermissionStatus, requestPushPermission, type PushPermissionState } from "@/lib/push-notifications";
import { devicePromptState } from "@/lib/device-prompts";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function PushNotificationPrompt({ className = "" }: { className?: string }) {
  const [status, setStatus] = useState<PushPermissionState>("unsupported");
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ios, setIos] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [guide, setGuide] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setStatus(getPushPermissionStatus());
      setStandalone(window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && navigator.standalone === true));
    };
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    refresh();
    try { setDismissed(Date.now() - Number(localStorage.getItem("prime_push_prompt_dismissed_at") || 0) < 3 * 86400000); } catch { /* optional cache */ }
    const beforeInstall = (event: Event) => { event.preventDefault(); setInstall(event as InstallEvent); };
    const installed = () => { setStandalone(true); setInstall(null); setGuide(false); };
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", installed);
    window.addEventListener("focus", refresh);
    window.addEventListener("prime_push_permission_changed", refresh);
    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", installed);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("prime_push_permission_changed", refresh);
    };
  }, []);

  const mode = devicePromptState({ ios, standalone, installAvailable: Boolean(install), permission: status, dismissed });
  if (mode === "none") return null;
  const activate = async () => {
    if (mode === "ios-install") { setGuide(!guide); return; }
    if (mode === "android-install" && install) {
      await install.prompt();
      const choice = await install.userChoice;
      setInstall(null);
      if (choice.outcome === "accepted") setStandalone(true);
      return;
    }
    if (window.top !== window.self) { toast.info("Ouvrez le site dans son propre onglet pour autoriser les notifications."); return; }
    setLoading(true);
    try {
      const result = await requestPushPermission();
      setStatus(result);
      if (result === "granted") toast.success("Alertes activées sur cet appareil.");
      else if (result === "denied") toast.info("Vous pouvez les autoriser dans les réglages de ce site.");
    } finally { setLoading(false); }
  };
  return (
    <section aria-label="Installation et alertes Prime" className={`rounded-lg border border-border bg-card p-3 text-card-foreground shadow-sm ${className}`}>
      <div className="flex items-center gap-3">
        {mode === "permission" ? <BellRing className="h-5 w-5 shrink-0 text-primary" /> : <Download className="h-5 w-5 shrink-0 text-primary" />}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">{mode === "permission" ? "Les nouveautés Prime Store" : "Prime sur votre écran d’accueil"}</p>
          <p className="text-xs text-muted-foreground">{mode === "permission" ? "Offres, produits disponibles et nouvelles de vos colis." : "Votre boutique et vos colis à portée de main."}</p>
        </div>
        <Button size="sm" onClick={activate} disabled={loading}>{loading ? "Activation…" : mode === "permission" ? "Autoriser" : "Installer"}</Button>
        <Button variant="ghost" size="icon" aria-label="Masquer l’invitation" onClick={() => {
          setDismissed(true);
          try { localStorage.setItem("prime_push_prompt_dismissed_at", String(Date.now())); } catch { /* visit only */ }
        }}><X className="h-4 w-4" /></Button>
      </div>
      {guide && <div className="mt-3 border-t border-border pt-3 text-sm space-y-2">
        <p className="flex items-center gap-2"><Share className="h-4 w-4 shrink-0" /> Dans Safari, touchez Partager.</p>
        <p className="flex items-center gap-2"><Download className="h-4 w-4 shrink-0" /> Choisissez « Sur l’écran d’accueil », puis « Ajouter ».</p>
        <p>Ouvrez ensuite Prime depuis son icône pour autoriser les alertes.</p>
      </div>}
    </section>
  );
}

export function PushNotificationButton({ className = "" }: { className?: string }) {
  const [status, setStatus] = useState<PushPermissionState>("unsupported");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const refresh = () => setStatus(getPushPermissionStatus());
    refresh();
    window.addEventListener("prime_push_permission_changed", refresh);
    return () => window.removeEventListener("prime_push_permission_changed", refresh);
  }, []);
  if (status === "unsupported") return null;
  return <Button variant="outline" size="sm" className={className} disabled={loading} onClick={async () => {
    if (status === "granted") { toast.info("Alertes déjà autorisées sur cet appareil."); return; }
    if (!isPushSupported() || window.top !== window.self) { toast.info("Ouvrez le site dans son propre onglet."); return; }
    setLoading(true);
    try { setStatus(await requestPushPermission()); } finally { setLoading(false); }
  }}>
    {status === "granted" ? <CheckCircle2 className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
    {status === "granted" ? "Alertes autorisées" : "Activer les alertes"}
  </Button>;
}
