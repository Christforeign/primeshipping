import { Link } from "@tanstack/react-router";
import { Home, ShoppingBag, PackageSearch, Package, User } from "lucide-react";

const ITEMS = [
  { to: "/", label: "Accueil", icon: Home, exact: true },
  { to: "/boutique", label: "Boutique", icon: ShoppingBag },
  { to: "/suivi", label: "Suivi", icon: PackageSearch },
  { to: "/compte/colis", label: "Mes colis", icon: Package },
  { to: "/compte", label: "Compte", icon: User },
] as const;

export function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <div className="grid grid-cols-5">
        {ITEMS.map(({ to, label, icon: Icon, ...rest }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: "exact" in rest }}
            className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold text-muted-foreground"
            activeProps={{ className: "text-accent" }}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
