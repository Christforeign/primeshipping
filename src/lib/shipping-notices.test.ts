import { describe, expect, it } from "vitest";
import { defaultShippingNotices, priorityWeightSchema, shippingNoticeSettingsSchema } from "./shipping-notices";
describe("Shipping announcement safeguards", () => {
  it("preserves the received 0.20 lb and allows staff to correct it", () => {
    const id = "00000000-0000-4000-8000-000000000001";
    expect(priorityWeightSchema.parse({ id, weight: 0.20 }).weight).toBe(0.20);
    expect(priorityWeightSchema.parse({ id, weight: 1.47 }).weight).toBe(1.47);
    expect(priorityWeightSchema.safeParse({ id, weight: -1 }).success).toBe(false);
  });
  it("keeps notices off until staff enables them", () => {
    expect(defaultShippingNotices.arrivals_enabled).toBe(false);
    expect(defaultShippingNotices.reminders_enabled).toBe(false);
  });
  it("caps general e-mails at 100 to leave room in the 300 daily allowance", () => {
    expect(shippingNoticeSettingsSchema.safeParse({ ...defaultShippingNotices, email_daily_limit: 100 }).success).toBe(true);
    expect(shippingNoticeSettingsSchema.safeParse({ ...defaultShippingNotices, email_daily_limit: 101 }).success).toBe(false);
  });
});
import { parseSuffixes } from "./shipping-notices";
describe("parseSuffixes", () => {
  it("keeps only the last 5 characters of each tracking", () => {
    expect(parseSuffixes("gfus01079797534594, 879139489368")).toEqual(["34594", "89368"]);
  });
  it("ignores entries shorter than 5", () => { expect(parseSuffixes("123, ab")).toEqual([]); });
});
