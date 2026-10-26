import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { profileQuery } from "@/lib/session";
import { ADDRESS_KIND_LABELS } from "@/lib/labels";
import { useSettings } from "@/lib/settings";
import { formatUsaName, getUsaAddress } from "@/lib/usa-address";

export const Route = createFileRoute("/_authenticated/compte/adresses")({
  head: () => ({ meta: [
    { title: "Mes adresses — Prime Shipping" },
    { name: "description", content: "Consultez vos adresses de réception Prime Shipping." },
    { property: "og:title", content: "Mes adresses — Prime Shipping" },
    { property: "og:description", content: "Vos adresses et votre identifiant client." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: MyAddresses,
});

function MyAddresses() {
  const { user } = Route.useRouteContext();
  const profile = useQuery(profileQuery(user.id)).data;
  const usa = getUsaAddress(useSettings());
  const q = useQuery({
    queryKey: ["my-addresses", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });
  return (
    <div>
      <PageHeader
        title="Mes adresses"
        subtitle="Adresses attribuées par notre équipe. Indiquez toujours votre identifiant client."
      />
      {profile?.client_code && (
        <div className="mb-6 rounded-2xl border bg-card p-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">
            Adresse d'achat ({usa.country || "USA"}) — Box {profile.client_code}
          </p>
          <dl className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-4 break-words">
            <dt className="text-muted-foreground">Nom Prénom</dt>
            <dd className="font-semibold">
              {formatUsaName(usa.name_template, profile.full_name, profile.client_code)}
            </dd>
            {usa.line1 && (
              <>
                <dt className="text-muted-foreground">Address Line 1</dt>
                <dd>{usa.line1}</dd>
              </>
            )}
            {usa.line2 && (
              <>
                <dt className="text-muted-foreground">Address Line 2 / Apt</dt>
                <dd>{usa.line2}</dd>
              </>
            )}
            {usa.city && (
              <>
                <dt className="text-muted-foreground">City</dt>
                <dd>{usa.city}</dd>
              </>
            )}
            {usa.state && (
              <>
                <dt className="text-muted-foreground">State</dt>
                <dd>{usa.state}</dd>
              </>
            )}
            {usa.zip && (
              <>
                <dt className="text-muted-foreground">ZIP</dt>
                <dd>{usa.zip}</dd>
              </>
            )}
            {usa.phone && (
              <>
                <dt className="text-muted-foreground">Phone</dt>
                <dd>{usa.phone}</dd>
              </>
            )}
          </dl>
        </div>
      )}
      {(q.data ?? []).length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {(q.data ?? []).map((a) => (
            <div key={a.id} className="rounded-2xl border bg-card p-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">
                {ADDRESS_KIND_LABELS[a.kind]}
              </p>
              <address className="not-italic leading-relaxed">
                <strong>
                  {a.recipient_name} {profile?.client_code && `(${profile.client_code})`}
                </strong>
                <br />
                {a.street}
                {a.line2 && <>, {a.line2}</>}
                <br />
                {a.city}
                {a.region && `, ${a.region}`} {a.postal_code}
                <br />
                {a.country}
              </address>
              {a.warehouse && (
                <p className="mt-2 text-sm text-muted-foreground">Entrepôt : {a.warehouse}</p>
              )}
              {a.instructions && (
                <p className="mt-2 text-sm text-muted-foreground">{a.instructions}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
