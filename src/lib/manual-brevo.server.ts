import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { z } from "zod";
import type { manualEmailSchema } from "./manual-email";
import { renderEmail } from "./email-templates";

export async function sendManualBrevo(db: SupabaseClient<Database>, adminId: string, input: z.infer<typeof manualEmailSchema>) {
  const { data: settings, error } = await db.from("company_settings").select("extra").eq("id", 1).single();
  if (error) throw new Error("Impossible de lire les réglages e-mail");
  const extra = (settings.extra || {}) as Record<string, unknown>;
  const sender = String(extra.email_manual_sender || "noreply@primeshipping.net");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sender)) throw new Error("Expéditeur invalide");
  const key = process.env.BREVO_API_KEY;
  if (!key) throw new Error("Connexion Brevo indisponible");
  const gateway = key.startsWith("lovc_");
  const gatewayKey = process.env.LOVABLE_API_KEY;
  if (gateway && !gatewayKey) throw new Error("Connexion Brevo indisponible");
  const endpoint = gateway ? "https://connector-gateway.lovable.dev/brevo/smtp/email" : "https://api.brevo.com/v3/smtp/email";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (gateway && gatewayKey) { headers.Authorization = `Bearer ${gatewayKey}`; headers["X-Connection-Api-Key"] = key; }
  else headers["api-key"] = key;
  const name = String(extra.email_sender_name || "Prime Shipping");
  const site = String(extra.site_url || "https://primeshipping.net");
  let sent = 0, failed = 0, offset = 0;
  const seen = new Set<string>();
  do {
    let query = db.from("profiles").select("id,email,full_name,client_code").order("id").range(offset, offset + 99);
    if (input.audience === "client" && input.userId) query = query.eq("id", input.userId);
    const { data: profiles, error: profileError } = await query;
    if (profileError) throw new Error("Impossible de lire les destinataires");
    for (const profile of profiles || []) {
      const email = (profile.email || "").toLowerCase().trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || seen.has(email)) continue;
      seen.add(email);
      const rendered = renderEmail({ enabled: true, subject: input.subject, body: "{{details}}", color: "#ea580c" }, { details: input.message, nom: profile.full_name || "", code: profile.client_code || "" }, name, String(extra.email_logo_url || "") || undefined, /^https:\/\//.test(site) ? site : undefined);
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${input.eventId}:${profile.id}`));
      const idempotencyKey = [...new Uint8Array(digest)].slice(0, 16).map((v) => v.toString(16).padStart(2, "0")).join("");
      const response = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify({ sender: { name, email: sender }, to: [{ email }], subject: rendered.subject, htmlContent: rendered.html, headers: { idempotencyKey } }) });
      if (response.ok) sent++;
      else {
        const body = await response.text();
        console.error(`Brevo manual [${response.status}]: ${body}`);
        await db.from("app_error_logs").insert({ user_id: adminId, source: "email:manual", message: `Brevo [${response.status}]: ${body}`.slice(0, 2000) });
        failed++;
        if (response.status === 429 || response.status === 401 || response.status === 403) return { sent, failed, stopped: true };
      }
    }
    if (input.audience === "client" || !profiles || profiles.length < 100) break;
    offset += 100;
  } while (true);
  return { sent, failed, stopped: false };
}