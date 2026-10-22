// @ts-nocheck — legacy pages pending migration to real tables
import type {
  ProductItem,
  ProductVariant,
  OrderItem,
  WalletTransaction,
  EnrichedCompanySettings,
  OrderStatus,
  AssistedPurchaseRequest,
  AssistedPurchaseStatus,
  ChatMessage,
  SupportThread,
  UserHaitiProfile,
  AdminPaymentConfig,
  CheckoutCustomerFieldsConfig,
  FormTemplate,
  WhatsAppSupportContact,
} from "./types-store";
import { notificationService } from "./notifications";
import { sendLocalPush } from "./push-notifications";

const STORAGE_KEYS = {
  SETTINGS: "prime_enriched_settings",
  PRODUCTS: "prime_products_store",
  ORDERS: "prime_orders_store",
  WALLET_TX: "prime_wallet_tx_store",
  WALLET_BALANCE: "prime_wallet_balance_store",
  PACKAGE_PAYMENTS: "prime_package_payments_store",
  ASSISTED_PURCHASES: "prime_assisted_purchases_store",
  SUPPORT_THREADS: "prime_support_threads_store",
  HAITI_PROFILES: "prime_user_haiti_profiles",
  PAYMENT_CONFIGS: "prime_payment_configs_store",
  CUSTOMER_FIELDS: "prime_customer_fields_store",
  FORM_TEMPLATES: "prime_form_templates_store",
};

export const DEFAULT_CUSTOMER_FIELDS: CheckoutCustomerFieldsConfig = {
  require_first_name: true,
  require_last_name: true,
  require_phone: true,
  require_email: true,
  require_address: true,
  require_city: true,
  require_country: true,
  require_postal_code: false,
};

export const DEFAULT_PAYMENTS: AdminPaymentConfig[] = [
  {
    id: "moncash",
    name: "MonCash (Digicel Haïti)",
    is_enabled: true,
    account_number: "",
    phone_number: "",
    instructions:
      "Composez *202# ou utilisez l'application MonCash. Effectuez un virement marchand ou transfert au numéro ci-dessus avec le montant exact en Gourdes (HTG), puis téléversez votre reçu ou capture.",
    fee_percentage: 0,
    fee_fixed_usd: 0,
    require_proof: true,
  },
  {
    id: "natcash",
    name: "Natcash (Natcom Haïti)",
    is_enabled: true,
    account_number: "",
    phone_number: "",
    instructions:
      "Envoyez les Gourdes par l'application Natcash au numéro officiel ci-dessus. Joignez impérativement le numéro de transaction et la capture d'écran.",
    fee_percentage: 0,
    fee_fixed_usd: 0,
    require_proof: true,
  },
  {
    id: "sogexpress",
    name: "Sogexpress / Virement Bancaire Haïti",
    is_enabled: true,
    account_number: "",
    instructions:
      "Dépôt ou virement direct auprès de la Sogebank ou d'un point Sogexpress. Gardez le bordereau estampillé pour vérification.",
    fee_percentage: 0,
    fee_fixed_usd: 0,
    require_proof: true,
  },
  {
    id: "zelle",
    name: "Zelle (USA & International)",
    is_enabled: true,
    account_number: "",
    phone_number: "",
    instructions:
      "Effectuez le paiement Zelle instantané depuis votre banque américaine vers l'e-mail ou numéro ci-dessus. Référence : votre code client.",
    fee_percentage: 0,
    fee_fixed_usd: 0,
    require_proof: true,
  },
  {
    id: "wise",
    name: "Wise (TransferWise)",
    is_enabled: true,
    account_number: "",
    instructions:
      "Paiement par transfert Wise multidevises (USD, EUR, CAD). Taux interbancaire sans marge cachée. Veuillez téléverser la confirmation Wise PDF ou image.",
    fee_percentage: 1.5,
    fee_fixed_usd: 0,
    require_proof: true,
  },
  {
    id: "paypal",
    name: "PayPal International",
    is_enabled: true,
    account_number: "",
    instructions:
      "Envoyez les fonds en USD via PayPal (mode « Biens et services » ou lien direct).",
    fee_percentage: 4.5,
    fee_fixed_usd: 0.5,
    require_proof: true,
  },
  {
    id: "stripe",
    name: "Carte Bancaire (Visa / Mastercard)",
    is_enabled: true,
    instructions:
      "Règlement sécurisé par carte bancaire internationale Visa, Mastercard ou American Express.",
    fee_percentage: 3.5,
    fee_fixed_usd: 0.3,
    require_proof: false,
  },
  {
    id: "cash",
    name: "Paiement Cash en Agence Haïti",
    is_enabled: true,
    instructions: "Réglez en espèces (USD ou HTG) directement au guichet.",
    fee_percentage: 0,
    fee_fixed_usd: 0,
    require_proof: false,
  },
  {
    id: "crypto",
    name: "Crypto-monnaies (USDT TRC20 / BEP20)",
    is_enabled: true,
    account_number: "",
    instructions:
      "Envoyez uniquement des USDT sur le réseau TRON (TRC20) à l'adresse ci-dessus. Tout envoi sur un mauvais réseau sera irrémédiablement perdu. Joignez le hash TxID.",
    fee_percentage: 1,
    fee_fixed_usd: 0,
    require_proof: true,
  },
  {
    id: "wallet",
    name: "Portefeuille Client Prime",
    is_enabled: true,
    instructions:
      "Déduction automatique et instantanée sur votre solde portefeuille client pré-rechargé.",
    fee_percentage: 0,
    fee_fixed_usd: 0,
    require_proof: false,
  },
];

export const DEFAULT_SETTINGS: EnrichedCompanySettings = {
  id: 1,
  company_name: "Prime Entreprise",
  slogan: "Plateforme Internationale de Fret, Achats Assistés et E-Commerce vers Haïti.",
  description:
    "Expédition aérienne & maritime (Prime Shipping), boutique & recharges numériques (Prime Store), achats assistés sur tous sites mondiaux et distribution dans toute la république d'Haïti.",
  logo_url: null,
  hq_address: "",
  pickup_address: "",
  delivery_instructions: "Livraison sécurisée partout en Haïti du lundi au samedi.",
  phone: "",
  whatsapp: "",
  email: "",
  opening_hours: "Lundi - Samedi : 08h00 - 17h00\nDimanche : Fermé",
  delivery_zones: "",
  currencies: "HTG, USD",
  usd_to_htg: 132,
  shipping_rate_per_lb: null,
  service_fee: 5,
  assisted_purchase_fee_usd: 5,
  assisted_purchase_fee_percent: 5,
  assisted_purchase_fee_type: "fixed",
  assisted_purchase_tax_percent: 0,
  payment_instructions:
    "Paiement en USD ou HTG par MonCash, Natcash, Sogexpress, Zelle, Wise, Crypto ou Portefeuille.",
  facebook_url: null,
  instagram_url: null,
  tiktok_url: null,
  terms:
    "L'utilisation des services de Prime Entreprise implique l'acceptation de nos conditions générales.",
  privacy:
    "Vos données sont protégées et strictement destinées au suivi de vos colis et commandes.",
  refund_policy: "Toute réclamation doit être signalée dans les 48 heures suivant la remise.",
  terms_and_conditions: `CONDITIONS GÉNÉRALES — PRIME ENTREPRISE
1. FRET INTERNATIONAL : Acheminement sécurisé Miami ➔ Haïti.
2. DÉDOUANEMENT : Formalités légales prises en charge par nos services.
3. ACHAT ASSISTÉ : Déduction après validation de conformité produit.`,
  privacy_policy: `POLITIQUE DE CONFIDENTIALITÉ — PRIME ENTREPRISE
Vos données (nom, contact, adresse en Haïti) ne font l'objet d'aucune revente commerciale.`,
  shipping_policy: `POLITIQUE D'EXPÉDITION
Départs aériens réguliers chaque semaine avec délai moyen de 3 à 5 jours ouvrés.`,
  return_policy: `POLITIQUE DE RÉCLAMATION
Signalement obligatoire dans les 48h en cas de casse ou de manquement.`,
  ai_assistant_enabled: true,
  ai_assistant_name: "Prime Assistant IA",
  ai_assistant_role: "Conseiller Clientèle Prime Entreprise",
  ai_assistant_prompt: `Tu es le conseiller officiel de Prime Entreprise en Haïti (Prime Shipping pour les colis & Prime Store pour la boutique). Ton rôle est d'aider les clients pour le suivi de colis, les devis (4.50 USD / lb), le taux de change (1 USD = 132 HTG) et les modes de règlement.`,
  updated_at: "2026-01-01T00:00:00.000Z",
  tax_rate: 10,
  tax_enabled: true,
  bg_type: "default",
  bg_value: "",
  promo_banner_active: false,
  promo_banner_text:
    "🚀 Départs aériens hebdomadaires Miami ➔ Haïti (4.50$/lb) • Taux officiel : 1 USD = 132 HTG • MonCash & Natcash acceptés !",
  promo_banner_link: "/suivi",
  customer_fields_config: DEFAULT_CUSTOMER_FIELDS,
  whatsapp_support_contacts: [
    {
      id: "wa-fret",
      name: "Support Fret & Colis Miami",
      department: "Fret & Colis",
      phone: "+509 3700-1122",
      prefilled_message: "Bonjour Prime Express Shipping, j'ai une question concernant le fret de mon colis.",
      is_active: true,
    },
    {
      id: "wa-boutique",
      name: "Service Achats & Boutique",
      department: "Achats & Boutique",
      phone: "+509 4800-2233",
      prefilled_message: "Bonjour Prime Store, je souhaite passer une commande ou poser une question.",
      is_active: true,
    },
    {
      id: "wa-general",
      name: "Service Client Général & Réclamations",
      department: "Service Client",
      phone: "+509 3100-5566",
      prefilled_message: "Bonjour, je contacte le service client Prime Express.",
      is_active: true,
    },
  ],
};

export const DEFAULT_WHATSAPP_CONTACTS: WhatsAppSupportContact[] = [
  {
    id: "wa-fret",
    name: "Support Fret & Colis Miami",
    department: "Fret & Colis",
    phone: "+509 3700-1122",
    prefilled_message: "Bonjour Prime Express Shipping, j'ai une question concernant le fret de mon colis.",
    is_active: true,
  },
  {
    id: "wa-boutique",
    name: "Service Achats & Boutique",
    department: "Achats & Boutique",
    phone: "+509 4800-2233",
    prefilled_message: "Bonjour Prime Store, je souhaite passer une commande ou poser une question.",
    is_active: true,
  },
  {
    id: "wa-general",
    name: "Service Client Général & Réclamations",
    department: "Service Client",
    phone: "+509 3100-5566",
    prefilled_message: "Bonjour, je contacte le service client Prime Express.",
    is_active: true,
  },
];

export const DEFAULT_PRODUCTS: ProductItem[] = [
  {
    id: "prod-freefire",
    title: "Recharge Diamants Free Fire (Top Up Direct ID)",
    short_description:
      "Créditez vos diamants instantanément sur votre compte Free Fire avec votre Player ID.",
    description:
      "Recharge officielle et sécurisée pour le jeu Garena Free Fire. Entrez simplement votre ID de joueur et sélectionnez la quantité désirée. Les diamants sont livrés directement sur votre compte en moins de 10 minutes après confirmation du paiement MonCash, Natcash ou Portefeuille.",
    category: "Jeux & Top Up",
    subcategory: "Free Fire",
    kind: "topup",
    price_usd: 1.0,
    promo_price_usd: null,
    apply_tax: false,
    requires_shipping_address: false,
    media_urls: [
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
    ],
    video_url: null,
    variants: [
      { id: "v-ff-110", name: "110 Diamonds", price_usd: 1.0, discount_percent: 0, stock: 999 },
      { id: "v-ff-210", name: "210 Diamonds", price_usd: 2.0, discount_percent: 0, stock: 999 },
      { id: "v-ff-530", name: "530 Diamonds", price_usd: 5.0, discount_percent: 5, stock: 999 },
      { id: "v-ff-1080", name: "1080 Diamonds", price_usd: 10.0, discount_percent: 8, stock: 999 },
      {
        id: "v-ff-2200",
        name: "2200 Diamonds (Pack Pro)",
        price_usd: 20.0,
        discount_percent: 10,
        stock: 999,
      },
    ],
    custom_fields: [
      {
        id: "cf-player-id",
        label: "ID Joueur Free Fire (Player ID)",
        type: "text",
        required: true,
        placeholder: "Ex : 1294827103",
        help_text:
          "Ouvrez Free Fire, cliquez sur votre profil en haut à gauche et copiez votre ID numérique.",
      },
      {
        id: "cf-player-nickname",
        label: "Pseudo du Joueur (Vérification)",
        type: "text",
        required: false,
        placeholder: "Ex : ProHaitiGamer",
      },
      {
        id: "cf-server-region",
        label: "Serveur / Région du compte",
        type: "select",
        options: ["Amérique Latine (LATAM)", "Amérique du Nord (NA)", "Europe / Autres"],
        required: true,
      },
      {
        id: "cf-whatsapp-notify",
        label: "Numéro WhatsApp pour confirmation",
        type: "phone",
        required: true,
        placeholder: "+509 3700-0000",
      },
    ],
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "prod-netflix",
    title: "Abonnement Streaming Netflix Premium 4K UHD",
    short_description:
      "Profitez de vos séries et films en Ultra Haute Définition sur tous vos écrans.",
    description:
      "Compte ou profil officiel Netflix Premium avec résolution 4K HDR, Dolby Atmos et audio spatial. Fonctionne sur Smart TV, ordinateur, smartphone et tablette partout en Haïti sans VPN nécessaire.",
    category: "Services numériques",
    subcategory: "Streaming & Médias",
    kind: "numerique",
    price_usd: 4.5,
    promo_price_usd: null,
    apply_tax: false,
    requires_shipping_address: false,
    media_urls: [
      "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=1200&q=80",
    ],
    video_url: null,
    variants: [
      { id: "v-net-1", name: "1 Écran Personnel (1 Mois)", price_usd: 4.5, stock: 150 },
      { id: "v-net-3", name: "Compte Famille 4 Écrans (1 Mois)", price_usd: 14.0, stock: 50 },
      {
        id: "v-net-6",
        name: "Pass 3 Mois Premium UHD",
        price_usd: 39.0,
        discount_percent: 10,
        stock: 30,
      },
      {
        id: "v-net-12",
        name: "Pass 12 Mois Sérénité",
        price_usd: 140.0,
        discount_percent: 15,
        stock: 20,
      },
    ],
    custom_fields: [
      {
        id: "cf-netflix-email",
        label: "Votre adresse e-mail personnelle",
        type: "email",
        required: true,
        placeholder: "nom@domaine.com",
        help_text: "Nous y transmettrons les identifiants et le lien d'activation sécurisé.",
      },
      {
        id: "cf-profile-name",
        label: "Nom du profil personnalisé souhaité",
        type: "text",
        required: true,
        placeholder: "Ex : Salon Jean / Marie",
      },
      {
        id: "cf-pin-code",
        label: "Code PIN à 4 chiffres pour votre profil",
        type: "text",
        required: false,
        placeholder: "Ex : 4920",
        help_text: "Permet de verrouiller l'accès à votre profil exclusif.",
      },
    ],
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "prod-shipping-order",
    title: "Expédition Express Prime Shipping (Déclaration de Colis USA ➔ Haïti)",
    short_description:
      "Enregistrez votre marchandise pour acheminement rapide et dédouanement complet.",
    description:
      "Acheminez vos paquets depuis n'importe quel site internet ou magasin aux États-Unis vers notre entrepôt de Miami jusqu'à votre domicile ou agence de retrait en Haïti. Tarif forfaitaire de 4.50 USD / lb. Dédouanement pris en charge, inspection de sécurité et notification SMS/WhatsApp à l'arrivée.",
    category: "Logistique & Fret",
    subcategory: "Prime Shipping",
    kind: "service",
    price_usd: 4.5,
    promo_price_usd: null,
    apply_tax: false,
    requires_shipping_address: true,
    media_urls: [
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80",
    ],
    video_url: null,
    variants: [
      { id: "v-ship-air", name: "Fret Aérien Express (3 à 5 jours) — Base 1 lb", price_usd: 4.5 },
      { id: "v-ship-air-heavy", name: "Colis Aérien Supérieur à 10 lbs", price_usd: 45.0 },
      { id: "v-ship-sea-box", name: "Fret Maritime — Grand Carton / Baril", price_usd: 65.0 },
    ],
    custom_fields: [
      {
        id: "cf-recipient-name",
        label: "Nom complet du destinataire en Haïti",
        type: "text",
        required: true,
        placeholder: "Prénom et Nom de famille",
      },
      {
        id: "cf-dest-city",
        label: "Ville de destination en Haïti",
        type: "select",
        options: [
          "Port-au-Prince",
          "Delmas",
          "Pétion-Ville",
          "Tabarre",
          "Carrefour",
          "Cap-Haïtien",
          "Les Cayes",
          "Saint-Marc",
          "Gonaïves",
          "Jacmel",
          "Autre ville",
        ],
        required: true,
      },
      {
        id: "cf-dest-address",
        label: "Adresse exacte ou agence de retrait",
        type: "textarea",
        required: true,
        placeholder: "Rue, numéro, repères ou préciser « Retrait agence Delmas 33 »",
      },
      {
        id: "cf-pkg-tracking-us",
        label: "Numéro de suivi américain (USPS / UPS / FedEx / Amazon TBA)",
        type: "text",
        required: true,
        placeholder: "Ex : 930012011140... ou TBA...",
      },
      {
        id: "cf-pkg-desc",
        label: "Description détaillée du contenu",
        type: "textarea",
        required: true,
        placeholder: "Ex : 2 paires de chaussures, 1 montre, vêtements...",
      },
      {
        id: "cf-pkg-invoice-doc",
        label: "Facture ou confirmation de commande (PDF ou capture)",
        type: "file_doc",
        required: false,
        help_text: "Recommandé pour accélérer le passage en douane.",
      },
    ],
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "prod-web-dev",
    title: "Création de Site Web Professionnel & E-Commerce Clé en Main",
    short_description:
      "Développez votre entreprise avec une plateforme moderne optimisée pour les paiements locaux.",
    description:
      "Conception complète de votre site internet institutionnel ou boutique en ligne moderne : interface ultra-rapide, intégration MonCash et Natcash, gestion de catalogue, formulaire de devis sur-mesure et référencement Google complet.",
    category: "Services Digitaux",
    subcategory: "Développement & Tech",
    kind: "service",
    price_usd: 180.0,
    promo_price_usd: null,
    apply_tax: false,
    requires_shipping_address: false,
    media_urls: [
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    ],
    video_url: null,
    variants: [
      { id: "v-web-landing", name: "Pack Landing Page Vitrine Premium", price_usd: 180.0 },
      {
        id: "v-web-ecommerce",
        name: "Pack Boutique E-Commerce MonCash + Cartes",
        price_usd: 390.0,
      },
      { id: "v-web-corporate", name: "Pack Entreprise & Portail Sur-Mesure", price_usd: 750.0 },
    ],
    custom_fields: [
      {
        id: "cf-company-name",
        label: "Nom de votre entreprise / marque",
        type: "text",
        required: true,
        placeholder: "Ex : Caraïbes Import SA",
      },
      {
        id: "cf-project-scope",
        label: "Description du projet & Objectifs",
        type: "textarea",
        required: true,
        placeholder: "Décrivez vos produits, vos clients cibles et les fonctionnalités voulues...",
      },
      {
        id: "cf-brand-logo-file",
        label: "Logo de votre entreprise (PNG, SVG ou JPG)",
        type: "file_image",
        required: false,
        help_text: "Téléversez votre logo en haute résolution.",
      },
      {
        id: "cf-specs-doc",
        label: "Cahier des charges ou documents de cadrage",
        type: "file_doc",
        required: false,
      },
      {
        id: "cf-desired-launch-date",
        label: "Date de livraison souhaitée",
        type: "date",
        required: false,
      },
    ],
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "prod-iphone-15",
    title: "Apple iPhone 15 Pro — Titane Authentique Débloqué",
    short_description:
      "Puce A17 Pro, boîtier titane aérospatial, système photo professionnel 48 Mpx.",
    description:
      "Smartphone haut de gamme Apple iPhone 15 Pro livré neuf sous blister d'origine avec garantie constructeur internationale. Compatible 4G/5G avec tous les opérateurs en Haïti (Digicel, Natcom) et dans le monde entier.",
    category: "Électronique & High-Tech",
    subcategory: "Smartphones",
    kind: "physique",
    price_usd: 899.0,
    promo_price_usd: 849.0,
    apply_tax: true,
    requires_shipping_address: true,
    media_urls: [
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1200&q=80",
    ],
    video_url: "https://www.youtube.com/watch?v=xqyUdNxWazA",
    variants: [
      {
        id: "v-ip-128",
        name: "128 Go — Titane Naturel",
        price_usd: 899.0,
        promo_price_usd: 849.0,
        stock: 12,
      },
      {
        id: "v-ip-256",
        name: "256 Go — Titane Bleu Nuit",
        price_usd: 999.0,
        promo_price_usd: 949.0,
        stock: 8,
      },
      {
        id: "v-ip-512",
        name: "512 Go — Titane Noir",
        price_usd: 1199.0,
        promo_price_usd: 1120.0,
        stock: 5,
      },
    ],
    custom_fields: [
      {
        id: "cf-iphone-color",
        label: "Finition couleur préférée",
        type: "radio",
        options: ["Titane Naturel", "Titane Bleu", "Titane Noir", "Titane Blanc"],
        required: true,
      },
      {
        id: "cf-protective-pack",
        label: "Option pack de protection",
        type: "select",
        options: [
          "Sans accessoire supplémentaire",
          "Verre trempé 9H + Coque antichoc MagSafe (+25 USD)",
          "Chargeur rapide USB-C 20W certifié Apple (+20 USD)",
          "Pack Complet (Coque + Verre + Chargeur 20W) (+40 USD)",
        ],
        required: true,
      },
    ],
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "prod-sneakers-urban",
    title: "Sneakers Streetwear Édition Limitée",
    short_description: "Chaussures de sport urbaines haute performance et confort maximal.",
    description:
      "Baskets streetwear sélectionnées pour leur qualité de fabrication, semelle amortissante ergonomique et style résolument moderne. Idéales pour le quotidien et les sorties en ville.",
    category: "Mode & Vêtements",
    subcategory: "Chaussures",
    kind: "physique",
    price_usd: 85.0,
    promo_price_usd: 75.0,
    apply_tax: true,
    requires_shipping_address: true,
    media_urls: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1200&q=80",
    ],
    video_url: null,
    variants: [
      { id: "v-snk-40", name: "Pointure 40 (US 7.5)", price_usd: 85.0, stock: 6 },
      { id: "v-snk-41", name: "Pointure 41 (US 8.5)", price_usd: 85.0, stock: 10 },
      { id: "v-snk-42", name: "Pointure 42 (US 9)", price_usd: 85.0, stock: 14 },
      { id: "v-snk-43", name: "Pointure 43 (US 10)", price_usd: 85.0, stock: 8 },
      { id: "v-snk-44", name: "Pointure 44 (US 11)", price_usd: 85.0, stock: 5 },
    ],
    custom_fields: [
      {
        id: "cf-snk-color",
        label: "Choix du coloris",
        type: "select",
        options: ["Rouge Passion & Noir", "Blanc Pur & Gris", "Noir Furtif Monochrome"],
        required: true,
      },
      {
        id: "cf-snk-instructions",
        label: "Instructions particulières pour la livraison",
        type: "text",
        required: false,
        placeholder: "Précisions...",
      },
    ],
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
  },
];

export const DEFAULT_FORM_TEMPLATES: FormTemplate[] = [
  {
    id: "tmpl-streaming",
    name: "Formulaire Streaming & Logiciels",
    description: "Demande d'email, mot de passe temporaire et durée pour abonnements numériques.",
    fields: [
      {
        id: "tf-1",
        label: "Email du compte",
        type: "email",
        required: true,
        placeholder: "client@domaine.com",
      },
      {
        id: "tf-2",
        label: "Mot de passe temporaire",
        type: "text",
        required: true,
        placeholder: "Secret123",
      },
      {
        id: "tf-3",
        label: "Durée d'abonnement",
        type: "select",
        options: ["1 Mois", "3 Mois", "6 Mois", "12 Mois"],
        required: true,
      },
    ],
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "tmpl-shipping",
    name: "Formulaire Expédition & Colis",
    description: "Nom destinataire, adresse exacte en Haïti, numéro de suivi et description colis.",
    fields: [
      { id: "tf-s1", label: "Nom du destinataire", type: "text", required: true },
      { id: "tf-s2", label: "Adresse de livraison en Haïti", type: "textarea", required: true },
      { id: "tf-s3", label: "Téléphone contact", type: "phone", required: true },
      { id: "tf-s4", label: "Description du colis", type: "textarea", required: true },
    ],
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "tmpl-webdev",
    name: "Formulaire Création Site & Projets",
    description: "Nom d'entreprise, descriptif projet, téléversement de logo et photos.",
    fields: [
      { id: "tf-w1", label: "Nom de l'entreprise", type: "text", required: true },
      { id: "tf-w2", label: "Description du projet", type: "textarea", required: true },
      { id: "tf-w3", label: "Logo entreprise", type: "file_image", required: false },
      { id: "tf-w4", label: "Photos & documents annexes", type: "file_doc", required: false },
    ],
    created_at: "2026-01-01T00:00:00.000Z",
  },
];

export const DEFAULT_ASSISTED_PURCHASES: AssistedPurchaseRequest[] = [];
export const DEFAULT_SUPPORT_THREADS: SupportThread[] = [
  {
    id: "thread-default",
    dossier_id: "DOSSIER-GENERAL",
    dossier_title: "Assistance & Suivi de dossier",
    dossier_type: "general",
    customer_id: "user-current",
    customer_name: "Client",
    agent_name: "Prime Assistant IA",
    agent_role: "Conseiller Clientèle Prime Entreprise",
    agent_avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    status: "open",
    messages: [
      {
        id: "msg-init",
        sender: "agent",
        sender_name: "Prime Assistant IA",
        sender_role: "Conseiller Clientèle",
        message:
          "Bonjour ! Comment pouvons-nous vous assister aujourd'hui pour vos colis ou commandes vers Haïti ?",
        timestamp: "2026-01-01T08:00:00.000Z",
      },
    ],
    last_message_at: "2026-01-01T08:00:00.000Z",
  },
];

export const clientStore = {
  // SETTINGS
  getSettings(): EnrichedCompanySettings {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  },
  updateSettings(updates: Partial<EnrichedCompanySettings>): EnrichedCompanySettings {
    const current = this.getSettings();
    const merged = { ...current, ...updates, updated_at: new Date().toISOString() };
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
      window.dispatchEvent(new Event("prime_settings_changed"));
    }
    return merged;
  },
  saveSettings(updates: Partial<EnrichedCompanySettings>) {
    return this.updateSettings(updates);
  },
  saveHaitiProfile(profile: Record<string, unknown>) {
    if (typeof window === "undefined") return;
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.HAITI_PROFILES) || "{}");
      all[String(profile.id)] = profile;
      localStorage.setItem(STORAGE_KEYS.HAITI_PROFILES, JSON.stringify(all));
    } catch {
      // ignore
    }
  },
  getHaitiProfile(id: string): Record<string, any> | null {
    if (typeof window === "undefined" || !id) return null;
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.HAITI_PROFILES) || "{}");
      return all[String(id)] || null;
    } catch {
      return null;
    }
  },

  // PAYMENT CONFIGS
  getPaymentConfigs(): AdminPaymentConfig[] {
    if (typeof window === "undefined") return DEFAULT_PAYMENTS;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PAYMENT_CONFIGS);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return DEFAULT_PAYMENTS;
  },
  savePaymentConfigs(configs: AdminPaymentConfig[]) {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.PAYMENT_CONFIGS, JSON.stringify(configs));
      window.dispatchEvent(new Event("prime_payment_configs_changed"));
    }
  },
  updatePaymentConfig(id: string, updates: Partial<AdminPaymentConfig>) {
    const list = this.getPaymentConfigs();
    const idx = list.findIndex((p) => p.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx]!, ...updates };
      this.savePaymentConfigs(list);
    }
  },
  addPaymentConfig(config: AdminPaymentConfig) {
    const list = this.getPaymentConfigs();
    list.push(config);
    this.savePaymentConfigs(list);
  },
  deletePaymentConfig(id: string) {
    const list = this.getPaymentConfigs().filter((p) => p.id !== id);
    this.savePaymentConfigs(list);
  },

  // CUSTOMER CHECKOUT FIELDS
  getCustomerFieldsConfig(): CheckoutCustomerFieldsConfig {
    if (typeof window === "undefined") return DEFAULT_CUSTOMER_FIELDS;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CUSTOMER_FIELDS);
      if (stored) return { ...DEFAULT_CUSTOMER_FIELDS, ...JSON.parse(stored) };
    } catch {
      // fallback
    }
    return DEFAULT_CUSTOMER_FIELDS;
  },
  saveCustomerFieldsConfig(cfg: CheckoutCustomerFieldsConfig) {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.CUSTOMER_FIELDS, JSON.stringify(cfg));
      window.dispatchEvent(new Event("prime_customer_fields_changed"));
    }
  },

  // FORM TEMPLATES
  getFormTemplates(): FormTemplate[] {
    if (typeof window === "undefined") return DEFAULT_FORM_TEMPLATES;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FORM_TEMPLATES);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return DEFAULT_FORM_TEMPLATES;
  },
  saveFormTemplate(tmpl: FormTemplate) {
    const list = this.getFormTemplates();
    const idx = list.findIndex((t) => t.id === tmpl.id);
    if (idx >= 0) {
      list[idx] = tmpl;
    } else {
      list.push(tmpl);
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.FORM_TEMPLATES, JSON.stringify(list));
      window.dispatchEvent(new Event("prime_form_templates_changed"));
    }
  },
  deleteFormTemplate(id: string) {
    const list = this.getFormTemplates().filter((t) => t.id !== id);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.FORM_TEMPLATES, JSON.stringify(list));
      window.dispatchEvent(new Event("prime_form_templates_changed"));
    }
  },

  // PRODUCTS
  getProducts(): ProductItem[] {
    if (typeof window === "undefined") return [];
    const demoIds = new Set(DEFAULT_PRODUCTS.map((p) => p.id));
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (stored) return (JSON.parse(stored) as ProductItem[]).filter((p) => !demoIds.has(p.id));
    } catch {
      // fallback
    }
    return [];
  },
  getProduct(id: string): ProductItem | null {
    const list = this.getProducts();
    return list.find((p) => p.id === id) || null;
  },
  saveProducts(list: ProductItem[]) {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(list));
      window.dispatchEvent(new Event("prime_products_changed"));
    }
  },
  /** Create or update a product locally (keeps the given id). */
  saveProduct(data: Partial<ProductItem>): ProductItem {
    const list = this.getProducts();
    const idx = data.id ? list.findIndex((p) => p.id === data.id) : -1;
    const now = new Date().toISOString();
    const base = idx >= 0 ? list[idx]! : null;
    const prod: ProductItem = {
      ...(base ?? {}),
      ...data,
      id: data.id || `prod-${Date.now()}`,
      title: data.title || base?.title || "Nouveau produit",
      description: data.description ?? base?.description ?? "",
      category: data.category || base?.category || "Général",
      price_usd: Number(data.price_usd ?? base?.price_usd ?? 0),
      apply_tax: !!(data.apply_tax ?? base?.apply_tax),
      media_urls: data.media_urls ?? base?.media_urls ?? [],
      custom_fields: data.custom_fields ?? base?.custom_fields ?? [],
      is_active: data.is_active ?? base?.is_active ?? true,
      created_at: base?.created_at || now,
      updated_at: now,
    } as ProductItem;
    if (idx >= 0) list[idx] = prod;
    else list.unshift(prod);
    this.saveProducts(list);
    return prod;
  },
  /** Pull products from the cloud database into the local cache. */
  async syncProductsFromCloud(): Promise<ProductItem[]> {
    if (typeof window === "undefined") return [];
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error || !data) return this.getProducts();
      const list = data.map((r) => ({ ...(r.extra as object), ...r }) as unknown as ProductItem);
      this.saveProducts(list);
      return list;
    } catch {
      return this.getProducts();
    }
  },
  createProduct(data: Partial<ProductItem>): ProductItem {
    const list = this.getProducts();
    const newProd: ProductItem = {
      id: `prod-${Date.now()}`,
      title: data.title || "Nouveau Produit",
      short_description: data.short_description || "",
      description: data.description || "",
      category: data.category || "Général",
      subcategory: data.subcategory || "",
      kind: data.kind || "physique",
      price_usd: Number(data.price_usd || 0),
      promo_price_usd: data.promo_price_usd ? Number(data.promo_price_usd) : null,
      apply_tax: !!data.apply_tax,
      tax_rate_override: data.tax_rate_override ? Number(data.tax_rate_override) : null,
      media_urls: data.media_urls && data.media_urls.length > 0 ? data.media_urls : [],
      video_url: data.video_url || null,
      variants: data.variants || [],
      custom_fields: data.custom_fields || [],
      requires_shipping_address: data.requires_shipping_address !== false,
      is_active: data.is_active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.unshift(newProd);
    this.saveProducts(list);
    return newProd;
  },
  updateProduct(id: string, updates: Partial<ProductItem>): ProductItem | null {
    const list = this.getProducts();
    const idx = list.findIndex((p) => p.id === id);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx]!,
        ...updates,
        updated_at: new Date().toISOString(),
      };
      this.saveProducts(list);
      return list[idx]!;
    }
    return null;
  },
  deleteProduct(id: string): void {
    const list = this.getProducts().filter((p) => p.id !== id);
    this.saveProducts(list);
  },
  decrementStock(productId: string, qty: number = 1, variantId?: string | null): boolean {
    const list = this.getProducts();
    const idx = list.findIndex((p) => p.id === productId);
    if (idx < 0) return false;
    const prod = list[idx]!;
    let modified = false;

    if (variantId && prod.variants && prod.variants.length > 0) {
      const vIdx = prod.variants.findIndex((v) => v.id === variantId);
      if (vIdx >= 0 && prod.variants[vIdx]!.stock != null) {
        prod.variants[vIdx]!.stock = Math.max(0, (prod.variants[vIdx]!.stock || 0) - qty);
        modified = true;
      }
    }
    if (prod.stock != null) {
      prod.stock = Math.max(0, prod.stock - qty);
      modified = true;
    }
    if (modified) {
      prod.updated_at = new Date().toISOString();
      this.saveProducts(list);
      return true;
    }
    return false;
  },

  // ORDERS
  getOrders(): OrderItem[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [];
  },
  createOrder(data: Partial<OrderItem>): OrderItem {
    const list = this.getOrders();
    const newOrder: OrderItem = {
      id: `ord-${Date.now()}`,
      order_number: `CMD-${new Date().getFullYear().toString().slice(2)}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`,
      user_id: data.user_id || "guest",
      product_id: data.product_id || null,
      product_title: data.product_title || "Commande",
      product_kind: data.product_kind || "physique",
      variant_id: data.variant_id || null,
      variant_name: data.variant_name || null,
      quantity: data.quantity || 1,
      unit_price_usd: data.unit_price_usd || 0,
      subtotal_usd: data.subtotal_usd || 0,
      tax_amount_usd: data.tax_amount_usd || 0,
      service_fee_usd: data.service_fee_usd || 0,
      total_usd: data.total_usd || 0,
      total_htg: data.total_htg || 0,
      customer_first_name: data.customer_first_name || "",
      customer_last_name: data.customer_last_name || "",
      customer_name: data.customer_name || "Client",
      customer_email: data.customer_email || "",
      customer_phone: data.customer_phone || "",
      customer_city: data.customer_city || "",
      customer_country: data.customer_country || "Haïti",
      delivery_address: data.delivery_address || "",
      custom_field_responses: data.custom_field_responses || {},
      payment_method: data.payment_method || "moncash",
      payment_reference: data.payment_reference || null,
      payment_proof_url: data.payment_proof_url || null,
      payment_proof_name: data.payment_proof_name || null,
      status: (data.status || "en_attente") as OrderStatus,
      admin_notes: data.admin_notes || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.unshift(newOrder);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(list));
      window.dispatchEvent(new Event("prime_orders_changed"));
    }
    return newOrder;
  },
  updateOrder(id: string, updates: Partial<OrderItem>): void {
    const list = this.getOrders();
    const idx = list.findIndex((o) => o.id === id);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx]!,
        ...updates,
        updated_at: new Date().toISOString(),
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(list));
        window.dispatchEvent(new Event("prime_orders_changed"));
      }
    }
  },
  deleteOrder(id: string): void {
    const list = this.getOrders().filter((o) => o.id !== id);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(list));
      window.dispatchEvent(new Event("prime_orders_changed"));
    }
  },

  // WALLET
  getWalletBalance(userId: string): number {
    if (typeof window === "undefined") return 0.0;
    try {
      const stored = localStorage.getItem(`${STORAGE_KEYS.WALLET_BALANCE}_${userId}`);
      if (stored !== null) return parseFloat(stored) || 0.0;
    } catch {
      // fallback
    }
    return 0.0;
  },
  setWalletBalance(userId: string, amount: number) {
    if (typeof window !== "undefined") {
      localStorage.setItem(`${STORAGE_KEYS.WALLET_BALANCE}_${userId}`, amount.toFixed(2));
      window.dispatchEvent(new Event("prime_wallet_changed"));
    }
  },
  getWalletTransactions(userId?: string): WalletTransaction[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.WALLET_TX);
      if (stored) {
        const all: WalletTransaction[] = JSON.parse(stored);
        if (userId) return all.filter((t) => t.user_id === userId);
        return all;
      }
    } catch {
      // fallback
    }
    return [];
  },
  addWalletTransaction(tx: Omit<WalletTransaction, "id" | "created_at">): WalletTransaction {
    const all = this.getWalletTransactions();
    const newTx: WalletTransaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
    };
    all.unshift(newTx);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.WALLET_TX, JSON.stringify(all));
      window.dispatchEvent(new Event("prime_wallet_changed"));
    }
    if (tx.status === "approved") {
      const current = this.getWalletBalance(tx.user_id);
      if (tx.type === "topup" || tx.type === "refund") {
        this.setWalletBalance(tx.user_id, current + tx.amount_usd);
      } else if (tx.type === "debit") {
        this.setWalletBalance(tx.user_id, Math.max(0, current - tx.amount_usd));
      }
    }
    return newTx;
  },

  // ASSISTED PURCHASES
  getAssistedPurchases(): AssistedPurchaseRequest[] {
    if (typeof window === "undefined") return DEFAULT_ASSISTED_PURCHASES;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ASSISTED_PURCHASES);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return DEFAULT_ASSISTED_PURCHASES;
  },
  createAssistedPurchase(data: Partial<AssistedPurchaseRequest>): AssistedPurchaseRequest {
    const list = this.getAssistedPurchases();
    const settings = this.getSettings();
    const rate = settings.usd_to_htg || 132;
    const exactPrice = data.exact_price_usd || 0;
    const fee =
      data.fee_usd !== undefined ? data.fee_usd : (settings.assisted_purchase_fee_usd ?? 5);
    const totalUsd = Number((exactPrice + fee).toFixed(2));
    const totalHtg = Math.round(totalUsd * rate);

    const newReq: AssistedPurchaseRequest = {
      id: `ach-${Date.now()}`,
      request_number: `ACH-${new Date().getFullYear().toString().slice(2)}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(100 + Math.random() * 900)}`,
      user_id: data.user_id || "anon",
      customer_name: data.customer_name || "Client",
      customer_email: data.customer_email || "",
      customer_phone: data.customer_phone || "",
      store_name: data.store_name || "Amazon",
      product_link: data.product_link || "",
      product_image_url: data.product_image_url || "",
      image_base64: data.image_base64 || "",
      description: data.description || "",
      exact_price_usd: exactPrice,
      fee_usd: fee,
      total_usd: totalUsd,
      total_htg: totalHtg,
      payment_choice: data.payment_choice || "pending_admin",
      payment_status: data.payment_status || "pending_verification",
      status: (data.payment_choice === "wallet"
        ? "payee"
        : "en_attente_validation") as AssistedPurchaseStatus,
      admin_notes: data.admin_notes || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...data,
    };
    list.unshift(newReq);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.ASSISTED_PURCHASES, JSON.stringify(list));
      window.dispatchEvent(new Event("prime_assisted_purchases_changed"));
    }
    return newReq;
  },
  updateAssistedPurchase(id: string, updates: Partial<AssistedPurchaseRequest>): void {
    const list = this.getAssistedPurchases();
    const idx = list.findIndex((a) => a.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx]!, ...updates, updated_at: new Date().toISOString() };
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.ASSISTED_PURCHASES, JSON.stringify(list));
        window.dispatchEvent(new Event("prime_assisted_purchases_changed"));
      }
    }
  },
  deleteAssistedPurchase(id: string): void {
    const list = this.getAssistedPurchases().filter((a) => a.id !== id);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.ASSISTED_PURCHASES, JSON.stringify(list));
      window.dispatchEvent(new Event("prime_assisted_purchases_changed"));
    }
  },

  // WHATSAPP SUPPORT CONTACTS
  getWhatsAppContacts(): WhatsAppSupportContact[] {
    const s = this.getSettings();
    if (s.whatsapp_support_contacts && Array.isArray(s.whatsapp_support_contacts) && s.whatsapp_support_contacts.length > 0) {
      return s.whatsapp_support_contacts;
    }
    return DEFAULT_WHATSAPP_CONTACTS;
  },
  saveWhatsAppContacts(contacts: WhatsAppSupportContact[]) {
    this.updateSettings({ whatsapp_support_contacts: contacts });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("prime_whatsapp_contacts_changed"));
    }
  },

  // SUPPORT THREADS — ISOLATED PER CLIENT
  getSupportThreads(): SupportThread[] {
    if (typeof window === "undefined") return DEFAULT_SUPPORT_THREADS;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SUPPORT_THREADS);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return DEFAULT_SUPPORT_THREADS;
  },
  getThread(dossierId?: string): SupportThread {
    const threads = this.getSupportThreads();
    if (dossierId) {
      const found = threads.find((t) => t.dossier_id === dossierId);
      if (found) return found;
    }
    return threads[0] || DEFAULT_SUPPORT_THREADS[0]!;
  },
  getClientThread(
    customerId: string,
    customerName?: string,
    dossierId?: string,
    dossierTitle?: string
  ): SupportThread {
    const threads = this.getSupportThreads();
    const effectiveCustomerId = customerId || "visiteur-anonyme";
    const effectiveDossierId = dossierId || `SUPPORT-${effectiveCustomerId}`;

    let thread = threads.find(
      (t) => t.customer_id === effectiveCustomerId && (!dossierId || t.dossier_id === dossierId)
    );

    if (!thread) {
      thread = {
        id: `thread-${effectiveCustomerId}`,
        dossier_id: effectiveDossierId,
        dossier_title: dossierTitle || "Assistance en Direct",
        dossier_type: "general",
        customer_id: effectiveCustomerId,
        customer_name: customerName || "Client",
        agent_name: "Service Client Prime Express",
        agent_role: "Conseiller Support en direct",
        agent_avatar: "/assets/aistudio/WhatsApp_Image_2026-10-14_at_20.12.29_c1b1b367.jpeg",
        status: "open",
        messages: [
          {
            id: `msg-welcome-${Date.now()}`,
            sender: "agent",
            sender_name: "Service Client Prime Express",
            sender_role: "Support en direct",
            message: `Bonjour ${customerName || ""} ! Bienvenue sur l'assistance en direct de Prime Express Shipping. Comment pouvons-nous vous aider aujourd'hui ?`,
            timestamp: new Date().toISOString(),
          },
        ],
        last_message_at: new Date().toISOString(),
      };
      threads.unshift(thread);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.SUPPORT_THREADS, JSON.stringify(threads));
        window.dispatchEvent(new Event("prime_support_threads_changed"));
      }
    }
    return thread;
  },
  sendChatMessage(
    threadId: string,
    msg: {
      sender: "user" | "agent";
      sender_name: string;
      sender_role?: string;
      message: string;
      dossier_id?: string;
      dossier_title?: string;
      attachment_url?: string;
      target_customer_id?: string;
    },
  ): ChatMessage {
    const threads = this.getSupportThreads();
    let thread = threads.find((t) => t.id === threadId);
    if (!thread) {
      thread = {
        id: threadId,
        dossier_id: msg.dossier_id || "DOSSIER-GENERAL",
        dossier_title: msg.dossier_title || "Assistance & Suivi",
        dossier_type: "general",
        customer_id: msg.target_customer_id || "user-current",
        customer_name: msg.sender_name || "Client",
        agent_name: "Prime Assistant IA",
        agent_role: "Conseiller Clientèle",
        agent_avatar: "/assets/aistudio/WhatsApp_Image_2026-10-14_at_20.12.29_c1b1b367.jpeg",
        status: "open",
        messages: [],
        last_message_at: new Date().toISOString(),
      };
      threads.push(thread);
    }

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sender: msg.sender,
      sender_name: msg.sender_name,
      sender_role: msg.sender_role,
      message: msg.message,
      timestamp: new Date().toISOString(),
      attachment_url: msg.attachment_url,
      dossier_id: msg.dossier_id || thread.dossier_id,
      dossier_title: msg.dossier_title || thread.dossier_title,
    };

    thread.messages.push(newMsg);
    thread.last_message_at = newMsg.timestamp;

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.SUPPORT_THREADS, JSON.stringify(threads));
      window.dispatchEvent(new Event("prime_support_threads_changed"));
    }

    // Push Notifications & In-App Notifications
    try {
      if (msg.sender === "agent") {
        // Notification envoyée au client
        sendLocalPush(`Nouveau message de ${msg.sender_name}`, {
          body: msg.message.slice(0, 100),
          url: "/support",
        });
        notificationService.addNotification({
          title: `Réponse Support : ${thread.dossier_title}`,
          message: msg.message,
          type: "chat",
          link: "/support",
        });
      } else {
        // Notification envoyée à l'administrateur
        sendLocalPush(`Nouveau message client de ${msg.sender_name}`, {
          body: msg.message.slice(0, 100),
          url: "/compte/admin",
        });
        notificationService.addNotification({
          title: `Message Support de ${msg.sender_name}`,
          message: msg.message,
          type: "chat",
          link: "/compte/admin",
        });
      }
    } catch {
      // safe fallback
    }

    return newMsg;
  },
};
