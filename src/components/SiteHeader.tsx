// @ts-nocheck
import { Link, useNavigate } from "@tanstack/react-router";
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
    <header className="sticky top-2 z-40 mx-auto w-full max-w-7xl px-2 text-foreground sm:px-4">
      <div className="glass-strong rounded-2xl">
      <div className="flex h-16 items-center justify-between gap-4 px-4">
        {/* Brand Logo & Name */}
        <Link
          to="/"
          className="flex items-center gap-3 font-display text-lg font-black tracking-tight flex-shrink-0 group"
        >
          <img
            src="/logos/prime-shipping-logo.svg"
            alt="Prime Express Shipping"
            className="h-14 w-auto max-w-[150px] object-contain group-hover:scale-105 transition-transform"
          />
          <div className="hidden sm:block">
            <span className="text-foreground text-base font-black block leading-tight tracking-tight">
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
                    ? "text-primary hover:bg-primary/10"
                    : isStore
                      ? "text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
                      : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                }`}
                activeProps={{
                  className:
                    "bg-primary/10 text-primary font-extrabold shadow-sm border border-primary/20",
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
              className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-xl border border-border bg-card/60 backdrop-blur-md hover:bg-card transition-colors mr-1"
            >
              <HelpCircle className="h-3.5 w-3.5 text-amber-500" />
              <span>Guide</span>
            </button>

            {user ? (
              <>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="font-bold border-border bg-card/70 hover:bg-card text-foreground rounded-xl text-xs h-9"
                >
                  <Link to="/compte/portefeuille">
                    <Wallet className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                    Portefeuille
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-[#1F150C] font-black rounded-xl text-xs h-9 shadow-sm"
                >
                  <Link to="/compte">Mon espace</Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-muted-foreground hover:text-foreground text-xs h-9"
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
                  className="text-muted-foreground hover:text-foreground rounded-xl text-xs h-9"
                >
                  <Link to="/auth">Connexion</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-[#1F150C] font-black rounded-xl text-xs h-9 shadow-md"
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
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="rounded-b-2xl border-t border-border/50 px-4 pb-6 pt-2 lg:hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <nav className="divide-y divide-border/60">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between py-3 text-sm font-semibold text-foreground/80 hover:text-foreground"
              >
                <span>{n.label}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </nav>

          <div className="mt-4 flex flex-col gap-2 pt-2 border-t border-border/60">
            <button
              onClick={() => {
                setOpen(false);
                triggerTutorial();
              }}
              className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground border border-border py-2.5 rounded-xl hover:bg-card"
            >
              <HelpCircle className="h-4 w-4 text-amber-500" />
              <span>Guide interactif</span>
            </button>

            {user ? (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="border-border bg-card/70 text-foreground rounded-xl"
                >
                  <Link to="/compte/portefeuille" onClick={() => setOpen(false)}>
                    <Wallet className="h-4 w-4 mr-2 text-amber-500" /> Mon Portefeuille
                  </Link>
                </Button>
                <Button
                  asChild
                  className="rounded-xl font-black bg-gradient-to-r from-orange-500 to-amber-500 text-[#1F150C]"
                >
                  <Link to="/compte" onClick={() => setOpen(false)}>
                    Mon espace
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  onClick={logout}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="border-border bg-card/70 text-foreground rounded-xl"
                >
                  <Link to="/auth" onClick={() => setOpen(false)}>
                    Connexion
                  </Link>
                </Button>
                <Button
                  asChild
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-[#1F150C] font-black rounded-xl"
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
      </div>
    </header>
  );
}
