import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { EMAIL_KINDS, mergeTemplates, renderEmail, type EmailKind, type EmailVars } from "./email-templates";
import { packageEmailKind } from "./package-email";
import { formatDate, nextPackageStep, statusLabel } from "./labels";

type Input = { kind: EmailKind; packageId?: string; userId?: string; toEmail?: string; vars?: EmailVars; test?: boolean; cart?: { productId: string; variantId: string | null; quantity: number }[] };

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
    let target = data.userId || userId;
    let kind = data.kind;
    let eventId: string | undefined;
    if (data.packageId) {
      const { data: pkg, error } = await supabase.from("packages").select("id,user_id,tracking_number,status,description,updated_at").eq("id", data.packageId).single();
      if (error || !pkg || (!staff && pkg.user_id !== userId)) throw new Error("Colis inaccessible");
      if (data.toEmail || data.test) throw new Error("Envoi colis invalide");
      target = pkg.user_id;
      kind = packageEmailKind(pkg.status);
      const { data: event } = await supabase.from("package_events").select("id,created_at").eq("package_id", pkg.id).eq("status", pkg.status).order("created_at", { ascending: false }).limit(1).maybeSingle();
      eventId = event?.id || `${pkg.id}-${pkg.updated_at}`;
      data.vars = { tracking: pkg.tracking_number, statut: statusLabel(pkg.status), prochaine_etape: nextPackageStep(pkg.status), date: formatDate(event?.created_at || pkg.updated_at), details: pkg.description };
    }
    if (!staff && (target !== userId || data.toEmail)) throw new Error("Non autorisé");

    const { data: st } = await supabase.from("company_settings").select("*").eq("id", 1).maybeSingle();
    const extra = ((st as { extra?: Record<string, unknown> } | null)?.extra || {}) as Record<string, unknown>;
    const tpl = mergeTemplates(extra["email_templates"])[kind];
    if (!tpl.enabled && !data.test) return { sent: false, reason: "désactivé" };
    const senderEmail = String(extra["email_sender"] || "");
    const senderName = String(extra["email_sender_name"] || "Prime Express Shipping");
    if (!senderEmail) return { sent: false, reason: "Adresse expéditeur non configurée" };

    let to = data.toEmail || "";
    const vars = { ...data.vars };
    if (!to) {
      const { data: p } = await supabase.from("profiles").select("email, full_name, client_code").eq("id", target).maybeSingle();
      if (!p?.email) return { sent: false, reason: "Client sans email" };
      to = p.email;
      vars.nom ||= p.full_name || "";
      vars.code ||= p.client_code || "";
    }
    if (data.kind === "panier" && !data.test) {
      const cart = data.cart;
      if (!cart?.length || cart.length > 50 || cart.some((item) => typeof item.productId !== "string" || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 999)) throw new Error("Panier invalide");
      const { data: products, error } = await supabase.from("products").select("id, title, variants").eq("is_active", true).in("id", cart.map((item) => item.productId));
      if (error) throw error;
      const lines = cart.map((item) => {
        const product = products?.find((entry) => entry.id === item.productId);
        if (!product) throw new Error("Un article du panier n'est plus disponible");
        const variants = Array.isArray(product.variants) ? product.variants as { id?: string; name?: string }[] : [];
        const variant = variants.find((entry) => entry.id === item.variantId);
        return `${product.title}${variant?.name ? ` — ${variant.name}` : ""} × ${item.quantity}`;
      });
      vars.details = lines.join("\n");
      vars.reference = "Boutique → Mon panier";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) throw new Error("Email invalide");

    const key = process.env["BREVO_API_KEY"];
    if (!key) throw new Error("Clé Brevo manquante");
    const configuredSite = String(extra["site_url"] || "https://primeshipping.net");
    const siteUrl = /^https:\/\//.test(configuredSite) ? configuredSite.replace(/\/$/, "") : "https://primeshipping.net";
    const configuredLogo = String(extra["email_logo_url"] || "");
    const logoUrl = configuredLogo.startsWith("/") ? `${siteUrl}${configuredLogo}` : configuredLogo;
    const { subject, html } = renderEmail(tpl, vars, senderName, logoUrl || undefined, siteUrl);
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ sender: { name: senderName, email: senderEmail }, to: [{ email: to, name: vars.nom || undefined }], subject, htmlContent: html, ...(eventId ? { headers: { idempotencyKey: `package-${eventId}` } } : {}) }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error(`Brevo [${res.status}]: ${t}`);
      throw new Error(`Brevo a refusé l'envoi (${res.status}) : ${t.slice(0, 200)}`);
    }
    return { sent: true, reason: "" };
  });
