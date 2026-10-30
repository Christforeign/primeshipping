import { describe, expect, it } from "vitest";
import { priorityPayload, verifyPriorityToken } from "./priority-webhook";

describe("Priority receiver security", () => {
  it("requires the relay secret", async () => {
    expect(await verifyPriorityToken(null, "test-only-secret")).toBe(false);
    expect(await verifyPriorityToken("Bearer wrong", "test-only-secret")).toBe(false);
    expect(await verifyPriorityToken("Bearer test-only-secret", "test-only-secret")).toBe(true);
  });
  it("rejects recipients and oversized payloads from the relay", () => {
    const base = { messageId: "email-1", from: "sender@example.com", text: "Tracking: ABC" };
    expect(priorityPayload.safeParse({ ...base, userId: "forged" }).success).toBe(false);
    expect(priorityPayload.safeParse({ ...base, text: "x".repeat(100001) }).success).toBe(false);
    expect(priorityPayload.safeParse(base).success).toBe(true);
  });
});