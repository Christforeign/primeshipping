import { afterEach, describe, expect, it, vi } from "vitest";
import { clientStore } from "./store";

vi.mock("./notifications", () => ({ notificationService: {} }));
vi.mock("./push-notifications", () => ({ sendLocalPush: vi.fn() }));

afterEach(() => vi.restoreAllMocks());

describe("optional device settings cache", () => {
  it("does not abort a Cloud settings flow when Safari denies storage", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Denied", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Denied", "QuotaExceededError");
    });
    const changed = vi.fn();
    window.addEventListener("prime_settings_changed", changed);
    try {
      const updated = clientStore.saveSettings({ phone: "+50912345678" });
      expect(updated.phone).toBe("+50912345678");
      expect(changed).toHaveBeenCalledTimes(1);
    } finally {
      window.removeEventListener("prime_settings_changed", changed);
    }
  });
});