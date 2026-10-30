import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const processPriorityImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid(), userId: z.string().uuid().optional() }))
  .handler(async ({ data, context }) => {
    const { data: staff, error } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (error || !staff) throw new Error("Non autorisé");
    const { data: row, error: readError } = await context.supabase.from("priority_imports").select("package_id").eq("id", data.id).single();
    if (readError) throw readError;
    let pid = row.package_id;
    if (!pid) {
      if (!data.userId) throw new Error("Client requis");
      const result = await context.supabase.rpc("assign_priority_import", { p_id: data.id, p_user_id: data.userId });
      if (result.error) throw result.error;
      pid = result.data;
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendPriorityPackageEmail } = await import("@/lib/email.functions");
    const result = await sendPriorityPackageEmail(supabaseAdmin, pid);
    const { error: updateError } = await supabaseAdmin.from("priority_imports").update({ email_sent: result.sent, email_error: result.reason || null }).eq("id",data.id);
    if (updateError) throw updateError;
    return { sent: result.sent };
  });