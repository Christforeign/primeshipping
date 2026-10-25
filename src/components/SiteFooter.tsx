import { Link } from "@tanstack/react-router";
import { useSettings } from "@/lib/settings";
import {
  MonCashLogo,
  NatcashLogo,
  VisaLogo,
  MastercardLogo,
  PayPalLogo,
  BankTransferLogo,
} from "@/components/BrandLogos";
import logoImg from "@/assets/logo.png";

export function SiteFooter() {
  const s = useSettings();
  const name = s?.company_name ?? "Prime Shipping";
  const socials = [
    ["Facebook", s?.facebook_url],
    ["Instagram", s?.instagram_url],
    ["TikTok", s?.tiktok_url],
  ].filter(([, u]) => !!u) as [string, string][];

  return (
    <footer className="mt-24 bg-forest text-forest-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4">
        {/* Company Identity & Logo */}
        <div className="md:col-span-2 space-y-4">
          <Link to="/" className="inline-flex items-center gap-2.5 font-display text-xl font-bold">
            <div className="h-11 bg-white rounded-xl p-1 flex items-center justify-center shadow-xs overflow-hidden">
              <img
                src="/assets/aistudio/WhatsApp_Image_2026-10-14_at_20.12.29_c1b1b367.jpeg"
                alt="Prime Express Shipping"
                className="h-full w-auto object-contain"
              />
            </div>
            <span className="font-black text-white">Prime Express Shipping</span>
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
            <div className="pt-2 flex gap-4 text-sm">
              {socials.map(([l, u]) => (
                <a
                  key={l}
                  href={u}
                  target="_blank"
                  rel="noreferrer"
                  className="underline-offset-4 hover:text-accent hover:underline text-xs"
                >
                  {l}
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
