import { describe, expect, it } from "vitest";
import { DEFAULT_FESTIVE_THEME, festiveParts, readFestiveTheme, shouldShowFestiveIntro } from "./festive-theme";

describe("festive theme controls", () => {
  it("turning the festive theme off in admin removes every decoration", () => {
    const parts = festiveParts(readFestiveTheme({ enabled: false }));
    expect(parts).toEqual({ ticker: false, snow: false, intro: false, frost: false });
  });
  it("shows the Christmas scrolling message by default", () => {
    const theme = readFestiveTheme(undefined);
    expect(festiveParts(theme).ticker).toBe(true);
    expect(theme.tickerText).toContain("Joyeux Noël 2026");
  });
  it("shows the opening animation only once per visit for the same version", () => {
    expect(shouldShowFestiveIntro(DEFAULT_FESTIVE_THEME, null)).toBe(true);
    expect(shouldShowFestiveIntro(DEFAULT_FESTIVE_THEME, DEFAULT_FESTIVE_THEME.version)).toBe(false);
  });
  it("can hide only the opening animation while keeping the rest", () => {
    const parts = festiveParts(readFestiveTheme({ intro: false }));
    expect(parts.intro).toBe(false);
    expect(parts.ticker).toBe(true);
  });
});
