import { describe, expect, it } from "vitest";
import { manualEmailSchema, orderDeletionSchema } from "./manual-email";
const input = { audience: "all", subject: "Information", message: "Votre message", eventId: "00000000-0000-4000-8000-000000000001", confirmed: true };
describe("manual email rules", () => {
  it("requires explicit confirmation for all clients", () => {
    expect(manualEmailSchema.safeParse({ ...input, confirmed: false }).success).toBe(false);
    expect(manualEmailSchema.safeParse(input).success).toBe(true);
  });
  it("requires a selected account for one client", () => {
    expect(manualEmailSchema.safeParse({ ...input, audience: "client" }).success).toBe(false);
    expect(manualEmailSchema.safeParse({ ...input, audience: "client", userId: input.eventId }).success).toBe(true);
  });
  it("rejects an invalid order id", () => {
    expect(orderDeletionSchema.safeParse({ orderId: "test" }).success).toBe(false);
  });
});