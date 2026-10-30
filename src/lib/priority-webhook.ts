import { z } from "zod";

export const priorityPayload = z.object({
  messageId: z.string().trim().min(1).max(500),
  from: z.string().trim().email().max(320),
  subject: z.string().max(1000).default(""),
  text: z.string().min(1).max(100000),
}).strict();

export async function verifyPriorityToken(actual: string | null, expected: string) {
  if (!actual || !expected) return false;
  const hash = async (s: string) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
  const [a, b] = await Promise.all([hash(actual), hash(`Bearer ${expected}`)]);
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return difference === 0;
}