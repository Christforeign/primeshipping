export type ReceivedParcel = { suffix: string; carrier: string; received_at: string | null };
export type ReceivedParcelPage = { items: ReceivedParcel[]; total: number };

/** Explicit projection prevents unexpected private fields from reaching the UI. */
export function readReceivedParcels(input: unknown): ReceivedParcelPage {
  if (!input || typeof input !== "object") throw new Error("Réceptions indisponibles");
  const data = input as Record<string, unknown>;
  if (!Array.isArray(data.items) || typeof data.total !== "number") throw new Error("Réceptions indisponibles");
  const items = data.items.map((entry: unknown) => {
    if (!entry || typeof entry !== "object") throw new Error("Réception invalide");
    const row = entry as Record<string, unknown>;
    if (typeof row.suffix !== "string" || !/^[A-Z0-9]{5}$/.test(row.suffix) || typeof row.carrier !== "string") throw new Error("Réception invalide");
    return { suffix: row.suffix, carrier: row.carrier, received_at: typeof row.received_at === "string" ? row.received_at : null };
  });
  return { items, total: data.total };
}