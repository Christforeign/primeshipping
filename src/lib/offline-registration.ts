async function unregisterOurs() {
  for (const registration of await navigator.serviceWorker.getRegistrations()) {
    const url = registration.active?.scriptURL || registration.waiting?.scriptURL || registration.installing?.scriptURL;
    if (url && new URL(url).pathname === "/sw.js") await registration.unregister();
  }
  // Purge les caches hors ligne : un ancien service worker peut servir de vieux
  // fichiers mélangés aux nouveaux et provoquer des erreurs de syntaxe au chargement.
  if ("caches" in window) {
    for (const name of await caches.keys()) {
      if (name.startsWith("prime-") || name.startsWith("workbox")) await caches.delete(name);
    }
  }
}

export async function registerOfflineSupport() {
  if (!("serviceWorker" in navigator)) return;
  const host = window.location.hostname.toLowerCase();
  const preview = /\.(lovable\.app|gpt-eng\.com|gptengineer\.run)$/.test(host) && /^(?:(?:id-preview|preview)(?:-[a-z0-9]+)?--.+|project--.+-dev)$/.test(host.split(".")[0] || "");
  const blocked = !import.meta.env.PROD || window.self !== window.top || preview || ["lovableproject.com", "lovableproject-dev.com", "beta.lovable.dev"].some((domain) => host === domain || host.endsWith(`.${domain}`)) || new URLSearchParams(location.search).get("sw") === "off";
  if (blocked) {
    await unregisterOurs();
    return;
  }
  try {
    // Sur certains hébergements (ex. Vercel) le fichier sw.js n'existe pas :
    // on désenregistre alors tout ancien service worker au lieu de laisser
    // une version périmée contrôler la page.
    const res = await fetch("/sw.js", { method: "HEAD", cache: "no-store" });
    if (!res.ok) {
      await unregisterOurs();
      return;
    }
    await navigator.serviceWorker.register("/sw.js");
  } catch {
    await unregisterOurs();
  }
}
