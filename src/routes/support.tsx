import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone } from "lucide-react";
import { useSettings } from "@/lib/settings";
import { activeSocialLinks } from "@/lib/social-links";
import { SocialIcon, WhatsAppLogo } from "@/components/SocialIcon";
import { useWhatsAppContacts, whatsAppUrl } from "@/components/WhatsAppSupportButton";
import { Button } from "@/components/ui/button";

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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Support,
});

function Support() {
  const s = useSettings();
  const wa = s?.whatsapp?.replace(/[^0-9]/g, "");
  const contacts = useWhatsAppContacts();
  const socials = activeSocialLinks(s);
  const has = s?.phone || wa || s?.email || contacts.length || socials.length;
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
            className="rounded-lg border bg-card p-6 hover:border-primary"
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
            className="rounded-lg border bg-card p-6 hover:border-primary"
          >
            <WhatsAppLogo className="h-8 w-8" />
            <p className="mt-3 font-semibold">WhatsApp</p>
          </a>
        )}
        {s?.email && (
          <a
            href={`mailto:${s.email}`}
            className="rounded-lg border bg-card p-6 hover:border-primary"
          >
            <Mail className="text-primary" />
            <p className="mt-3 font-semibold break-all">{s.email}</p>
          </a>
        )}
      </div>
      {contacts.length > 0 && <section className="mt-10 space-y-4"><h2 className="text-xl font-semibold">Nos services WhatsApp</h2><div className="grid gap-3 sm:grid-cols-2">{contacts.map((contact) => <Button asChild variant="outline" key={contact.id} className="h-auto justify-start p-4 whitespace-normal"><a href={whatsAppUrl(contact)} target="_blank" rel="noopener noreferrer"><WhatsAppLogo className="h-8 w-8 shrink-0" /><span className="min-w-0 text-left"><span className="block font-semibold">{contact.name}</span>{contact.department && <span className="block text-xs text-muted-foreground">{contact.department}</span>}</span></a></Button>)}</div></section>}
      {socials.length > 0 && <section className="mt-10 space-y-4"><h2 className="text-xl font-semibold">Réseaux & contacts</h2><div className="flex flex-wrap gap-3">{socials.map((link) => <Button asChild variant="outline" key={link.id || link.url} className="h-auto py-3 whitespace-normal"><a href={link.url} target={/^https?:/i.test(link.url) ? "_blank" : undefined} rel="noopener noreferrer"><SocialIcon link={link} /><span>{link.label}</span></a></Button>)}</div></section>}
      {!has && (
        <p className="mt-6 rounded-xl bg-muted p-5 text-muted-foreground">
          Nos coordonnées seront bientôt disponibles.
        </p>
      )}
    </div>
  );
}
