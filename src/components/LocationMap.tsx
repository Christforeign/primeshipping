import { useState } from "react";
import { MapPin, Navigation, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/settings";

export function LocationMap() {
  const s = useSettings() as any;
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [err, setErr] = useState("");
  const dest = s?.map_lat && s?.map_lng ? `${s.map_lat},${s.map_lng}` : s?.hq_address || "";
  if (!dest) return null;

  const locate = () => {
    setErr("");
    if (!navigator.geolocation) return setErr("Localisation non disponible sur cet appareil.");
    navigator.geolocation.getCurrentPosition(
      (p) => setMe({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setErr("Autorisez la localisation pour voir l'itinéraire."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const src = me
    ? `https://maps.google.com/maps?saddr=${me.lat},${me.lng}&daddr=${encodeURIComponent(dest)}&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(dest)}&z=16&output=embed`;
  const dirUrl = `https://www.google.com/maps/dir/?api=1${me ? `&origin=${me.lat},${me.lng}` : ""}&destination=${encodeURIComponent(dest)}&travelmode=driving`;

  return (
    <section className="mx-auto max-w-7xl px-4">
      <h2 className="mb-4 text-2xl font-bold md:text-3xl">Nous trouver</h2>
      <div className="overflow-hidden rounded-3xl border bg-card shadow-soft">
        <iframe title="Carte" className="h-72 w-full md:h-96" loading="lazy" src={src} />
        <div className="grid gap-3 p-4 sm:flex sm:items-center sm:justify-between">
          <p className="flex min-w-0 items-start gap-2 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <span className="min-w-0">{s?.hq_address}</span>
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button variant="outline" className="rounded-full" onClick={locate}>
              <LocateFixed className="mr-1.5 h-4 w-4" /> Ma position
            </Button>
            <Button asChild className="rounded-full">
              <a target="_blank" rel="noreferrer" href={dirUrl}>
                <Navigation className="mr-1.5 h-4 w-4" /> Itinéraire
              </a>
            </Button>
          </div>
        </div>
        {err && <p className="px-4 pb-4 text-xs text-destructive">{err}</p>}
      </div>
    </section>
  );
}
