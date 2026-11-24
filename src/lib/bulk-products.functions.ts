import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateChatCompletion, GatewayError } from "@lovable.dev/ai-gateway";

export type BulkSuggestion = { title: string; short_description: string; description: string; category: string; group: string };

/** Reads one product photo with AI and suggests title, descriptions and one of the existing categories. Staff only. */
export const analyzeProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { imageUrl: string; categories: string[] }) => {
    if (!/^https:\/\//.test(d.imageUrl)) throw new Error("Image invalide");
    return { imageUrl: d.imageUrl, categories: (d.categories || []).slice(0, 30).map((c) => String(c).slice(0, 60)) };
  })
  .handler(async ({ data, context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("Accès réservé à l'administration");
    const cats = data.categories.length ? data.categories : ["Chaussures", "Vêtements", "Accessoires"];
    const prompt = `Tu es vendeur pour une boutique en Haïti. Analyse la photo du produit et réponds UNIQUEMENT en JSON:
{"title":"nom court et précis du modèle (ex: Air Jordan 3 Retro Blanc Ciment)","short_description":"1 phrase accrocheuse","description":"3-4 phrases en français: matière, style, usage, conseil taille","category":"une seule valeur EXACTE parmi ${JSON.stringify(cats)}","group":"nom du modèle de base pour regrouper (ex: Jordan 3 Retro)"}
Ne crée jamais de nouvelle catégorie. Pas de prix.`;
    try {
      const res = await generateChatCompletion({
        model: "openai/gpt-6-astra",
        messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: data.imageUrl } }] }],
      });
      const raw = res.choices?.[0]?.message?.content || "";
      const json = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)) as Partial<BulkSuggestion>;
      const category = cats.find((c) => c.toLowerCase() === String(json.category || "").toLowerCase()) || cats[0]!;
      return {
        ok: true as const,
        suggestion: {
          title: String(json.title || "Nouveau produit").slice(0, 120),
          short_description: String(json.short_description || "").slice(0, 200),
          description: String(json.description || "").slice(0, 1500),
          category,
          group: String(json.group || json.title || "").slice(0, 80),
        },
      };
    } catch (e) {
      console.error("analyzeProductImage", e instanceof GatewayError ? e.code : e);
      const msg = e instanceof GatewayError && e.code === "payment_required" ? "Crédits IA épuisés." : "L'IA n'a pas pu lire cette photo.";
      return { ok: false as const, error: msg };
    }
  });
