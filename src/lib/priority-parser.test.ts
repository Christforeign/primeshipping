import { describe, it, expect } from "vitest";
import { parsePriorityEmails, matchClient } from "./priority-parser";

const mail = `Consignatario: BLAISE CHRISTEVESTE
Tracking: gfus01079797534594
Recepción: PRIO2000881613
Contenido: ACC PERSONAL
Peso: 0.20 LBS`;

const clients = [
  { id: "a", full_name: "Christeveste Blaise", client_code: "PS-1001" },
  { id: "b", full_name: "Jean Blaise", client_code: "PS-1002" },
];

describe("priority parser", () => {
  it("reads tracking, reception, content and weight", () => {
    expect(parsePriorityEmails(mail)).toEqual([
      { consignee: "BLAISE CHRISTEVESTE", tracking: "gfus01079797534594", reception: "PRIO2000881613", content: "ACC PERSONAL", weightLb: 0.2 },
    ]);
  });
  it("splits several e-mails and drops duplicates", () => {
    expect(parsePriorityEmails(`${mail}\n\n${mail}\n${mail.replace("gfus01079797534594", "X2")}`)).toHaveLength(2);
  });
  it("matches by full name in any order", () => {
    expect(matchClient("BLAISE CHRISTEVESTE", clients)).toBe("a");
  });
  it("matches by PS code first", () => {
    expect(matchClient("Blaise PS-1002", clients)).toBe("b");
  });
  it("leaves ambiguous names unassigned", () => {
    expect(matchClient("Blaise", clients)).toBeNull();
  });
});
