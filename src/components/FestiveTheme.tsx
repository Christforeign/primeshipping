import { useEffect, useState, useSyncExternalStore } from "react";
import { Snowflake, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/settings";
import { festiveParts, readFestiveTheme, shouldShowFestiveIntro } from "@/lib/festive-theme";

const INTRO_KEY = "prime-festive-intro-seen";

// Shared flag so other opening pop-ups wait until the festive intro is closed
// (a modal underneath would otherwise block clicks on the intro).
let introOpen = false;
const introListeners = new Set<() => void>();
function setIntroOpen(value: boolean) {
  introOpen = value;
  introListeners.forEach((listener) => listener());
}
export function useFestiveIntroOpen() {
  return useSyncExternalStore(
    (listener) => { introListeners.add(listener); return () => { introListeners.delete(listener); }; },
    () => introOpen,
    () => false,
  );
}

export function useFestiveTheme() {
  const settings = useSettings();
  // Before settings load (SSR + first paint) nothing festive renders, so hydration matches.
  if (!settings) return null;
  return readFestiveTheme((settings as unknown as Record<string, unknown>)["festive_theme"]);
}

/** Fixed rhythm for the flakes: deterministic, no random values at render time. */
const FLAKES = Array.from({ length: 18 }, (_, i) => ({
  left: (i * 37 + 7) % 100,
  size: 8 + ((i * 5) % 9),
  duration: 11 + ((i * 7) % 9),
  delay: -((i * 13) % 17),
  drift: ((i % 5) - 2) * 14,
  opacity: 0.35 + ((i * 3) % 5) / 10,
}));

export function FestiveSnow() {
  const theme = useFestiveTheme();
  if (!theme || !festiveParts(theme).snow) return null;
  return (
    <div className="festive-snow" aria-hidden="true">
      {FLAKES.map((f, i) => (
        <span
          key={i}
          className="festive-flake"
          style={{
            left: `${f.left}%`, width: f.size, height: f.size, opacity: f.opacity,
            animationDuration: `${f.duration}s`, animationDelay: `${f.delay}s`,
            ["--drift" as string]: `${f.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

export function FestiveTicker() {
  const theme = useFestiveTheme();
  if (!theme || !festiveParts(theme).ticker) return null;
  const item = <span className="festive-ticker-item"><Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{theme.tickerText}<Snowflake className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /></span>;
  return (
    <div className="festive-ticker" role="marquee" aria-label={theme.tickerText}>
      <div className="festive-ticker-track" aria-hidden="true">{item}{item}</div>
    </div>
  );
}

export function FestiveIntro() {
  const theme = useFestiveTheme();
  const [open, setOpenState] = useState(false);
  const setOpen = (value: boolean) => { setOpenState(value); setIntroOpen(value); };
  const version = theme?.version;
  const show = theme ? festiveParts(theme).intro : false;
  useEffect(() => {
    if (!theme) return;
    let seen: string | null = null;
    try { seen = sessionStorage.getItem(INTRO_KEY); } catch { /* optional storage */ }
    if (!shouldShowFestiveIntro(theme, seen)) return;
    setOpen(true);
    try { sessionStorage.setItem(INTRO_KEY, theme.version); } catch { /* optional storage */ }
    const timer = window.setTimeout(() => setOpen(false), 4200);
    return () => { window.clearTimeout(timer); setIntroOpen(false); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, show]);
  if (!theme || !open) return null;
  return (
    <div className="festive-intro" role="dialog" aria-modal="true" aria-label="Joyeuses fêtes" onClick={() => setOpen(false)}>
      <div className="festive-intro-card glass-strong" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="absolute right-2 top-2" aria-label="Fermer" onClick={() => setOpen(false)}><X className="h-5 w-5" /></Button>
        <div className="festive-intro-spark" aria-hidden="true"><Snowflake className="h-10 w-10" /></div>
        <p className="font-display text-2xl font-black leading-tight sm:text-3xl">Joyeux Noël 2026<br />&amp; Bonne Année 2027</p>
        <p className="text-sm text-muted-foreground">{theme.introText}</p>
        <Button className="mt-1 w-full" onClick={() => setOpen(false)}>Entrer</Button>
      </div>
    </div>
  );
}

/** Small frosted snowflake badge for the header logo. */
export function FestiveLogoBadge() {
  return <span className="festive-badge" aria-hidden="true"><Snowflake className="h-5 w-5" /></span>;
}
