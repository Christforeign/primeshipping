// External hosts (Vercel) have no privileged backend key; they forward verified
// webhook calls unchanged to the Lovable-hosted deployment, which holds it.
const DEFAULT_ORIGIN = "https://primeshipping.lovable.app";
const HOP = "x-prime-relay";

export function needsCloudRelay(request: Request) {
  return !process.env["SUPABASE_SERVICE_ROLE_KEY"] && !request.headers.get(HOP);
}

export async function relayToCloud(request: Request, body: BodyInit | null) {
  const origin = (process.env["CLOUD_RELAY_ORIGIN"] || DEFAULT_ORIGIN).replace(/\/$/, "");
  const url = new URL(request.url);
  const headers = new Headers({ [HOP]: "1", "content-type": request.headers.get("content-type") || "application/json" });
  const auth = request.headers.get("authorization");
  if (auth) headers.set("authorization", auth);
  const res = await fetch(`${origin}${url.pathname}${url.search}`, { method: request.method, headers, body });
  return new Response(await res.text(), { status: res.status, headers: { "content-type": res.headers.get("content-type") || "application/json" } });
}
