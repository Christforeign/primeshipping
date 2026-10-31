import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { sendManualBrevo } from "./manual-brevo.server";

export async function dispatchShippingNotices(db: SupabaseClient<Database>) {
  const { data: settings } = await db.from("company_settings").select("extra").eq("id", 1).maybeSingle();
  const configured = String((settings?.extra as Record<string, unknown> | null)?.["site_url"] || "https://primeshipping.net");
  const site = /^https:\/\//.test(configured) ? configured.replace(/\/$/, "") : "https://primeshipping.net";
  const { data: jobs, error } = await db.rpc("claim_shipping_notice_emails");
  if (error) throw error;
  let sent = 0, failed = 0;
  for (const job of jobs || []) {
    try {
      const result = await sendManualBrevo(db, job.user_id, { audience: "client", userId: job.user_id, eventId: job.id, subject: job.title, message: `${job.body}\n\n${site}${job.link}` });
      const ok = result.sent > 0 && result.failed === 0;
      const { error: updateError } = await db.from("shipping_notice_deliveries").update({ email_status: ok ? "sent" : "failed", email_error: ok ? null : "Envoi refusé ou adresse absente ; consulter les journaux." }).eq("id", job.id);
      if (updateError) throw updateError;
      if (ok) sent++; else failed++;
    } catch {
      await db.from("shipping_notice_deliveries").update({ email_status: "failed", email_error: "Envoi interrompu ; consulter les journaux." }).eq("id", job.id);
      failed++;
    }
  }
  return { sent, failed };
}