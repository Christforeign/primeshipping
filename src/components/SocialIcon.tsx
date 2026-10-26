import { Facebook, Instagram, Mail, Phone, ExternalLink } from "lucide-react";
import whatsappAsset from "@/assets/payments/whatsapp.svg.asset.json";
import { socialIcon, type SiteSocialLink } from "@/lib/social-links";

export function WhatsAppLogo({ className = "h-6 w-6" }: { className?: string }) {
  return <img src={whatsappAsset.url} alt="" aria-hidden="true" className={`${className} object-contain`} />;
}
export function SocialIcon({ link, className = "h-6 w-6" }: { link: Pick<SiteSocialLink, "label" | "url" | "icon">; className?: string }) {
  const kind = socialIcon(link);
  if (kind === "whatsapp") return <WhatsAppLogo className={className} />;
  const Icon = { facebook: Facebook, instagram: Instagram, mail: Mail, phone: Phone, link: ExternalLink, auto: ExternalLink }[kind];
  return <Icon className={className} aria-hidden="true" />;
}