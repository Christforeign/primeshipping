import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/settings";
import { readAnnouncement, shouldShowAnnouncement } from "@/lib/site-announcement";

export function SiteAnnouncement() {
  const settings = useSettings();
  const announcement = readAnnouncement((settings as unknown as Record<string, unknown> | null)?.site_announcement);
  const [open, setOpen] = useState(false);
  const version = announcement?.version;
  const enabled = announcement?.enabled;
  const frequency = announcement?.frequency;
  useEffect(() => {
    let dismissed: string | null = null;
    try { dismissed = sessionStorage.getItem("prime-announcement-dismissed"); } catch { /* optional storage */ }
    setOpen(shouldShowAnnouncement(announcement, dismissed));
  }, [version, enabled, frequency]);
  if (!announcement?.enabled) return null;
  const close = () => {
    setOpen(false);
    try { sessionStorage.setItem("prime-announcement-dismissed", announcement.version); } catch { /* optional storage */ }
  };
  return <Dialog open={open} onOpenChange={(value) => { if (!value) close(); }}>
    <DialogContent showCloseButton={false} className={`max-h-[90dvh] overflow-y-auto p-0 ${announcement.size === "compact" ? "sm:max-w-sm" : "sm:max-w-xl"}`}>
      <Button variant="secondary" size="icon" className="sticky top-2 z-10 ml-auto mr-2 mt-2 shrink-0 border border-border" aria-label="Fermer l’annonce" onClick={close}><X className="h-5 w-5" /></Button>
      <div className="px-4 pb-4 space-y-3">
        <DialogTitle className="text-base pr-2">{announcement.title || "Annonce Prime Shipping"}</DialogTitle>
        {announcement.imageUrl && <img src={announcement.imageUrl} alt={announcement.title || "Tarifs Prime Shipping"} className="mx-auto max-h-[62dvh] w-auto max-w-full object-contain" />}
        <DialogDescription className="whitespace-pre-wrap text-sm text-foreground">{announcement.message}</DialogDescription>
      </div>
    </DialogContent>
  </Dialog>;
}