import { describe, expect, it } from "vitest";
import { devicePromptState } from "./device-prompts";

const base = { ios: false, standalone: false, installAvailable: false, permission: "default" as const, dismissed: false };
describe("device invitations", () => {
  it("does not ask again after permission was granted", () => {
    expect(devicePromptState({ ...base, permission: "granted" })).toBe("none");
  });
  it("does not ask again after permission was refused", () => {
    expect(devicePromptState({ ...base, permission: "denied" })).toBe("none");
  });
  it("offers home screen installation on iPhone before permission", () => {
    expect(devicePromptState({ ...base, ios: true, permission: "unsupported" })).toBe("ios-install");
  });
  it("asks for permission in the installed iPhone app", () => {
    expect(devicePromptState({ ...base, ios: true, standalone: true })).toBe("permission");
  });
  it("offers the native Android installation when available", () => {
    expect(devicePromptState({ ...base, installAvailable: true })).toBe("android-install");
  });
});