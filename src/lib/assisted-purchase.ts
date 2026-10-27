// Validation partagée des demandes d'achat assisté envoyées sans compte (invités).
// La base recalcule toujours frais et totaux ; ici on ne valide que la forme.

export interface AssistedGuestInput {
  store_name: string;
  product_link: string;
  product_image_url: string;
  description: string;
  exact_price_usd: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_city: string;
  delivery_address: string;
  image_data_url: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseAssistedGuestInput(body: unknown): { ok: true; value: AssistedGuestInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Requête invalide" };
  const b = body as Record<string, unknown>;
  const str = (key: string, max: number) => {
    const v = b[key];
    return typeof v === "string" ? v.trim().slice(0, max) : "";
  };
  const raw = typeof b["exact_price_usd"] === "number" ? b["exact_price_usd"] : Number(b["exact_price_usd"]);
  if (!Number.isFinite(raw) || raw < 0 || raw > 100000) return { ok: false, error: "Montant invalide" };
  const customer_email = str("customer_email", 200);
  const customer_phone = str("customer_phone", 40);
  if (!customer_email && !customer_phone) return { ok: false, error: "Indiquez au moins un e-mail ou un numéro de téléphone" };
  if (customer_email && !EMAIL_RE.test(customer_email)) return { ok: false, error: "Adresse e-mail invalide" };
  const image_data_url = str("image_data_url", 7_500_000);
  if (image_data_url && !image_data_url.startsWith("data:image/")) return { ok: false, error: "Image invalide" };
  return {
    ok: true,
    value: {
      store_name: str("store_name", 120) || "Multi-sites / À identifier",
      product_link: str("product_link", 1000),
      product_image_url: str("product_image_url", 1000),
      description: str("description", 2000) || "Article soumis par le client pour vérification",
      exact_price_usd: Math.round(raw * 100) / 100,
      customer_name: str("customer_name", 120) || "Client Prime",
      customer_email,
      customer_phone,
      delivery_city: str("delivery_city", 120),
      delivery_address: str("delivery_address", 400),
      image_data_url,
    },
  };
}
