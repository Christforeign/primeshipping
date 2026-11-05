import { describe, it, expect } from "vitest";
import { resolveProductPhoto } from "./product-gallery";

const PHOTOS = ["https://cdn.test/photo-1.jpg", "https://cdn.test/photo-2.jpg", "https://cdn.test/photo-3.jpg"];
const VARIANT_PHOTO = "https://cdn.test/variant-red.jpg";

describe("resolveProductPhoto", () => {
  it("shows the first gallery photo when no variant was tapped, even if the variant has its own photo", () => {
    expect(resolveProductPhoto(PHOTOS, 0, null)).toBe(PHOTOS[0]);
  });

  it("shows the photo of the thumbnail that was clicked", () => {
    expect(resolveProductPhoto(PHOTOS, 2, null)).toBe(PHOTOS[2]);
  });

  it("shows a variant's photo only after that variant was tapped", () => {
    expect(resolveProductPhoto(PHOTOS, 2, VARIANT_PHOTO)).toBe(VARIANT_PHOTO);
  });

  it("returns to the gallery when a thumbnail is clicked after a variant tap", () => {
    expect(resolveProductPhoto(PHOTOS, 1, null)).toBe(PHOTOS[1]);
  });

  it("falls back to the first photo when the index is out of range", () => {
    expect(resolveProductPhoto(PHOTOS, 9, null)).toBe(PHOTOS[0]);
  });

  it("returns nothing when the product has no photo at all", () => {
    expect(resolveProductPhoto([], 0, null)).toBeUndefined();
  });
});
