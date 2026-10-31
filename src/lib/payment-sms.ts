import { z } from 'zod';
export const smsPayload = z.object({ provider: z.enum(['moncash', 'natcash']), text: z.string().trim().min(10).max(2000) }).strict();
export type PaymentSms = { provider: 'moncash' | 'natcash'; amountHtg: number; transactionId: string; senderPhone: string; contentCode: string | null };
export function parsePaymentSms(provider: 'moncash' | 'natcash', text: string): PaymentSms | null {
  const match = provider === 'moncash'
    ? /^Ou resevwa G([\d,]+\.\d{2}) pa MonCash de\s+(\d{8,15})\.\s*Txn ID:\s*(\d{6,30})\.\s*$/i.exec(text.trim())
    : /^Ou resevwa ([\d,]+(?:\.\d{1,2})?) HTG nan .+? (\d{8,15}) nan \d{2}:\d{2} \d{2}\/\d{2}\/\d{4}, kontni:\s*(\d{1,20})\. Balans ou:\s*[\d,.]+ HTG\. Transcode:\s*(\d{6,30})\. Mesi\s*$/i.exec(text.trim());
  if (!match) return null;
  const amountHtg = Number(match[1]?.replaceAll(',', ''));
  if (!Number.isFinite(amountHtg) || amountHtg <= 0 || amountHtg > 10000000) return null;
  const senderPhone = match[2];
  const transactionId = provider === 'moncash' ? match[3] : match[4];
  if (!senderPhone || !transactionId) return null;
  return { provider, amountHtg, transactionId, senderPhone, contentCode: provider === 'natcash' ? match[3] || null : null };
}