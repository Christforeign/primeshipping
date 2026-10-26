import { describe, expect, it } from "vitest";
import { estimatePackageShipping, packageSubmissionError } from "./package-estimate";

describe("package declaration", () => {
  it("estimates the configured $5/lb rate multiplied by the declared weight", () => {
    expect(estimatePackageShipping("2.5", 5)).toBe(12.5);
  });
  it("uses a changed admin rate instead of a fixed price", () => {
    expect(estimatePackageShipping(2.5, 7)).toBe(17.5);
  });
  it("does not invent a price when no rate or weight is configured", () => {
    expect(estimatePackageShipping(2, null)).toBeNull();
    expect(estimatePackageShipping("", 5)).toBeNull();
  });
  it("handles network failures without displaying the raw fetch error", () => {
    expect(packageSubmissionError(new TypeError("Failed to fetch"), true)).not.toMatch(/failed to fetch/i);
    expect(packageSubmissionError(new TypeError("Failed to fetch"), true)).toContain("réessayez");
  });
});