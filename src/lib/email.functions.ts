import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { EMAIL_KINDS, mergeTemplates, renderEmail, type EmailKind, type EmailVars } from "./email-templates";

type Input = { kind: EmailKind; userId?: string; toEmail?: string; vars?: EmailVars; test?: boolean };

export const sendClientEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Input) => {
    if (!EMAIL_KINDS.some((k) => k.kind === d.kind)) throw new Error("Type d'email invalide");
    const vars: EmailVars = {};
    for (const [k, v] of Object.entries(d.vars || {})) vars[k as keyof EmailVars] = String(v ?? "").slice(0, 3000);
    return { ...d, vars };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: staff } = await supabase.rpc("is_staff", { _user_id: userId });
    const target = data.userId || userId;
    if (!staff && (target !== userId || data.toEmail)) throw new Error("Non autorisé");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: st } = await supabaseAdmin.from("company_settings").select("*").eq("id", 1).maybeSingle();
    const extra = ((st as { extra?: Record<string, unknown> } | null)?.extra || {}) as Record<string, unknown>;
    const tpl = mergeTemplates(extra.email_templates)[data.kind];
    if (!tpl.enabled && !data.test) return { sent: false, reason: "désactivé" };
    const senderEmail = String(extra.email_sender || "");
    const senderName = String(extra.email_sender_name || "Prime Express Shipping");
    if (!senderEmail) return { sent: false, reason: "Adresse expéditeur non configurée" };

    let to = data.toEmail || "";
    const vars = { ...data.vars };
    if (!to) {
      const { data: p } = await supabaseAdmin.from("profiles").select("email, full_name, client_code").eq("id", target).maybeSingle();
      if (!p?.email) return { sent: false, reason: "Client sans email" };
      to = p.email;
      vars.nom ||= p.full_name || "";
      vars.code ||= p.client_code || "";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) throw new Error("Email invalide");

    const key = process.env.BREVO_API_KEY;
    if (!key) throw new Error("Clé Brevo manquante");
    const { subject, html } = renderEmail(tpl, vars, senderName, String(extra.email_logo_url || "") || undefined);
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ sender: { name: senderName, email: senderEmail }, to: [{ email: to, name: vars.nom || undefined }], subject, htmlContent: html }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error(`Brevo [${res.status}]: ${t}`);
      throw new Error(`Brevo a refusé l'envoi (${res.status}) : ${t.slice(0, 200)}`);
    }
    return { sent: true, reason: "" };
  });
