// Parses "Notificación de Recepción" e-mails from Priority Courier.
export type PriorityItem = {
  consignee: string;
  tracking: string;
  reception: string;
  content: string;
  weightLb: number | null;
};

export type MatchClient = { id: string; full_name: string | null; client_code: string | null };

const field = (block: string, label: string) => {
  const re = new RegExp(`${label}\\s*:?\\s*([^\\n\\r]+)`, "i");
  return block.match(re)?.[1]?.trim() ?? "";
};

const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

export function parsePriorityEmails(text: string): PriorityItem[] {
  const blocks = text.split(/(?=Consignatario\s*:)/i).filter((b) => /Tracking\s*:/i.test(b));
  const seen = new Set<string>();
  const items: PriorityItem[] = [];
  for (const b of blocks) {
    const tracking = field(b, "Tracking").split(/\s+/)[0];
    if (!tracking || seen.has(tracking)) continue;
    seen.add(tracking);
    const w = field(b, "Peso").replace(",", ".").match(/[\d.]+/)?.[0];
    items.push({
      consignee: field(b, "Consignatario"),
      tracking,
      reception: field(b, "Recepci[oó]n").split(/\s+/)[0],
      content: field(b, "Contenido"),
      weightLb: w ? Number(w) : null,
    });
  }
  return items;
}

/** Returns the client id when exactly one client matches; null otherwise. */
export function matchClient(consignee: string, clients: MatchClient[]): string | null {
  const code = consignee.match(/PS-?\s?(\d{3,})/i);
  if (code) {
    const c = clients.filter((x) => norm(x.client_code ?? "").replace(/ /g, "") === `ps${code[1]}`);
    if (c.length === 1) return c[0].id;
  }
  const words = norm(consignee.replace(/PS-?\s?\d+/i, "")).split(" ").filter((w) => w.length > 1);
  if (!words.length) return null;
  const hits = clients.filter((x) => {
    const name = norm(x.full_name ?? "").split(" ");
    return words.every((w) => name.includes(w));
  });
  return hits.length === 1 ? hits[0].id : null;
}
