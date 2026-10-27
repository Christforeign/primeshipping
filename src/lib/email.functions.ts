import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { EMAIL_KINDS, mergeTemplates, renderEmail, type EmailKind, type EmailVars } from "./email-templates";
import { packageEmailKind } from "./package-email";
import { formatDate, nextPackageStep, statusLabel } from "./labels";
import { orderEmailStage } from "./order-email";

type Input = { kind: EmailKind; packageId?: string; orderId?: string; walletTxId?: string; supportMessageId?: string; assistedId?: string; userId?: string; toEmail?: string; vars?: EmailVars; test?: boolean; internal?: boolean; cart?: { productId: string; variantId: string | null; quantity: number }[] };

const ASSISTED_STATUS_LABELS: Record<string, string> = {
  en_attente: "En attente",
  en_attente_validation: "En attente de validation",
  validee: "Validée",
  payee: "Payée",
  achetee: "Achetée",
  en_cours_achat: "Achat en cours",
  recu_entrepot: "Reçue à l'entrepôt",
  en_vol: "En vol vers Haïti",
  expedie: "Expédiée",
  disponible: "Disponible",
  annulee: "Annulée",
};

function assistedStatusLabel(status: string): string {
  return ASSISTED_STATUS_LABELS[status] || status;
}

export const sendClientEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Input) => {
    if (!EMAIL_KINDS.some((k) => k.kind === d.kind)) throw new Error("Type d'email invalide");
    const vars: EmailVars = {};
    for (const [k, v] of Object.entries(d.vars || {})) vars[k as keyof EmailVars] = String(v ?? "").slice(0, 3000);
    const clean = { ...d } as Input & { internal?: boolean };
    delete clean.internal;
    return { ...clean, vars };
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
    if (data.kind === "bienvenue" && !data.test) {
      if (data.toEmail || (data.userId && data.userId !== userId)) throw new Error("Non autorisé");
      target = userId; eventId = `welcome-${userId}`; data.vars = { reference: "Bienvenue" };
    }
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
      data.vars = { nom: order.customer_name || "", reference: order.order_number, produit: order.product_title, image_produit: order.product_image_url || product?.media_urls?.[0] || "", quantite: String(order.quantity), montant: `${order.payment_method === "wallet" ? `${Number(order.total_usd).toFixed(2)} USD` : `${Number(order.total_htg).toFixed(2)} GDS`}${order.delivery_quote_pending ? " (hors livraison)" : ""}`, paiement: order.payment_method === "wallet" ? "Portefeuille Prime — payé" : `${order.payment_method} — ${order.status === "en_attente" ? "à vérifier" : "approuvé"}`, livraison: order.delivery_address || "", statut: stage.label, date: formatDate(order.updated_at), brand: "store", details: [stage.message, order.delivery_quote_pending ? "Un administrateur vous notifiera le tarif de livraison en fonction de votre adresse. Les frais de livraison seront à régler séparément après confirmation." : order.delivery_mode === "pickup" ? "Retrait en succursale gratuit." : order.delivery_mode === "home" ? `Frais de livraison inclus : ${Number(order.delivery_fee_htg).toFixed(2)} GDS` : "", order.variant_name ? `Option : ${order.variant_name}` : "", order.requested_amount_usd ? `Montant à recharger : ${order.requested_amount_usd} USD\nTaux produit : ${order.product_rate_htg} HTG/USD\nTaux portefeuille : ${order.site_rate_htg} HTG/USD` : "", ...responses].filter(Boolean).join("\n") };
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
    let assistedVerified = false;
    if (data.assistedId) {
      const { data: row, error } = await supabase.from("assisted_purchases").select("*").eq("id", data.assistedId).single();
      if (error || !row) throw new Error("Demande d'achat inaccessible");
      const claimsEmail = String(context.claims.email || "").toLowerCase();
      assistedVerified = !!data.internal || !!staff || (!!row.user_id && row.user_id === userId) || (!!claimsEmail && String(row.customer_email || "").toLowerCase() === claimsEmail);
      if (!assistedVerified) throw new Error("Non autorisé");
      target = row.user_id || userId;
      kind = "achat";
      eventId = `assisted-${row.id}-${row.status}-${row.updated_at}`;
      adminLink = "/compte/admin";
      if (!row.user_id && row.customer_email) data.toEmail = row.customer_email;
      const paid = row.payment_status === "verified_paid";
      data.vars = {
        nom: row.customer_name || "",
        reference: row.request_number,
        produit: [row.store_name, row.description].filter(Boolean).join(" — "),
        montant: `${Number(row.total_usd || 0).toFixed(2)} USD (${Number(row.total_htg || 0).toFixed(2)} GDS)`,
        paiement: paid ? "Payé via portefeuille Prime" : "À confirmer par l'administration",
        statut: assistedStatusLabel(String(row.status)),
        date: formatDate(row.updated_at),
        details: [
          `Boutique : ${row.store_name || "à identifier"}`,
          row.description ? `Article : ${row.description}` : "",
          row.product_link ? `Lien : ${row.product_link}` : "",
          `Prix exact : ${Number(row.exact_price_usd || 0).toFixed(2)} USD`,
          `Frais de service : ${Number(row.fee_usd || 0).toFixed(2)} USD`,
          row.tax_usd ? `Taxes : ${Number(row.tax_usd).toFixed(2)} USD` : "",
          paid ? "Paiement confirmé via le portefeuille Prime." : "Un administrateur vérifie votre article et vous contactera pour le règlement.",
          row.delivery_city || row.delivery_address ? `Livraison en Haïti : ${[row.delivery_city, row.delivery_address].filter(Boolean).join(", ")}` : "",
        ].filter(Boolean).join("\n"),
      };
    }
    if (!staff && !assistedVerified && (target !== userId || data.toEmail)) throw new Error("Non autorisé");

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
    if (!data.test && !data.toEmail && kind !== "panier" && kind !== "alerte_admin") {
      const { data: roleEmails, error: roleError } = await supabase.rpc("admin_alert_recipients");
      if (roleError) console.error("admin recipients", roleError.message);
      const recipients = [...new Set(((roleEmails || []) as string[]).filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email !== to.toLowerCase()))].slice(0, 20);
      const adminTemplate = mergeTemplates(extra["email_templates"]).alerte_admin;
      if (!recipients.length) adminWarning = roleError ? `Lecture des administrateurs impossible : ${roleError.message}` : "Aucun compte administrateur à alerter";
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

/** Envoi des e-mails d'une demande d'achat assisté (client + alertes administrateurs) depuis une route publique. */
export async function sendAssistedPurchaseEmail(supabase: any, assistedId: string) {
  return run({ kind: "achat", assistedId, vars: {}, internal: true }, { supabase, userId: "", claims: {} });
}
