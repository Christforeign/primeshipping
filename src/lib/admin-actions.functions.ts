import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { manualEmailSchema, orderDeletionSchema } from "./manual-email";

export const deleteShopOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => orderDeletionSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("admin_delete_shop_order", { _order_id: data.orderId });
    if (error) throw new Error("Suppression impossible. Vérifie tes droits et réessaie.");
    return { ok: true };
  });

export const sendManualEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => manualEmailSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: roles, error: roleError } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    if (roleError || !roles?.some((r) => r.role === "admin" || r.role === "super_admin")) throw new Error("Accès administrateur requis");
    const { sendManualBrevo } = await import("./manual-brevo.server");
    return sendManualBrevo(context.supabase, context.userId, data);
  });