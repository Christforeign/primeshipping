import { z } from "zod";

export const shippingNoticeSettingsSchema = z.object({
  arrivals_enabled: z.boolean(), reminders_enabled: z.boolean(), email_enabled: z.boolean(),
  reminder_days: z.number().int().min(1).max(30),
  email_daily_limit: z.number().int().min(0).max(100),
});
export const priorityWeightSchema = z.object({ id: z.string().uuid(), weight: z.number().finite().min(0).max(10000) });
export const defaultShippingNotices = { arrivals_enabled: false, reminders_enabled: false, email_enabled: false, reminder_days: 7, email_daily_limit: 100 };