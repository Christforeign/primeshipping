export const FESTIVE_TICKER_TEXT = "🎄✨ Joyeux Noël 2026 & Bonne Année 2027 ! Prime Shipping & Prime Store vous souhaitent de merveilleuses fêtes de fin d'année remplies de joie, de paix et de prospérité 🎁❄️";
export const FESTIVE_INTRO_TEXT = "Prime Shipping vous souhaite de joyeuses fêtes de fin d'année et ses meilleurs vœux pour 2027 !";

export type FestiveTheme = {
  enabled: boolean;
  ticker: boolean;
  snow: boolean;
  intro: boolean;
  tickerText: string;
  introText: string;
  version: string;
};

export const DEFAULT_FESTIVE_THEME: FestiveTheme = {
  enabled: true, ticker: true, snow: true, intro: true,
  tickerText: FESTIVE_TICKER_TEXT, introText: FESTIVE_INTRO_TEXT, version: "noel-2026",
};

const text = (value: unknown, fallback: string, max: number) =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : fallback;
const flag = (value: unknown, fallback: boolean) => (typeof value === "boolean" ? value : fallback);

/** Missing settings use the festive defaults; a saved `enabled: false` restores the classic design. */
export function readFestiveTheme(value: unknown): FestiveTheme {
  if (!value || typeof value !== "object") return DEFAULT_FESTIVE_THEME;
  const v = value as Partial<FestiveTheme>;
  const d = DEFAULT_FESTIVE_THEME;
  return {
    enabled: flag(v.enabled, d.enabled),
    ticker: flag(v.ticker, d.ticker),
    snow: flag(v.snow, d.snow),
    intro: flag(v.intro, d.intro),
    tickerText: text(v.tickerText, d.tickerText, 400),
    introText: text(v.introText, d.introText, 300),
    version: text(v.version, d.version, 80),
  };
}

export function festiveParts(theme: FestiveTheme) {
  return {
    ticker: theme.enabled && theme.ticker,
    snow: theme.enabled && theme.snow,
    intro: theme.enabled && theme.intro,
    frost: theme.enabled,
  };
}

export function shouldShowFestiveIntro(theme: FestiveTheme, seenVersion: string | null) {
  return festiveParts(theme).intro && seenVersion !== theme.version;
}
