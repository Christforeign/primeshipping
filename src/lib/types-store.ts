export type CustomFieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "phone"
  | "url"
  | "date"
  | "time"
  | "checkbox"
  | "radio"
  | "select"
  | "multiselect"
  | "file_image"
  | "file_doc"
  | "file_video"
  | "file_any";

export interface CustomFormField {
  id: string;
  label: string;
  type: CustomFieldType;
  required: boolean;
  placeholder?: string;
  help_text?: string;
  options?: string[]; // Pour select, radio, multiselect, checkbox
  order?: number;
}

export type ProductKind = "physique" | "numerique" | "service" | "topup" | "sur_mesure";

export interface ProductVariant {
  id: string;
  name: string; // Ex: "110 Diamonds", "210 Diamonds", "Abonnement 1 Mois"
  price_usd: number;
  promo_price_usd?: number | null;
  discount_percent?: number | null;
  tax_percent?: number | null;
  image_url?: string | null;
  stock?: number | null;
}

export interface ProductItem {
  id: string;
  extra?: { price_currency?: "USD" | "HTG"; delivery_pricing?: "fixed" | "quote"; delivery_fee_htg?: number; order_mode?: "site" | "link" | "whatsapp"; order_link?: string; order_label?: string; amount_mode?: "fixed" | "custom_usd"; product_rate_htg?: number | null; minimum_quantity?: number; minimum_order_usd?: number; order_notice?: string } | null;
  title: string;
  short_description?: string;
  description: string;
  category: string;
  subcategory?: string;
  kind?: ProductKind;
  price_usd: number;
  promo_price_usd?: number | null;
  apply_tax: boolean;
  tax_rate_override?: number | null;
  media_urls: string[];
  video_url?: string | null;
  variants?: ProductVariant[];
  custom_fields: CustomFormField[];
  requires_shipping_address?: boolean;
  /** How the customer receives a physical product: both, home delivery only, or branch pickup only */
  delivery_options?: "both" | "home" | "pickup";
  sku?: string;
  stock?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export type OrderStatus =
  "en_attente" | "payee" | "preparation" | "expediee" | "livree" | "annulee";

export type PaymentMethodId =
  | "moncash"
  | "natcash"
  | "sogexpress"
  | "paypal"
  | "stripe"
  | "wise"
  | "zelle"
  | "cash"
  | "crypto"
  | "wallet"
  | string;

export interface AdminPaymentConfig {
  id: PaymentMethodId;
  name: string;
  is_enabled: boolean;
  logo_url?: string;
  instructions: string;
  account_number?: string;
  phone_number?: string;
  qr_code_url?: string;
  fee_percentage?: number;
  fee_fixed_usd?: number;
  require_proof?: boolean;
}

export interface CheckoutCustomerFieldsConfig {
  require_first_name: boolean;
  require_last_name: boolean;
  require_phone: boolean;
  require_email: boolean;
  require_address: boolean;
  require_city: boolean;
  require_country: boolean;
  require_postal_code: boolean;
}

export interface OrderItem {
  id: string;
  order_number: string;
  user_id: string;
  product_id?: string | null;
  product_title: string;
  product_kind?: ProductKind;
  variant_id?: string | null;
  variant_name?: string | null;
  quantity: number;
  unit_price_usd: number;
  subtotal_usd: number;
  tax_amount_usd: number;
  service_fee_usd: number;
  total_usd: number;
  total_htg: number;
  customer_first_name?: string;
  customer_last_name?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_city?: string;
  customer_country?: string;
  delivery_address: string;
  custom_field_responses: Record<string, string>;
  payment_method: PaymentMethodId;
  payment_reference?: string | null;
  payment_proof_url?: string | null;
  payment_proof_name?: string | null;
  status: OrderStatus;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  fields: CustomFormField[];
  created_at: string;
}

export interface WalletData {
  id: string;
  user_id: string;
  balance_usd: number;
  updated_at: string;
}

export type WalletTxType = "topup" | "debit" | "refund";
export type WalletTxStatus = "pending" | "approved" | "rejected";

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  user_name?: string;
  type: WalletTxType;
  amount_usd: number;
  amount_htg: number;
  method: string;
  reference?: string | null;
  proof_url?: string | null;
  status: WalletTxStatus;
  description: string;
  package_id?: string | null;
  order_id?: string | null;
  created_at: string;
}

export interface PackagePartialPayment {
  id: string;
  package_id: string;
  user_id: string;
  amount_usd: number;
  amount_htg: number;
  created_at: string;
  note?: string;
}

export interface WhatsAppSupportContact {
  id: string;
  name: string;
  department?: string;
  phone: string;
  prefilled_message?: string;
  availability?: string;
  is_active: boolean;
}

export interface EnrichedCompanySettings {
  id: number;
  company_name: string;
  slogan: string | null;
  description: string | null;
  logo_url: string | null;
  hq_address: string | null;
  pickup_address: string | null;
  delivery_instructions: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  opening_hours: string | null;
  delivery_zones: string | null;
  currencies: string | null;
  usd_to_htg: number | null;
  shipping_rate_per_lb: number | null;
  service_fee: number | null;
  payment_instructions: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  terms: string | null;
  privacy: string | null;
  refund_policy: string | null;
  updated_at: string;
  tax_rate?: number;
  tax_enabled?: boolean;
  bg_type?: "default" | "solid" | "gradient" | "texture";
  bg_value?: string;
  promo_banner_active?: boolean;
  promo_banner_text?: string;
  promo_banner_link?: string;
  promo_banner_image?: string;
  assisted_purchase_fee_usd?: number;
  assisted_purchase_fee_percent?: number;
  assisted_purchase_fee_type?: "fixed" | "percent";
  assisted_purchase_tax_percent?: number;
  ai_assistant_enabled?: boolean;
  ai_assistant_name?: string;
  ai_assistant_role?: string;
  ai_assistant_prompt?: string;
  terms_and_conditions?: string;
  privacy_policy?: string;
  shipping_policy?: string;
  return_policy?: string;
  customer_fields_config?: CheckoutCustomerFieldsConfig;
  whatsapp_support_contacts?: WhatsAppSupportContact[];
}

export interface AppNotification {
  id: string;
  user_id?: string;
  title: string;
  message: string;
  type: "order" | "package" | "wallet" | "chat" | "system" | "colis" | "achat" | "info";
  link?: string;
  is_read: boolean;
  created_at: string;
}

export type AssistedPurchaseStatus =
  | "en_attente"
  | "en_attente_validation"
  | "validee"
  | "payee"
  | "achetee"
  | "en_cours_achat"
  | "recu_entrepot"
  | "en_vol"
  | "expedie"
  | "disponible"
  | "annulee";

export interface AssistedPurchaseRequest {
  id: string;
  request_number: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  store_name: string;
  product_link?: string;
  product_image_url?: string;
  image_base64?: string;
  description: string;
  exact_price_usd: number;
  fee_usd: number;
  tax_usd?: number;
  total_usd: number;
  total_htg: number;
  payment_choice: "wallet" | "pending_admin";
  payment_status: "pending_verification" | "verified_paid" | "rejected";
  status: AssistedPurchaseStatus;
  admin_notes?: string;
  tracking_number?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  sender_name: string;
  sender_role?: string;
  message: string;
  timestamp: string;
  attachment_url?: string;
  dossier_id?: string;
  dossier_title?: string;
}

export interface SupportThread {
  id: string;
  dossier_id: string;
  dossier_title: string;
  dossier_type: "colis" | "achat_assiste" | "commande" | "general";
  customer_id: string;
  customer_name: string;
  agent_name: string;
  agent_role: string;
  agent_avatar: string;
  status: "open" | "closed" | "escalated";
  messages: ChatMessage[];
  last_message_at: string;
}

export interface UserHaitiProfile {
  user_id: string;
  city_haiti: string;
  delivery_preference: "home" | "agency";
  pickup_agency_id?: string;
  home_address_details?: string;
  phone_whatsapp?: string;
  updated_at: string;
}
