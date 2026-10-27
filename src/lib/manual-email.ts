import { z } from "zod";

export const manualEmailSchema = z.object({
  audience: z.enum(["client", "all"]),
  userId: z.string().uuid().optional(),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(10000),
  eventId: z.string().uuid(),
  confirmed: z.boolean(),
}).superRefine((data, ctx) => {
  if (data.audience === "client" && !data.userId) ctx.addIssue({ code: "custom", message: "Choisis un client" });
  if (!data.confirmed) ctx.addIssue({ code: "custom", message: "Confirme l'envoi" });
});

export const orderDeletionSchema = z.object({ orderId: z.string().uuid() });