import { describe, expect, it } from "vitest";
import { readReceivedParcels } from "./received-parcels";

describe("public received parcels", () => {
  it("exposes only the last five characters, carrier and receipt date", () => {
    const result = readReceivedParcels({ total: 1, items: [{ suffix: "34594", carrier: "GOFO", received_at: null, tracking: "gfus01079797534594", consignee: "PRIVATE", weight_lb: 0.2 }] });
    expect(result.items).toEqual([{ suffix: "34594", carrier: "GOFO", received_at: null }]);
  });
  it("rejects a full tracking instead of a five-character suffix", () => {
    expect(() => readReceivedParcels({ total: 1, items: [{ suffix: "gfus01079797534594", carrier: "GOFO" }] })).toThrow();
  });
  it("allows receipt without any weight", () => {
    expect(readReceivedParcels({ total: 1, items: [{ suffix: "34594", carrier: "GOFO" }] }).items.length).toBe(1);
  });
});