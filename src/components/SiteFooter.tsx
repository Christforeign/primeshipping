import { Link } from "@tanstack/react-router";
import { useSettings } from "@/lib/settings";
import { activeSocialLinks, socialIcon } from "@/lib/social-links";
import { SocialIcon } from "@/components/SocialIcon";
import {
  MonCashLogo,
  NatcashLogo,
  VisaLogo,
  MastercardLogo,
  PayPalLogo,
  BankTransferLogo,
} from "@/components/BrandLogos";

export function SiteFooter() {
  const s = useSettings();
  const name = s?.company_name ?? "Prime Shipping";
  const socials = activeSocialLinks(s);

  return (
    <footer className="relative mt-24 bg-forest text-forest-foreground">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4">
        {/* Company Identity & Logo */}
        <div className="md:col-span-2 space-y-4">
          <Link to="/" className="inline-flex items-center gap-2.5 font-display text-xl font-bold">
            <img src="/logos/prime-shipping-logo.svg" alt="Prime Shipping" className="h-24 w-auto object-contain" />
            <span className="font-black text-forest-foreground">{name}</span>
          </Link>

          {s?.slogan && <p className="text-forest-foreground/80 text-sm max-w-md">{s.slogan}</p>}

          {/* Payment Badges in Footer */}
          <div className="pt-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-accent mb-2">
              Paiements acceptés en Haïti
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <MonCashLogo />
              <NatcashLogo />
              <VisaLogo />
              <MastercardLogo />
              <PayPalLogo />
              <BankTransferLogo />
            </div>
          </div>

          {socials.length > 0 && (
            <div className="pt-2 flex flex-wrap gap-4 text-sm">
              {socials.map((link) => (
                <a
                  key={link.id || link.url}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={link.label}
                  title={link.label}
                  className="inline-flex min-h-10 items-center gap-2 underline-offset-4 hover:text-accent hover:underline text-xs"
                >
                  <SocialIcon link={link} />
                  {socialIcon(link) !== "whatsapp" && link.label}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Contact info */}
        <div className="space-y-1.5 text-sm text-forest-foreground/85">
          <p className="mb-2 font-semibold text-accent">Contact & Agences</p>
          {s?.hq_address && <p className="text-xs">{s.hq_address}</p>}
          {s?.phone && <p className="text-xs">Tél : {s.phone}</p>}
          {s?.whatsapp && <p className="text-xs">WhatsApp : {s.whatsapp}</p>}
          {s?.email && <p className="text-xs">{s.email}</p>}
          {s?.opening_hours && <p className="text-xs whitespace-pre-line">{s.opening_hours}</p>}
        </div>

        {/* Quick Links */}
        <div className="flex flex-col gap-1.5 text-sm">
          <p className="mb-2 font-semibold text-accent">Navigation & Services</p>
          <Link to="/suivi" className="text-xs hover:text-accent">
            Prime Shipping (Suivi)
          </Link>
          <Link to="/boutique" className="text-xs hover:text-accent">
            Prime Store (Boutique)
          </Link>
          <Link to="/achat" className="text-xs hover:text-accent">
            Achetez pour moi
          </Link>
          <Link to="/services" className="text-xs hover:text-accent">
            Services & Tarifs
          </Link>
          <Link to="/faq" className="text-xs hover:text-accent">
            Foire Aux Questions
          </Link>
          <Link to="/conditions" className="text-xs hover:text-accent">
            Conditions & Confidentialité
          </Link>
          <Link to="/support" className="text-xs hover:text-accent">
            Support Client
          </Link>
        </div>
      </div>

      <div className="border-t border-forest-foreground/15 py-5 text-center text-xs text-forest-foreground/60">
        © 2026 {name}. Tous droits réservés. Service logistique & e-commerce vers Haïti.
      </div>
    </footer>
  );
}
