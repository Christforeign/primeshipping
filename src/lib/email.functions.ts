import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { EMAIL_KINDS, mergeTemplates, renderEmail, type EmailKind, type EmailVars } from "./email-templates";
import { packageEmailKind } from "./package-email";
import { formatDate, nextPackageStep, statusLabel } from "./labels";
import { orderEmailStage } from "./order-email";

type Input = { kind: EmailKind; packageId?: string; orderId?: string; walletTxId?: string; supportMessageId?: string; userId?: string; toEmail?: string; vars?: EmailVars; test?: boolean; cart?: { productId: string; variantId: string | null; quantity: number }[] };

export const sendClientEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Input) => {
    if (!EMAIL_KINDS.some((k) => k.kind === d.kind)) throw new Error("Type d'email invalide");
    const vars: EmailVars = {};
    for (const [k, v] of Object.entries(d.vars || {})) vars[k as keyof EmailVars] = String(v ?? "").slice(0, 3000);
    return { ...d, vars };
  })
  .handler(async ({ data, context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    const log = async (message: string) => { console.error("email", data.kind, message); await context.supabase.from("app_error_logs").insert({ user_id: context.userId, source: `email:${data.kind}`, message: message.slice(0, 2000), context: { packageId: data.packageId, orderId: data.orderId, walletTxId: data.walletTxId } as never }); };
    try {
      const r = await run(data, context);
      if (r.reason) await log(r.reason);
      return isStaff ? r : { ...r, reason: "" };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await log(message);
      return { sent: false, reason: isStaff ? message : "", messageId: undefined };
    }
  });

async function shortKey(raw: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return [...new Uint8Array(buf)].slice(0, 16).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function run(data: Input & { vars: EmailVars }, context: { supabase: any; userId: string; claims: { email?: unknown } }): Promise<{ sent: boolean; reason: string; messageId?: string | undefined }> {
    const { supabase, userId } = context;
    const { data: staff } = await supabase.rpc("is_staff", { _user_id: userId });
    let target = data.userId || userId;
    let kind = data.kind;
    let eventId: string | undefined;
    let adminLink = "/compte/admin";
    if (!staff && (data.test || data.kind === "alerte_admin")) throw new Error("Non autorisé");
    if (data.walletTxId) {
      const { data: tx, error } = await supabase.from("wallet_transactions").select("*").eq("id", data.walletTxId).single();
      if (error || !tx || (!staff && tx.user_id !== userId)) throw new Error("Recharge inaccessible");
      target = tx.user_id; kind = "portefeuille"; eventId = `wallet-${tx.id}-${tx.status}`;
      data.vars = { reference: tx.id, montant: `${Number(tx.amount_usd).toFixed(2)} USD`, details: `Recharge ${tx.method} : ${tx.status === "pending" ? "en attente d’approbation" : tx.status === "approved" ? "approuvée" : "refusée"}` };
    }
    if (data.supportMessageId) {
      const { data: message, error } = await supabase.from("support_messages").select("*").eq("id", data.supportMessageId).single();
      if (error || !message || (!staff && message.user_id !== userId)) throw new Error("Message inaccessible");
      target = message.user_id; kind = "support"; eventId = `support-${message.id}`;
      data.vars = { reference: "Support", details: message.sender === "staff" ? message.body : `Votre message a bien été reçu. Notre équipe vous répondra dès que possible.\n\nVotre message : ${message.body}` };
    }
    if (data.orderId) {
      const { data: order, error } = await supabase.from("shop_orders").select("*").eq("id", data.orderId).single();
      if (error || !order || (!staff && order.user_id !== userId)) throw new Error("Commande inaccessible");
      if (data.toEmail || data.test) throw new Error("Envoi commande invalide");
      target = order.user_id;
      const stage = orderEmailStage(order.status);
      kind = stage.kind;
      eventId = `order-${order.id}-${order.status}-${order.updated_at}`;
      const { data: product } = await supabase.from("products").select("custom_fields,media_urls").eq("id", order.product_id || "").maybeSingle();
      const fields = (Array.isArray(product?.custom_fields) ? product.custom_fields : []) as { id: string; label: string }[];
      const responses = Object.entries((order.custom_field_responses || {}) as Record<string, unknown>).map(([id, value]) => `${fields.find((f) => f.id === id)?.label || id} : ${Array.isArray(value) ? value.join(", ") : String(value)}`);
      data.vars = { nom: order.customer_name || "", reference: order.order_number, produit: order.product_title, image_produit: order.product_image_url || product?.media_urls?.[0] || "", quantite: String(order.quantity), montant: `${Number(order.total_usd).toFixed(2)} USD · ${Number(order.total_htg).toFixed(2)} HTG`, paiement: order.payment_method === "wallet" ? "Portefeuille Prime — payé" : `${order.payment_method} — ${order.status === "en_attente" ? "à vérifier" : "approuvé"}`, livraison: order.delivery_address || "", statut: stage.label, date: formatDate(order.updated_at), brand: "store", details: [stage.message, order.variant_name ? `Option : ${order.variant_name}` : "", order.requested_amount_usd ? `Montant à recharger : ${order.requested_amount_usd} USD\nTaux produit : ${order.product_rate_htg} HTG/USD\nTaux portefeuille : ${order.site_rate_htg} HTG/USD` : "", ...responses].filter(Boolean).join("\n") };
    }
    if (data.packageId) {
      const { data: pkg, error } = await supabase.from("packages").select("id,user_id,tracking_number,status,description,updated_at,actual_weight_lb,estimated_weight_lb,shipping_fee").eq("id", data.packageId).single();
      if (error || !pkg || (!staff && pkg.user_id !== userId)) throw new Error("Colis inaccessible");
      if (data.toEmail || data.test) throw new Error("Envoi colis invalide");
      target = pkg.user_id;
      kind = packageEmailKind(pkg.status);
      const { data: event } = await supabase.from("package_events").select("id,created_at").eq("package_id", pkg.id).eq("status", pkg.status).order("created_at", { ascending: false }).limit(1).maybeSingle();
      eventId = event?.id || `${pkg.id}-${pkg.updated_at}`;
      data.vars = { tracking: pkg.tracking_number, reference: pkg.tracking_number, statut: statusLabel(pkg.status), prochaine_etape: nextPackageStep(pkg.status), date: formatDate(event?.created_at || pkg.updated_at), details: `${pkg.description}\nPoids : ${pkg.actual_weight_lb ?? pkg.estimated_weight_lb ?? "À vérifier"} lbs\nTransport estimé : ${Number(pkg.shipping_fee || 0).toFixed(2)} USD (sous réserve de vérification)` };
      adminLink = "/compte/admin-colis";
    }
    if (!staff && (target !== userId || data.toEmail)) throw new Error("Non autorisé");

    const { data: st } = await supabase.from("company_settings").select("*").eq("id", 1).maybeSingle();
    const extra = ((st as { extra?: Record<string, unknown> } | null)?.extra || {}) as Record<string, unknown>;
    const tpl = mergeTemplates(extra["email_templates"])[kind];
    let clientReason = !tpl.enabled && !data.test ? "Modèle désactivé dans E-mails" : "";
    const senderEmail = String(extra["email_sender"] || "");
    const senderName = String(extra["email_sender_name"] || "Prime Shipping");
    if (!senderEmail) return { sent: false, reason: "Adresse expéditeur non configurée" };

    let to = data.toEmail || "";
    const vars = { ...data.vars };
    if (!to) {
      const { data: p } = await supabase.from("profiles").select("email, full_name, client_code").eq("id", target).maybeSingle();
      const accountEmail = target === userId ? String(context.claims.email || "") : "";
      if (!p?.email && !accountEmail) clientReason ||= "Client sans email";
      to = p?.email || accountEmail;
      vars.nom ||= p?.full_name || "";
      vars.code ||= p?.client_code || "";
    }
    if (data.kind === "panier" && !data.test) {
      if (!staff) throw new Error("Non autorisé");
      const { data: saved } = await supabase.from("customer_carts").select("items").eq("user_id", target).maybeSingle();
      const cart = (Array.isArray(saved?.items) ? saved.items : []) as { productId: string; variantId: string | null; quantity: number }[];
      if (!cart.length) return { sent: false, reason: "Panier vide" };
      if (cart.length > 50 || cart.some((item) => typeof item.productId !== "string" || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 999)) throw new Error("Panier invalide");
      await supabase.from("customer_carts").update({ last_reminded_at: new Date().toISOString() }).eq("user_id", target);
      const { data: products, error } = await supabase.from("products").select("id, title, variants").eq("is_active", true).in("id", cart.map((item) => item.productId));
      if (error) throw error;
      const lines = cart.map((item) => {
        const product = products?.find((entry: { id: string }) => entry.id === item.productId);
        if (!product) return "";
        const variants = Array.isArray(product.variants) ? product.variants as { id?: string; name?: string }[] : [];
        const variant = variants.find((entry) => entry.id === item.variantId);
        return `${product.title}${variant?.name ? ` — ${variant.name}` : ""} × ${item.quantity}`;
      });
      vars.details = lines.filter(Boolean).join("\n"); if (!vars.details) return { sent: false, reason: "Articles indisponibles" };
      vars.reference = "Boutique → Mon panier";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) throw new Error("Email invalide");

    const key = process.env["BREVO_API_KEY"];
    if (!key) throw new Error("Clé Brevo manquante");
    const configuredSite = String(extra["site_url"] || "https://primeshipping.net");
    const siteUrl = /^https:\/\//.test(configuredSite) ? configuredSite.replace(/\/$/, "") : "https://primeshipping.net";
    if (data.orderId) vars.lien = `${siteUrl}/compte/commandes`;
    const configuredLogo = String(extra[vars.brand === "store" ? "email_store_logo_url" : "email_logo_url"] || "");
    const logoUrl = configuredLogo.startsWith("/") ? `${siteUrl}${configuredLogo}` : configuredLogo;
    const { subject, html } = renderEmail(tpl, vars, senderName, logoUrl || undefined, siteUrl);
    const connectionGateway = key.startsWith("lovc_");
    const gatewayKey = process.env["LOVABLE_API_KEY"];
    if (connectionGateway && !gatewayKey) throw new Error("Connexion Brevo indisponible");
    const endpoint = connectionGateway ? "https://connector-gateway.lovable.dev/brevo/smtp/email" : "https://api.brevo.com/v3/smtp/email";
    const authHeaders = connectionGateway ? { Authorization: `Bearer ${gatewayKey}`, "X-Connection-Api-Key": key } : { "api-key": key };
    let receipt: { messageId?: string } = {};
    if (!clientReason) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { ...authHeaders, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ sender: { name: senderName, email: senderEmail }, to: [{ email: to, name: vars.nom || undefined }], subject, htmlContent: html, ...(eventId ? { headers: { idempotencyKey: await shortKey(`event-${eventId}`) } } : {}) }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error(`Brevo [${res.status}]: ${t}`);
      clientReason = `Brevo a refusé l'envoi client (${res.status}) : ${t.slice(0, 200)}`;
    } else {
      receipt = await res.json() as { messageId?: string };
      console.info("Email accepted", { kind, eventId, messageId: receipt.messageId });
    }
    }
    let adminWarning = "";
    if (!data.test && !data.toEmail && kind !== "panier" && kind !== "alerte_admin" && extra["email_admin_alerts_enabled"] !== false) {
      const recipients = [...new Set(String(extra["email_admin_recipients"] || "").split(/[\s,;]+/).filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))].slice(0, 10);
      const adminTemplate = mergeTemplates(extra["email_templates"]).alerte_admin;
      if (!recipients.length) adminWarning = "Aucune adresse administrateur enregistrée";
      else if (!adminTemplate.enabled) adminWarning = "Modèle alerte administrateur désactivé";
      else {
        const adminVars = { ...vars, lien: `${siteUrl}${adminLink}`, details: `Client : ${vars.nom || ""} (${vars.code || ""})\n${vars.produit || ""}\n${vars.details || ""}`, produit: "" };
        const rendered = renderEmail(adminTemplate, adminVars, senderName, logoUrl || undefined, siteUrl);
        for (const email of recipients) {
          const alert = await fetch(endpoint, { method: "POST", headers: { ...authHeaders, "content-type": "application/json" }, body: JSON.stringify({ sender: { name: senderName, email: senderEmail }, to: [{ email }], subject: rendered.subject, htmlContent: rendered.html, ...(eventId ? { headers: { idempotencyKey: await shortKey(`admin-${eventId}-${email}`) } } : {}) }) });
          if (!alert.ok) { const body = await alert.text(); console.error(`Brevo admin [${alert.status}]: ${body}`); adminWarning = `Alerte administrateur refusée (${alert.status}) : ${body.slice(0, 200)}`; }
        }
      }
    }
    return { sent: !clientReason, reason: [clientReason, adminWarning].filter(Boolean).join(" · "), messageId: receipt.messageId };
  }
