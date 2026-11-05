/**
 * Which photo the product page shows.
 *
 * The gallery thumbnails always control the main photo. A variant's own photo
 * appears only after the shopper taps that variant, so a product whose first
 * variant carries a photo never locks the gallery in place.
 */
export function resolveProductPhoto(
  mediaUrls: string[],
  activeIndex: number,
  variantPreview: string | null,
): string | null {
  if (variantPreview) return variantPreview;
  return mediaUrls[activeIndex] || mediaUrls[0] || null;
}
