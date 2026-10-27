import { createFileRoute } from "@tanstack/react-router";
import { parseAssistedGuestInput } from "@/lib/assisted-purchase";

// Point d'entrée public pour les demandes d'achat assisté envoyées sans compte.
// Aucune donnée privée n'est renvoyée : le visiteur reçoit seulement une confirmation.
export const Route = createFileRoute("/api/public/assisted-purchase")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const parsed = parseAssistedGuestInput(await request.json());
          if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });
          const value = parsed.value;

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          // Image jointe éventuelle : stockée dans le bucket privé média.
          let product_image_url = value.product_image_url;
          if (!product_image_url && value.image_data_url) {
            try {
              const res = await fetch(value.image_data_url);
              const buf = new Uint8Array(await res.arrayBuffer());
              if (buf.byteLength > 0 && buf.byteLength <= 5 * 1024 * 1024) {
                const extMatch = value.image_data_url.slice(5, 40).match(/image\/([a-z0-9+)/)?i) ?? null;
                const ext = (extMatch?.[1] || "jpg").replace("jpeg", "jpg");
                const path = `assisted/invites/${crypto.randomUUID()}.${ext}`;
                const up = await supabaseAdmin.storage
                  .from("media")
                  .upload(path, buf, { contentType: `image/${ext === "jpg" ? "jpeg" : ext}`, upsert: false });
                if (!up.error) {
                  const signed = await supabaseAdmin.storage.from("media").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
                  if (signed.data?.signedUrl) product_image_url = signed.data.signedUrl;
                }
              }
            } catch (e) {
              console.error("assisted image", e);
            }
          }

          const { data: row, error } = await supabaseAdmin
            .from("assisted_purchases")
            .insert({
              user_id: null,
              customer_name: value.customer_name,
              customer_email: value.customer_email,
              customer_phone: value.customer_phone,
              store_name: value.store_name,
              product_link: value.product_link,
              product_image_url,
              description: value.description,
              exact_price_usd: value.exact_price_usd,
              delivery_city: value.delivery_city,
              delivery_address: value.delivery_address,
              deduct_from_wallet_after_verification: false,
              admin_notes: "Demande envoyée sans compte (invité)",
            })
            .select("id")
            .single();
          if (error || !row) {
            console.error("assisted insert", error?.message);
            return Response.json({ error: "Enregistrement impossible. Réessayez." }, { status: 500 });
          }

          try {
            const { sendAssistedPurchaseEmail } = await import("@/lib/email.functions");
            await sendAssistedPurchaseEmail(supabaseAdmin, row.id);
          } catch (e) {
            console.error("assisted email", e);
          }

          return Response.json({ ok: true });
        } catch {
          return Response.json({ error: "Requête invalide" }, { status: 400 });
        }
      },
    },
  },
});
