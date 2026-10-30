import { createFileRoute } from "@tanstack/react-router";
import { priorityPayload, verifyPriorityToken } from "@/lib/priority-webhook";
import { parsePriorityEmails, matchClient } from "@/lib/priority-parser";

export const Route = createFileRoute("/api/public/priority-webhook")({
  server: { handlers: {
    POST: async ({ request }) => {
      const secret = process.env["PRIORITY_WEBHOOK_SECRET"];
      const senders = (process.env["PRIORITY_ALLOWED_SENDERS"] || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
      if (!secret || !senders.length) return Response.json({ error: "Réception non activée" }, { status: 503 });
      if (!await verifyPriorityToken(request.headers.get("authorization"), secret)) return Response.json({ error: "Non autorisé" }, { status: 401 });
      // Bound the actual stream, not merely the optional Content-Length header.
      const reader = request.body?.getReader();
      if (!reader) return Response.json({ error: "Message manquant" }, { status: 400 });
      const chunks: Uint8Array[] = []; let size = 0;
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > 150000) { await reader.cancel(); return Response.json({ error: "Message trop volumineux" }, { status: 413 }); }
        chunks.push(chunk.value);
      }
      const bytes = new Uint8Array(size); let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
      let input: unknown;
      try { input = JSON.parse(new TextDecoder().decode(bytes)); } catch { return Response.json({ error: "JSON invalide" }, { status: 400 }); }
      const parsed = priorityPayload.safeParse(input);
      if (!parsed.success) return Response.json({ error: "Champs invalides" }, { status: 400 });
      if (!senders.includes(parsed.data.from.toLowerCase())) return Response.json({ error: "Expéditeur refusé" }, { status: 403 });
      const items = parsePriorityEmails(parsed.data.text);
      if (!items.length || items.length > 50 || items.some((i) => i.tracking.length > 200 || i.content.length > 3000 || (i.weightLb !== null && (!Number.isFinite(i.weightLb) || i.weightLb < 0 || i.weightLb > 10000)))) return Response.json({ error: "Avis Priority non reconnu" }, { status: 422 });
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { sendPriorityPackageEmail } = await import("@/lib/email.functions");
        const { data: clients, error } = await supabaseAdmin.from("profiles").select("id,full_name,client_code");
        if (error) throw error;
        let assigned = 0; let pending = 0; let emailPending = 0;
        for (const item of items) {
          const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${parsed.data.messageId}:${item.tracking.toLowerCase()}`));
          const sourceKey = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2,"0")).join("");
          const userId = matchClient(item.consignee, clients || []);
          const { data: row, error: insertError } = await supabaseAdmin.rpc("commit_priority_import", {
            p_source_key: sourceKey, p_tracking: item.tracking, p_reception: item.reception,
            p_consignee: item.consignee, p_content: item.content, p_weight: item.weightLb as number,
            ...(userId ? { p_user_id: userId } : {}),
          });
          if (insertError) throw insertError;
          if (!row.package_id) { pending++; continue; }
          assigned++;
          if (!row.email_sent) {
            const result = await sendPriorityPackageEmail(supabaseAdmin, row.package_id);
            const { error: updateError } = await supabaseAdmin.from("priority_imports").update({ email_sent: result.sent, email_error: result.reason || null }).eq("id",row.id);
            if (updateError) throw updateError;
            if (!result.sent) emailPending++;
          }
        }
        return Response.json({ accepted: true, assigned, pending, emailPending });
      } catch (error) {
        console.error("Priority receiver failed", error instanceof Error ? error.message : "Unknown error");
        return Response.json({ error: "Import interrompu, nouvelle tentative possible" }, { status: 500 });
      }
    },
  } },
});