import { describe, expect, it } from "vitest";
import { INITIAL_ANNOUNCEMENT, readAnnouncement, shouldShowAnnouncement } from "./site-announcement";

describe("site announcement controls", () => {
  it("completely removes an announcement when deleted in admin", () => {
    expect(shouldShowAnnouncement(readAnnouncement(null), null)).toBe(false);
  });
  it("does not show disabled announcements", () => {
    expect(shouldShowAnnouncement({ ...INITIAL_ANNOUNCEMENT, enabled: false }, null)).toBe(false);
  });
  it("respects dismissal until a changed announcement is published", () => {
    expect(shouldShowAnnouncement(INITIAL_ANNOUNCEMENT, INITIAL_ANNOUNCEMENT.version)).toBe(false);
    expect(shouldShowAnnouncement({ ...INITIAL_ANNOUNCEMENT, version: "updated" }, INITIAL_ANNOUNCEMENT.version)).toBe(true);
  });
});