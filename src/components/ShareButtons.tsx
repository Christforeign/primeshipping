import { useState } from "react";
import { Share2, Copy, MessageCircle, Music2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyShareLink, nativeShare, shareOnWhatsApp } from "@/lib/share";

/**
 * Boutons de partage : partage natif du téléphone (WhatsApp, TikTok, Messages…),
 * puis raccourcis WhatsApp, TikTok (copie du lien) et copie simple.
 */
export function ShareButtons({ title, url, whatsappText, compact = false }: { title: string; url: string; whatsappText?: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const canNativeShare = typeof navigator !== "undefined" && Boolean(navigator.share);
  const text = whatsappText || title;

  const handleMain = async () => {
    if (canNativeShare) {
      const done = await nativeShare(text, url);
      if (!done) setOpen((prev) => !prev);
    } else {
      setOpen((prev) => !prev);
    }
  };

  return (
    <div className="relative inline-block">
      <Button type="button" variant="outline" size={compact ? "sm" : "default"} onClick={handleMain} className="rounded-2xl font-bold gap-2" aria-expanded={open} aria-label={`Partager ${title}`}>
        <Share2 className="h-4 w-4" /> Partager <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>
      {open && (
        <div className={`absolute z-30 mt-2 w-60 max-w-[calc(100vw-2rem)] rounded-2xl border bg-card/95 backdrop-blur-xl shadow-xl p-2 space-y-1 ${compact ? "left-0" : "right-0"}`} role="menu">
          <button type="button" role="menuitem" onClick={() => { shareOnWhatsApp(text, url); setOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-secondary transition-colors">
            <MessageCircle className="h-4 w-4 text-emerald-500" /> WhatsApp
          </button>
          <button type="button" role="menuitem" onClick={() => { void copyShareLink(url, "Lien copié ! Collez-le dans TikTok."); setOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-secondary transition-colors">
            <Music2 className="h-4 w-4" /> TikTok (copier le lien)
          </button>
          <button type="button" role="menuitem" onClick={() => { void copyShareLink(url); setOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-secondary transition-colors">
            <Copy className="h-4 w-4 text-amber-500" /> Copier le lien
          </button>
        </div>
      )}
    </div>
  );
}
