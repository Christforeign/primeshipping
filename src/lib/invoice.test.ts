import { describe, it, expect } from "vitest";
import { invoiceTotals } from "./invoice";

describe("invoice balance", () => {
  it("balance = total - payé", () => {
    const t = invoiceTotals({
      lines: [
        { label: "Fret", total: 20 },
        { label: "Frais", total: 5 },
      ],
      paid: 10,
    });
    expect(t.total).toBe(25);
    expect(t.paid).toBe(10);
    expect(t.balance).toBe(15);
  });
  it("balance never negative", () => {
    expect(invoiceTotals({ lines: [{ label: "x", total: 5 }], paid: 9 }).balance).toBe(0);
  });
});
