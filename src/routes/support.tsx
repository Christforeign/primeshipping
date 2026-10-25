import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { useSettings } from "@/lib/settings";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support — Prime Shipping" },
      {
        name: "description",
        content: "Contactez l'équipe Prime Shipping par téléphone, WhatsApp ou e-mail.",
      },
      { property: "og:title", content: "Support — Prime Shipping" },
      {
        property: "og:description",
        content: "Besoin d'aide ou d'un achat assisté ? Contactez-nous.",
      },
    ],
  }),
  component: Support,
});

function Support() {
  const s = useSettings();
  const wa = s?.whatsapp?.replace(/[^0-9]/g, "");
  const has = s?.phone || s?.whatsapp || s?.email;
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-4xl font-bold text-forest">Support</h1>
      <p className="mt-3 text-muted-foreground">
        Une question, un achat à faire pour vous ? Contactez-nous.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {s?.phone && (
          <a
            href={`tel:${s.phone}`}
            className="rounded-2xl border bg-card p-6 hover:border-primary"
          >
            <Phone className="text-primary" />
            <p className="mt-3 font-semibold">{s.phone}</p>
          </a>
        )}
        {wa && (
          <a
            href={`https://wa.me/${encodeURIComponent(wa)}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border bg-card p-6 hover:border-primary"
          >
            <MessageCircle className="text-primary" />
            <p className="mt-3 font-semibold">WhatsApp</p>
          </a>
        )}
        {s?.email && (
          <a
            href={`mailto:${s.email}`}
            className="rounded-2xl border bg-card p-6 hover:border-primary"
          >
            <Mail className="text-primary" />
            <p className="mt-3 font-semibold break-all">{s.email}</p>
          </a>
        )}
      </div>
      {!has && (
        <p className="mt-6 rounded-xl bg-muted p-5 text-muted-foreground">
          Nos coordonnées seront bientôt disponibles.
        </p>
      )}
    </div>
  );
}
