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
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("Non autorisé");
    if (data.userId === context.userId) throw new Error("Tu ne peux pas supprimer ton propre compte");
    const { data: targetStaff } = await context.supabase.rpc("is_staff", { _user_id: data.userId });
    if (targetStaff) throw new Error("Retire d'abord le rôle administrateur de ce compte");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error("Suppression impossible");
    await supabaseAdmin.from("profiles").delete().eq("id", data.userId);
    return { ok: true };
  });
