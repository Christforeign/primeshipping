import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Admin-only: permanently deletes a customer account (not staff, not self).
export const deleteCustomerAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(d?.userId || "")) throw new Error("Compte invalide");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("admin_delete_customer_account", { _user_id: data.userId });
    if (error) throw new Error("Suppression impossible : vérifie tes droits et que le compte n’appartient pas au personnel.");
    return { ok: true };
  });
