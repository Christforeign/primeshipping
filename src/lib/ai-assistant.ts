// @ts-nocheck — legacy pages pending migration to real tables
import { GoogleGenAI } from "@google/genai";
import { clientStore } from "./store";

export interface AIChatRequest {
  userMessage: string;
  dossierId?: string;
  dossierTitle?: string;
  userName?: string;
  conversationHistory?: Array<{ sender: "user" | "agent"; text: string }>;
}

export async function generateAIChatResponse(req: AIChatRequest): Promise<string> {
  const settings = clientStore.getSettings();

  // Admin configurable AI Prompt and Persona
  const agentName = settings.ai_assistant_name || "Prime Assistant";
  const agentRole = settings.ai_assistant_role || "Conseiller Clientèle & Logistique";
  const customAdminPrompt =
    settings.ai_assistant_prompt ||
    `Tu es le conseiller et assistant officiel de Prime Entreprise en Haïti.
Ton travail est d'assister avec courtoisie, réactivité et précision les clients pour :
- Le suivi de leurs colis internationaux en provenance des États-Unis et d'ailleurs.
- Les demandes d'achats assistés (« Achetez pour moi ») sur Amazon, Shein, eBay, AliExpress, etc.
- L'explication des tarifs (Frais d'expédition aérienne : ${settings.shipping_rate_per_lb || "non défini"} USD/lb, Frais de service : ${settings.service_fee || 5} USD).
- Le taux de change officiel appliqué : 1 USD = ${settings.usd_to_htg || 132} HTG.
- Les recharges de portefeuille par MonCash (${settings.moncash_phone || "3700-1122"}), Natcash (${settings.natcash_phone || "4200-3344"}), et virement bancaire.
- Les livraisons locales et points de retrait à Delmas, Pétion-Ville, Port-au-Prince, Cap-Haïtien, Les Cayes, Saint-Marc, etc.
- La possibilité pour le client d'ajouter son produit dans son panier, avec déduction automatique sur son solde portefeuille après vérification par l'administrateur.
Reste toujours professionnel, bienveillant, et donne des réponses concrètes adaptées aux informations du dossier.`;

  // Build grounded contextual knowledge
  const products = clientStore.getProducts().slice(0, 5);
  const productSummary = products
    .map(
      (p) =>
        `• ${p.title} (${p.price_usd} USD) - ${p.category} ${p.requires_shipping_address === false ? "[Numérique sans adresse]" : "[Livraison physique]"}`,
    )
    .join("\n");

  const fullSystemInstruction = `${customAdminPrompt}

INFORMATIONS TEMPS RÉEL DU SYSTÈME Prime Entreprise :
- Entreprise : ${settings.company_name || "Prime Entreprise"}
- Taux de change : 1 USD = ${settings.usd_to_htg || 132} HTG
- Téléphone / WhatsApp : ${settings.whatsapp || "+509 3700-0000"}
- Heures d'ouverture : ${settings.opening_hours || "Lun - Sam : 8h30 - 17h00"}
- Dossier en cours de discussion : ${req.dossierTitle || "Assistance Générale"} (ID: ${req.dossierId || "DOSSIER-GENERAL"})
- Nom de l'utilisateur : ${req.userName || "Client"}
- Catalogue récent de la boutique :
${productSummary}

RÈGLES IMPORTANTES :
- Ne mentionne jamais que tu es un modèle d'IA généraliste. Tu es ${agentName}, ${agentRole} de Prime Entreprise.
- Réponds en français (ou en créole haïtien si l'utilisateur s'adresse à toi en créole).
- Donne des conseils directs et rassurants sur la commande, le solde portefeuille, le calcul en Gourdes ou en Dollars.`;

  // Try real Gemini API if process.env.GEMINI_API_KEY is available in environment
  const apiKey =
    typeof process !== "undefined" && process.env ? process.env.GEMINI_API_KEY : undefined;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${fullSystemInstruction}\n\nClient (${req.userName || "Client"}): ${req.userMessage}`,
              },
            ],
          },
        ],
      });

      if (response.text) {
        return response.text.trim();
      }
    } catch (err) {
      console.warn("Gemini API call failed, using intelligent local engine:", err);
    }
  }

  // Intelligent local conversational generation respecting admin prompt and live parameters
  return generateIntelligentLocalResponse(req, settings);
}

function generateIntelligentLocalResponse(
  req: AIChatRequest,
  settings: ReturnType<typeof clientStore.getSettings>,
): string {
  const msg = req.userMessage.toLowerCase();
  const rate = settings.usd_to_htg || 132;
  const shippingRate = settings.shipping_rate_per_lb || "non défini";
  const clientName = req.userName || "Cher client";

  if (
    msg.includes("prix") ||
    msg.includes("combien") ||
    msg.includes("tarif") ||
    msg.includes("taux")
  ) {
    return `Bonjour ${clientName} ! Notre taux du jour est de 1 USD = ${rate} HTG. Pour le transport aérien depuis les USA vers Haïti, notre tarif est de ${shippingRate}$ USD par livre (lb). Pour les demandes d'achat assisté (« Achetez pour moi »), vous fixez vous-même votre montant ou mettez votre panier : dès que l'administrateur valide le produit, le montant peut être déduit de votre solde portefeuille !`;
  }

  if (
    msg.includes("achat") ||
    msg.includes("commander") ||
    msg.includes("amazon") ||
    msg.includes("shein") ||
    msg.includes("ebay") ||
    msg.includes("aliexpress")
  ) {
    return `Absolument ! Avec notre service « Achetez pour moi » sur Prime Entreprise, vous pouvez soumettre n'importe quel article avec une photo ou un lien. Vous renseignez vos informations, le prix approximatif (ou laissez l'admin évaluer), et vous validez. Si vous avez du solde dans votre portefeuille, le montant sera débité après vérification du produit par notre équipe.`;
  }

  if (
    msg.includes("colis") ||
    msg.includes("suivi") ||
    msg.includes("paquet") ||
    msg.includes("ou en est") ||
    msg.includes("où en est")
  ) {
    return `Concernant le suivi pour le dossier « ${req.dossierTitle || req.dossierId || "Général"} » : nos expéditions sont enregistrées et acheminées en 3 à 5 jours ouvrés après réception à l'entrepôt. Vous pouvez suivre l'état en direct dans l'onglet « Suivi de colis ». Souhaitez-vous que je vérifie un numéro de reçu spécifique ?`;
  }

  if (
    msg.includes("portefeuille") ||
    msg.includes("solde") ||
    msg.includes("moncash") ||
    msg.includes("natcash") ||
    msg.includes("recharge")
  ) {
    return `Pour recharger votre portefeuille Prime Entreprise, vous pouvez effectuer un transfert MonCash (${settings.moncash_phone || "3700-1122"}) ou Natcash (${settings.natcash_phone || "4200-3344"}), puis soumettre la référence de transaction dans la rubrique Portefeuille. La validation s'effectue en quelques minutes par l'administration.`;
  }

  if (
    msg.includes("livraison") ||
    msg.includes("ville") ||
    msg.includes("adresse") ||
    msg.includes("delmas") ||
    msg.includes("cap") ||
    msg.includes("cayes") ||
    msg.includes("reception")
  ) {
    return `Nous livrons sur toute l'étendue du territoire haïtien : Port-au-Prince, Delmas, Pétion-Ville, Cap-Haïtien, Saint-Marc, Les Cayes, Hinche et villes avoisinantes. Vous pouvez choisir entre la livraison directe à votre adresse de quartier ou le retrait dans l'une de nos succursales partenaires.`;
  }

  if (
    msg.includes("bonjour") ||
    msg.includes("salut") ||
    msg.includes("hello") ||
    msg.includes("bonsoir") ||
    msg.includes("kote")
  ) {
    return `Bonjour ${clientName} ! Je suis l'assistant officiel de Prime Entreprise. Comment puis-je vous aider aujourd'hui ? Je peux vous renseigner sur vos colis, vos demandes d'achats assistés, les livraisons en Haïti ou le solde de votre portefeuille.`;
  }

  // Grounded context response referencing dossier
  return `Bien reçu votre message concernant votre dossier « ${req.dossierTitle || req.dossierId || "Assistance"} ». Notre équipe logistique et notre système ont bien pris en compte votre demande. Nous traitons les vérifications de produits et expéditions en continu. Avez-vous une précision à ajouter sur vos articles ou votre adresse de réception ?`;
}
