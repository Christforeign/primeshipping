export async function registerOfflineSupport() {
  if (!("serviceWorker" in navigator)) return;
  const host = window.location.hostname.toLowerCase();
  const preview = /\.(lovable\.app|gpt-eng\.com|gptengineer\.run)$/.test(host) && /^(?:(?:id-preview|preview)(?:-[a-z0-9]+)?--.+|project--.+-dev)$/.test(host.split(".")[0] || "");
  const blocked = !import.meta.env.PROD || window.self !== window.top || preview || ["lovableproject.com", "lovableproject-dev.com", "beta.lovable.dev"].some((domain) => host === domain || host.endsWith(`.${domain}`)) || new URLSearchParams(location.search).get("sw") === "off";
  if (blocked) {
    for (const registration of await navigator.serviceWorker.getRegistrations()) {
      const url = registration.active?.scriptURL || registration.waiting?.scriptURL || registration.installing?.scriptURL;
      if (url && new URL(url).pathname === "/sw.js") await registration.unregister();
    }
    return;
  }
  await navigator.serviceWorker.register("/sw.js");
}