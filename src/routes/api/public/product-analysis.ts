import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { readProductPhoto } from "@/lib/bulk-products.functions";

export const Route = createFileRoute("/api/public/product-analysis")({
  server: { handlers: { POST: async ({ request }) => {
    const headers = { "Cache-Control": "no-store" };
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) return Response.json({ error: "Non autorisé" }, { status: 401, headers });
    const url = process.env["SUPABASE_URL"] || import.meta.env.VITE_SUPABASE_URL;
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"] || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const client = createClient(url, key, { auth: { persistSession: false }, global: { headers: { Authorization: authorization } } });
    const { data: auth, error } = await client.auth.getUser(authorization.slice(7));
    if (error || !auth.user) return Response.json({ error: "Non autorisé" }, { status: 401, headers });
    const { data: staff, error: roleError } = await client.rpc("is_staff", { _user_id: auth.user.id });
    if (roleError || !staff) return Response.json({ error: "Accès réservé" }, { status: 403, headers });
    const body = await request.text();
    if (body.length > 16000) return Response.json({ error: "Image invalide" }, { status: 413, headers });
    try {
      const input = z.object({ imageUrl: z.string().url().max(8000), categories: z.array(z.string().max(60)).max(30) }).parse(JSON.parse(body));
      const image = new URL(input.imageUrl);
      if (image.origin !== new URL(url).origin || !image.pathname.startsWith("/storage/v1/object/sign/media/products/")) {
        return Response.json({ error: "Photo non autorisée" }, { status: 400, headers });
      }
      return Response.json(await readProductPhoto(input), { headers });
    } catch {
      return Response.json({ error: "Analyse indisponible" }, { status: 400, headers });
    }
  } } },
});