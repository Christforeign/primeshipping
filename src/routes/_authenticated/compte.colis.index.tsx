import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/labels";
import { profileQuery } from "@/lib/session";
import { UsaAddressCard } from "@/components/UsaAddressCard";

export const Route = createFileRoute("/_authenticated/compte/colis/")({
  component: MyPackages,
});

function MyPackages() {
  const { user } = Route.useRouteContext();
  const q = useQuery({
    queryKey: ["my-packages-full", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const profile = useQuery(profileQuery(user.id)).data;
  return (
    <div className="space-y-6">
      <PageHeader title="Prime Shipping — Mes colis">
        <Button asChild>
          <Link to="/compte/colis/nouveau">
            <PackagePlus /> Déclarer un colis
          </Link>
        </Button>
      </PageHeader>
      {profile?.client_code && <UsaAddressCard fullName={profile.full_name} code={profile.client_code} />}
      {q.isLoading ? (
        <p>Chargement…</p>
      ) : (q.data ?? []).length === 0 ? (
        <p className="rounded-2xl border bg-card p-6 text-muted-foreground">
          Vous n'avez encore aucun colis.
        </p>
      ) : (
        <div className="grid gap-3">
          {q.data!.map((p) => (
            <Link
              key={p.id}
              to="/compte/colis/$id"
              params={{ id: p.id }}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 hover:border-primary"
            >
              <div className="min-w-0">
                <p className="font-semibold">{p.description}</p>
                <p className="text-sm text-muted-foreground">
                  {p.merchant} · <span className="font-mono">{p.tracking_number}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Mis à jour {formatDate(p.updated_at)}
                </p>
              </div>
              <StatusBadge status={p.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
