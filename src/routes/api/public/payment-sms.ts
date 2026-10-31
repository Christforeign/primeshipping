import { createFileRoute } from '@tanstack/react-router';
import { smsPayload, parsePaymentSms } from '@/lib/payment-sms';
import { verifyPriorityToken } from '@/lib/priority-webhook';

export const Route = createFileRoute('/api/public/payment-sms')({ server: { handlers: {
  POST: async ({ request }) => {
    const secret = process.env['PAYMENT_SMS_RELAY_SECRET'];
    if (!secret || secret.length < 32) return Response.json({ error: 'Réception SMS non activée' }, { status: 503 });
    if (!await verifyPriorityToken(request.headers.get('authorization'), secret)) return Response.json({ error: 'Non autorisé' }, { status: 401 });
    const reader = request.body?.getReader();
    if (!reader) return Response.json({ error: 'Message manquant' }, { status: 400 });
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const chunk = await reader.read(); if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 12000) { await reader.cancel(); return Response.json({ error: 'Message trop long' }, { status: 413 }); }
      chunks.push(chunk.value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    let body: unknown;
    try { body = JSON.parse(new TextDecoder().decode(bytes)); } catch { return Response.json({ error: 'Message invalide' }, { status: 400 }); }
    const payload = smsPayload.safeParse(body);
    if (!payload.success) return Response.json({ error: 'Champs invalides' }, { status: 400 });
    const receipt = parsePaymentSms(payload.data.provider, payload.data.text);
    if (!receipt) return Response.json({ error: 'SMS non reconnu' }, { status: 422 });
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { error } = await supabaseAdmin.from('payment_sms_receipts').insert({ provider: receipt.provider, transaction_id: receipt.transactionId, amount_htg: receipt.amountHtg, sender_phone: receipt.senderPhone, content_code: receipt.contentCode });
    if (error && error.code !== '23505') return Response.json({ error: 'Réception interrompue' }, { status: 500 });
    return Response.json({ accepted: true, duplicate: error?.code === '23505', status: 'needs_review', credited: false });
  },
} } });