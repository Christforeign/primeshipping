export type FieldType = "text" | "textarea" | "number" | "select" | "radio" | "file_upload";

export interface CustomFieldDefinition {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  description?: string;
  options?: string[]; // for select and radio
  min?: number; // for number
  max?: number; // for number
  step?: number; // for number
  unit?: string; // e.g. "lbs", "cm", "USD", "pièces"
}

export type PricingType = "fixed" | "quote" | "client_budget";

export interface ProductExtended {
  id: string;
  title: string;
  description: string;
  category: string;
  pricing_type: PricingType;
  price_usd: number; // if fixed
  apply_tax: boolean;
  requires_shipping: boolean; // if false, NO delivery address / city / pickup agency is requested
  media_urls: string[];
  video_url?: string | null;
  custom_fields: CustomFieldDefinition[];
  is_active: boolean;
  stock_status?: "in_stock" | "low_stock" | "on_order";
  created_at?: string;
  updated_at?: string;
}
