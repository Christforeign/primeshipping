import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  ArrowRight,
  DollarSign,
  Bell,
  Plane,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useSettings } from "@/lib/settings";

export function PromoBanner() {
  const s = useSettings();
  const [minimized, setMinimized] = useState(false);

  const rate = Number(s?.usd_to_htg) || null;
  const shippingRate = s?.shipping_rate_per_lb || null;
  const bannerText =
    s?.promo_banner_text ||
    `🚀 Expéditions USA ➔ Haïti chaque semaine • ${rate ? `Taux officiel : 1 USD = ${rate} HTG` : "Taux du jour en boutique"}${shippingRate ? ` • Aérien ${shippingRate}$/lb` : ""} • Service « Achetez pour moi » disponible !`;

  if (minimized) {
    return (
      <div className="relative z-50 bg-forest text-forest-foreground border-b border-accent/20 py-1 px-4 text-xs">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 font-bold text-accent">
              <DollarSign className="h-3 w-3" /> {rate ? `1 USD = ${rate} HTG` : "Prime Shipping"}
            </span>
            <span className="hidden sm:inline text-forest-foreground/80">
              • Expéditions régulières vers Haïti
            </span>
          </div>
          <button
            onClick={() => setMinimized(false)}
            className="inline-flex items-center gap-1 font-semibold text-accent hover:underline text-[11px]"
          >
            Afficher les annonces <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-50 bg-gradient-to-r from-forest via-primary/35 to-forest text-forest-foreground border-b border-accent/30 py-2.5 px-4 shadow-md text-xs sm:text-sm">
      <div className="mx-auto max-w-7xl flex items-center justify-between gap-3">
        {/* Left: Badge Taux + Live text */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="flex-shrink-0 inline-flex items-center gap-1 rounded-full bg-accent text-accent-foreground px-2.5 py-0.5 text-xs font-extrabold shadow-sm">
            <Sparkles className="h-3 w-3 animate-pulse" />{rate ? `1 USD = ${rate} HTG` : "Prime"}
          </span>

          <p className="truncate font-medium text-xs sm:text-sm tracking-tight text-white">
            {bannerText}
          </p>

          <Link
            to="/achat"
            className="hidden md:inline-flex items-center gap-1 font-bold text-accent hover:text-white transition-colors text-xs ml-1 flex-shrink-0 underline decoration-accent/50 underline-offset-2"
          >
            Achetez pour moi <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Right: Quick shortcuts & minimize */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            to="/suivi"
            className="hidden lg:inline-flex items-center gap-1 text-[11px] font-semibold bg-white/10 hover:bg-white/20 text-white px-2 py-0.5 rounded-full transition-colors"
          >
            <Plane className="h-3 w-3 text-accent" /> Suivi colis
          </Link>

          <button
            onClick={() => setMinimized(true)}
            className="p-1 text-forest-foreground/80 hover:text-white rounded-md transition-colors"
            title="Réduire le bandeau"
            aria-label="Réduire la bannière"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
