export type SocialIconName = "auto" | "whatsapp" | "facebook" | "instagram" | "mail" | "phone" | "link";
export type SiteSocialLink = { id?: string; label: string; url: string; enabled: boolean; icon?: SocialIconName };
export function socialIcon(link: Pick<SiteSocialLink, "label" | "url" | "icon">): SocialIconName {
  if (link.icon && link.icon !== "auto") return link.icon;
  const value = `${link.label} ${link.url}`.toLowerCase();
  if (/whatsapp|wa\.me/.test(value)) return "whatsapp";
  if (/instagram/.test(value)) return "instagram";
  if (/facebook|fb\.com/.test(value)) return "facebook";
  if (/^mailto:/i.test(link.url)) return "mail";
  if (/^tel:/i.test(link.url)) return "phone";
  return "link";
}
export function activeSocialLinks(settings: { social_links?: unknown; facebook_url?: string | null; instagram_url?: string | null; tiktok_url?: string | null } | null): SiteSocialLink[] {
  const links = Array.isArray(settings?.social_links) ? settings.social_links as SiteSocialLink[] : [
    { label: "Facebook", url: settings?.facebook_url || "", enabled: true },
    { label: "Instagram", url: settings?.instagram_url || "", enabled: true },
    { label: "TikTok", url: settings?.tiktok_url || "", enabled: true },
  ];
  return links.filter((link) => link.enabled && /^(https?:\/\/|mailto:|tel:)/i.test(link.url));
}