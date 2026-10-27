import { useEffect, useState } from "react";
import { Button } from "./ui/button";

export function OfflineScreen() {
  const [offline, setOffline] = useState(false);
  const [phone, setPhone] = useState("");
  useEffect(() => {
    const update = () => {
      setOffline(!navigator.onLine);
      try { setPhone(localStorage.getItem("prime_support_phone") || ""); } catch { /* optional cache */ }
    };
    update();
    try { setPhone(localStorage.getItem("prime_support_phone") || ""); } catch { /* optional cache */ }
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  return <section role={offline ? "alert" : undefined} aria-hidden={!offline} className={offline ? "fixed inset-0 z-[200] flex min-h-dvh flex-col items-center justify-center gap-5 bg-background px-6 text-center text-foreground" : "hidden"}>
    <img src="/logos/prime-shipping-email.png" alt="Prime Shipping" className="h-32 w-48 object-contain" />
    <h1 className="text-2xl font-bold">Vous êtes hors connexion</h1>
    <p className="max-w-md text-muted-foreground">Pensez à acheter un forfait internet ou à vous connecter au Wi-Fi pour retrouver Prime Shipping.</p>
    {phone && <Button asChild variant="outline"><a href={`tel:${phone.replace(/[^+0-9]/g, "")}`}>Support : {phone}</a></Button>}
    <Button onClick={() => { if (navigator.onLine) window.location.reload(); }}>Réessayer</Button>
  </section>;
}