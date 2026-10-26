import { useState } from "react";
import { MapPin, Navigation, Clock, Phone, MessageCircle, ExternalLink } from "lucide-react";
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
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dest)}`;
  const whatsapp = s?.whatsapp ? `https://wa.me/${String(s.whatsapp).replace(/\D/g, "")}` : null;

  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="glass grid gap-6 rounded-3xl p-6 md:grid-cols-2 md:p-8">
        {/* Infos à gauche */}
        <div className="flex flex-col justify-center">
          <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight text-foreground">
            <MapPin className="h-6 w-6 text-primary" /> Nous trouver
          </h2>
          <p className="mt-3 text-base font-bold text-foreground">Prime Express Shipping</p>
          {s?.hq_address && (
            <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{s.hq_address}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-full">
              <a target="_blank" rel="noreferrer" href={mapsUrl}>
                <ExternalLink className="mr-1.5 h-4 w-4" /> Voir sur Google Maps
              </a>
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={locate}
              title="Utiliser ma position pour l'itinéraire"
            >
              <Navigation className="mr-1.5 h-4 w-4" /> Itinéraire
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-foreground">
            {s?.opening_hours && (
              <span className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span className="whitespace-pre-line">{s.opening_hours}</span>
              </span>
            )}
            {s?.phone && (
              <a
                href={`tel:${String(s.phone).replace(/\s/g, "")}`}
                className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5"
              >
                <Phone className="h-3.5 w-3.5 text-primary" /> {s.phone}
              </a>
            )}
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
                className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5"
              >
                <MessageCircle className="h-3.5 w-3.5 text-primary" /> WhatsApp
              </a>
            )}
          </div>
          {err && <p className="mt-3 text-xs text-destructive">{err}</p>}
        </div>

        {/* Carte à droite */}
        <div className="overflow-hidden rounded-2xl border border-border/60 shadow-soft">
          <iframe title="Carte" className="h-72 w-full md:h-full md:min-h-80" loading="lazy" src={src} />
        </div>
      </div>
    </section>
  );
}
