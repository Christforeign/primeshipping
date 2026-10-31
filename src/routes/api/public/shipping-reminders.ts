import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

export const Route = createFileRoute("/api/public/shipping-reminders")({
  server: { handlers: { POST: async ({ request }) => {
    const denied = await authenticateCronRequest(request);
    if (denied) return denied;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { dispatchShippingNotices } = await import("@/lib/shipping-notices.server");
    const { error } = await supabaseAdmin.rpc("enqueue_shipping_notice", { p_kind: "reminder" });
    if (error) return Response.json({ error: "Rappels interrompus" }, { status: 500 });
    return Response.json(await dispatchShippingNotices(supabaseAdmin));
  } } },
});