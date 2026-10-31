import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { priorityWeightSchema, shippingNoticeSettingsSchema } from "./shipping-notices";

export const saveShippingNoticeSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth]).inputValidator(shippingNoticeSettingsSchema)
  .handler(async ({ data, context }) => {
    const { data: staff, error } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (error || !staff) throw new Error("Non autorisé");
    const { error: saveError } = await context.supabase.from("shipping_notice_settings").upsert({ id: 1, ...data });
    if (saveError) throw saveError;
    return { saved: true };
  });

export const updatePriorityWeight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth]).inputValidator(priorityWeightSchema)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("update_priority_weight", { p_id: data.id, p_weight: data.weight });
    if (error) throw error;
    return { saved: true };
  });