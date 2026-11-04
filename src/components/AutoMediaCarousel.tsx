import { useEffect, useState } from "react";
import { isDirectVideo } from "@/lib/upload";

/** Shop card media that rotates on its own when a product has several photos/videos. */
export function AutoMediaCarousel({ media, alt, interval = 3500 }: { media: string[]; alt: string; interval?: number }) {
  const items = media.filter(Boolean);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (items.length < 2 || paused) return;
    const t = setInterval(() => setI((n) => (n + 1) % items.length), interval);
    return () => clearInterval(t);
  }, [items.length, paused, interval]);
  return (
    <div className="absolute inset-0" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {items.map((url, idx) => {
        const cls = `absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${idx === i ? "opacity-100" : "opacity-0"}`;
        return isDirectVideo(url) ? (
          <video key={url + idx} src={url} className={cls} muted loop playsInline autoPlay={idx === i} preload="metadata" />
        ) : (
          <img key={url + idx} src={url} alt={alt} loading="lazy" className={cls} />
        );
      })}
      {items.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {items.map((_, idx) => (
            <span key={idx} className={`h-1.5 rounded-full transition-all ${idx === i ? "w-4 bg-primary" : "w-1.5 bg-background/80"}`} />
          ))}
        </div>
      )}
    </div>
  );
}
