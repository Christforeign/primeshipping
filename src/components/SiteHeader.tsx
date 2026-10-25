// @ts-nocheck
import { Link, useNavigate } from "@tanstack/react-router";
import logoImg from "@/assets/logo.png";
import { useQueryClient } from "@tanstack/react-query";
import {
  Menu,
  X,
  Wallet,
  HelpCircle,
  ShieldAlert,
  Plane,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/settings";
import { signOut, useRoles, useUser } from "@/lib/session";
import { triggerTutorial } from "@/components/InteractiveTutorial";
import { NotificationBell } from "@/components/NotificationBell";
import { PushNotificationButton } from "@/components/PushNotificationPrompt";

const NAV = [
  { to: "/", label: "Accueil" },
  { to: "/compte/colis", label: "Prime Shipping", highlight: "orange" },
  { to: "/suivi", label: "Suivi" },
  { to: "/boutique", label: "Prime Store", highlight: "gold" },
  { to: "/achat", label: "Achetez pour moi" },
  { to: "/services", label: "Services & Tarifs" },
  { to: "/faq", label: "FAQ" },
  { to: "/support", label: "Support" },
] as const;

export function SiteHeader() {
  const s = useSettings();
  const { user } = useUser();
  const { isAdmin } = useRoles(user?.id);

  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const name = s?.company_name ?? "Prime Shipping";

  const logout = async () => {
    await signOut(() => qc.clear());
    navigate({ to: "/auth", replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#0a1128]/95 text-white backdrop-blur-md shadow-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        {/* Brand Logo & Name */}
        <Link
          to="/"
          className="flex items-center gap-3 font-display text-lg font-black tracking-tight flex-shrink-0 group"
        >
          <img
            src="/logos/prime-shipping-logo.svg"
            alt="Prime Express Shipping"
            className="h-10 w-auto max-w-[150px] object-contain group-hover:scale-105 transition-transform"
          />
          <div className="hidden sm:block">
            <span className="text-white text-base font-black block leading-tight tracking-tight">
              PRIME EXPRESS
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-500 block leading-tight">
              Shipping & Logistics
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => {
            const isShipping = n.highlight === "orange";
            const isStore = n.highlight === "gold";
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  isShipping
                    ? "text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                    : isStore
                      ? "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
                activeProps={{
                  className:
                    "bg-white/10 text-white font-extrabold shadow-sm border border-white/10",
                }}
                activeOptions={{ exact: n.to === "/" }}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls & Account */}
        <div className="flex items-center gap-2">
          <PushNotificationButton className="hidden sm:inline-flex" />
          <NotificationBell />

          <div className="hidden items-center gap-2 lg:flex">
            <button
              onClick={triggerTutorial}
              title="Guide interactif"
              className="flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors mr-1"
            >
              <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
              <span>Guide</span>
            </button>

            {user ? (
              <>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="font-bold border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs h-9"
                >
                  <Link to="/compte/portefeuille">
                    <Wallet className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
                    Portefeuille
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black rounded-xl text-xs h-9 shadow-sm"
                >
                  <Link to="/compte">Mon espace</Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-slate-400 hover:text-white text-xs h-9"
                >
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-slate-300 hover:text-white rounded-xl text-xs h-9"
                >
                  <Link to="/auth">Connexion</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black rounded-xl text-xs h-9 shadow-md"
                >
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Créer un compte
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile hamburger button */}
          <button
            className="lg:hidden p-2 text-slate-300 hover:text-white"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="border-t border-slate-800 bg-[#070b14] px-4 pb-6 pt-2 lg:hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <nav className="divide-y divide-slate-800">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between py-3 text-sm font-semibold text-slate-200 hover:text-white"
              >
                <span>{n.label}</span>
                <ArrowRight className="h-4 w-4 text-slate-500" />
              </Link>
            ))}
          </nav>

          <div className="mt-4 flex flex-col gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                setOpen(false);
                triggerTutorial();
              }}
              className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-300 border border-slate-700 py-2.5 rounded-xl hover:bg-slate-800"
            >
              <HelpCircle className="h-4 w-4 text-amber-400" />
              <span>Guide interactif</span>
            </button>

            {user ? (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="border-slate-700 bg-slate-800/80 text-white rounded-xl"
                >
                  <Link to="/compte/portefeuille" onClick={() => setOpen(false)}>
                    <Wallet className="h-4 w-4 mr-2 text-amber-400" /> Mon Portefeuille
                  </Link>
                </Button>
                <Button
                  asChild
                  className="rounded-xl font-black bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950"
                >
                  <Link to="/compte" onClick={() => setOpen(false)}>
                    Mon espace
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  onClick={logout}
                  className="text-slate-400 hover:text-white"
                >
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="border-slate-700 bg-slate-800 text-white rounded-xl"
                >
                  <Link to="/auth" onClick={() => setOpen(false)}>
                    Connexion
                  </Link>
                </Button>
                <Button
                  asChild
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black rounded-xl"
                >
                  <Link to="/auth" search={{ mode: "signup" }} onClick={() => setOpen(false)}>
                    Créer un compte
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
