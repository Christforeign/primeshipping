import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AreaShell, type AreaLink } from "@/components/AreaShell";
import { useRoles, useUser } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/compte")({
  head: () => ({
    meta: [{ title: "Mon espace — Prime Shipping" }, { name: "robots", content: "noindex" }],
  }),
  component: CompteLayout,
});

function CompteLayout() {
  const { user } = useUser();
  const { isAdmin } = useRoles(user?.id);
  const links: AreaLink[] = [
    { to: "/compte", label: "Tableau de bord", exact: true },
    { to: "/compte/colis", label: "Mes colis" },
    { to: "/compte/commandes", label: "Mes commandes" },
    { to: "/compte/portefeuille", label: "Mon portefeuille" },
    { to: "/compte/adresses", label: "Mes adresses" },
    { to: "/compte/profil", label: "Mon profil" },
  ];
  if (isAdmin) {
    links.push({ to: "/compte/admin", label: "Administration" });
    links.push({ to: "/compte/admin-colis", label: "Gestion des colis" });
  }
  return (
    <AreaShell title="Mon espace" links={links}>
      <Outlet />
    </AreaShell>
  );
}
