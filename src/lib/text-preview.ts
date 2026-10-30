/** Short catalogue preview: prefers the short description, otherwise trims the full text. */
export function productPreview(p: { short_description?: string | null; description?: string | null }, max = 90): string {
  const raw = (p.short_description || p.description || "").replace(/[#*_>`~-]+/g, " ").replace(/\s+/g, " ").trim();
  if (raw.length <= max) return raw;
  return raw.slice(0, max).replace(/\s+\S*$/, "") + "…";
}
