import { describe, expect, it } from "vitest";
import { formatNumber } from "./utils";

describe("monetary precision", () => {
  it("preserves the cents of a 2250 GDS wallet conversion at 135", () => {
    expect(formatNumber(16.67)).toBe("16,67");
  });
  it("preserves exact gourde prices", () => {
    expect(formatNumber(2250)).toBe("2 250");
  });
});