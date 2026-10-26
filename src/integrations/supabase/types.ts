export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          country: string
          created_at: string
          id: string
          instructions: string | null
          is_active: boolean
          kind: Database["public"]["Enums"]["address_kind"]
          line2: string | null
          postal_code: string | null
          recipient_name: string
          region: string | null
          street: string
          updated_at: string
          user_id: string
          warehouse: string | null
        }
        Insert: {
          city: string
          country: string
          created_at?: string
          id?: string
          instructions?: string | null
          is_active?: boolean
          kind?: Database["public"]["Enums"]["address_kind"]
          line2?: string | null
          postal_code?: string | null
          recipient_name: string
          region?: string | null
          street: string
          updated_at?: string
          user_id: string
          warehouse?: string | null
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          id?: string
          instructions?: string | null
          is_active?: boolean
          kind?: Database["public"]["Enums"]["address_kind"]
          line2?: string | null
          postal_code?: string | null
          recipient_name?: string
          region?: string | null
          street?: string
          updated_at?: string
          user_id?: string
          warehouse?: string | null
        }
        Relationships: []
      }
      app_error_logs: {
        Row: {
          context: Json
          created_at: string
          id: string
          message: string
          source: string
          user_id: string | null
        }
        Insert: {
          context?: Json
          created_at?: string
          id?: string
          message: string
          source: string
          user_id?: string | null
        }
        Update: {
          context?: Json
          created_at?: string
          id?: string
          message?: string
          source?: string
          user_id?: string | null
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          company_name: string
          currencies: string | null
          delivery_instructions: string | null
          delivery_zones: string | null
          description: string | null
          email: string | null
          extra: Json
          facebook_url: string | null
          hq_address: string | null
          id: number
          instagram_url: string | null
          logo_url: string | null
          opening_hours: string | null
          payment_instructions: string | null
          phone: string | null
          pickup_address: string | null
          privacy: string | null
          refund_policy: string | null
          service_fee: number | null
          shipping_rate_per_lb: number | null
          slogan: string | null
          terms: string | null
          tiktok_url: string | null
          updated_at: string
          usd_to_htg: number | null
          whatsapp: string | null
        }
        Insert: {
          company_name?: string
          currencies?: string | null
          delivery_instructions?: string | null
          delivery_zones?: string | null
          description?: string | null
          email?: string | null
          extra?: Json
          facebook_url?: string | null
          hq_address?: string | null
          id?: number
          instagram_url?: string | null
          logo_url?: string | null
          opening_hours?: string | null
          payment_instructions?: string | null
          phone?: string | null
          pickup_address?: string | null
          privacy?: string | null
          refund_policy?: string | null
          service_fee?: number | null
          shipping_rate_per_lb?: number | null
          slogan?: string | null
          terms?: string | null
          tiktok_url?: string | null
          updated_at?: string
          usd_to_htg?: number | null
          whatsapp?: string | null
        }
        Update: {
          company_name?: string
          currencies?: string | null
          delivery_instructions?: string | null
          delivery_zones?: string | null
          description?: string | null
          email?: string | null
          extra?: Json
          facebook_url?: string | null
          hq_address?: string | null
          id?: number
          instagram_url?: string | null
          logo_url?: string | null
          opening_hours?: string | null
          payment_instructions?: string | null
          phone?: string | null
          pickup_address?: string | null
          privacy?: string | null
          refund_policy?: string | null
          service_fee?: number | null
          shipping_rate_per_lb?: number | null
          slogan?: string | null
          terms?: string | null
          tiktok_url?: string | null
          updated_at?: string
          usd_to_htg?: number | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      customer_carts: {
        Row: {
          items: Json
          last_reminded_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          items?: Json
          last_reminded_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          items?: Json
          last_reminded_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      package_events: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_internal: boolean
          note: string | null
          package_id: string
          status: Database["public"]["Enums"]["package_status"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_internal?: boolean
          note?: string | null
          package_id: string
          status: Database["public"]["Enums"]["package_status"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_internal?: boolean
          note?: string | null
          package_id?: string
          status?: Database["public"]["Enums"]["package_status"]
        }
        Relationships: [
          {
            foreignKeyName: "package_events_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          actual_weight_lb: number | null
          carrier_tracking: string | null
          category: string | null
          created_at: string
          created_by: string | null
          currency: string
          declared_value: number | null
          description: string
          destination: string | null
          dimensions: string | null
          estimated_weight_lb: number | null
          extra_fees: number | null
          id: string
          instructions: string | null
          internal_notes: string | null
          merchant: string
          merchant_order_number: string | null
          quantity: number
          received_at: string | null
          reception_address_id: string | null
          shipping_fee: number | null
          status: Database["public"]["Enums"]["package_status"]
          tracking_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_weight_lb?: number | null
          carrier_tracking?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          declared_value?: number | null
          description: string
          destination?: string | null
          dimensions?: string | null
          estimated_weight_lb?: number | null
          extra_fees?: number | null
          id?: string
          instructions?: string | null
          internal_notes?: string | null
          merchant: string
          merchant_order_number?: string | null
          quantity?: number
          received_at?: string | null
          reception_address_id?: string | null
          shipping_fee?: number | null
          status?: Database["public"]["Enums"]["package_status"]
          tracking_number?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_weight_lb?: number | null
          carrier_tracking?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          declared_value?: number | null
          description?: string
          destination?: string | null
          dimensions?: string | null
          estimated_weight_lb?: number | null
          extra_fees?: number | null
          id?: string
          instructions?: string | null
          internal_notes?: string | null
          merchant?: string
          merchant_order_number?: string | null
          quantity?: number
          received_at?: string | null
          reception_address_id?: string | null
          shipping_fee?: number | null
          status?: Database["public"]["Enums"]["package_status"]
          tracking_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "packages_reception_address_id_fkey"
            columns: ["reception_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          apply_tax: boolean
          category: string
          created_at: string
          custom_fields: Json
          delivery_options: string
          description: string
          extra: Json
          id: string
          is_active: boolean
          kind: string
          media_urls: string[]
          price_usd: number
          promo_price_usd: number | null
          requires_shipping_address: boolean
          short_description: string | null
          subcategory: string | null
          tax_rate_override: number | null
          title: string
          updated_at: string
          variants: Json
          video_url: string | null
        }
        Insert: {
          apply_tax?: boolean
          category?: string
          created_at?: string
          custom_fields?: Json
          delivery_options?: string
          description?: string
          extra?: Json
          id?: string
          is_active?: boolean
          kind?: string
          media_urls?: string[]
          price_usd?: number
          promo_price_usd?: number | null
          requires_shipping_address?: boolean
          short_description?: string | null
          subcategory?: string | null
          tax_rate_override?: number | null
          title: string
          updated_at?: string
          variants?: Json
          video_url?: string | null
        }
        Update: {
          apply_tax?: boolean
          category?: string
          created_at?: string
          custom_fields?: Json
          delivery_options?: string
          description?: string
          extra?: Json
          id?: string
          is_active?: boolean
          kind?: string
          media_urls?: string[]
          price_usd?: number
          promo_price_usd?: number | null
          requires_shipping_address?: boolean
          short_description?: string | null
          subcategory?: string | null
          tax_rate_override?: number | null
          title?: string
          updated_at?: string
          variants?: Json
          video_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address_line: string | null
          address_line2: string | null
          avatar_url: string | null
          city: string | null
          client_code: string
          country: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          region: string | null
          updated_at: string
        }
        Insert: {
          address_line?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          city?: string | null
          client_code?: string
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          phone?: string | null
          region?: string | null
          updated_at?: string
        }
        Update: {
          address_line?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          city?: string | null
          client_code?: string
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          region?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shop_orders: {
        Row: {
          admin_notes: string | null
          created_at: string
          custom_field_responses: Json
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_address: string | null
          id: string
          order_number: string
          payment_method: string
          payment_proof_url: string | null
          payment_reference: string | null
          product_id: string | null
          product_image_url: string | null
          product_kind: string | null
          product_rate_htg: number | null
          product_title: string
          quantity: number
          requested_amount_usd: number | null
          service_fee_usd: number
          site_rate_htg: number | null
          status: string
          subtotal_usd: number
          tax_amount_usd: number
          total_htg: number
          total_usd: number
          unit_price_usd: number
          updated_at: string
          user_id: string
          variant_id: string | null
          variant_name: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          custom_field_responses?: Json
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          id?: string
          order_number?: string
          payment_method: string
          payment_proof_url?: string | null
          payment_reference?: string | null
          product_id?: string | null
          product_image_url?: string | null
          product_kind?: string | null
          product_rate_htg?: number | null
          product_title: string
          quantity?: number
          requested_amount_usd?: number | null
          service_fee_usd?: number
          site_rate_htg?: number | null
          status?: string
          subtotal_usd?: number
          tax_amount_usd?: number
          total_htg?: number
          total_usd?: number
          unit_price_usd?: number
          updated_at?: string
          user_id: string
          variant_id?: string | null
          variant_name?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          custom_field_responses?: Json
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          id?: string
          order_number?: string
          payment_method?: string
          payment_proof_url?: string | null
          payment_reference?: string | null
          product_id?: string | null
          product_image_url?: string | null
          product_kind?: string | null
          product_rate_htg?: number | null
          product_title?: string
          quantity?: number
          requested_amount_usd?: number | null
          service_fee_usd?: number
          site_rate_htg?: number | null
          status?: string
          subtotal_usd?: number
          tax_amount_usd?: number
          total_htg?: number
          total_usd?: number
          unit_price_usd?: number
          updated_at?: string
          user_id?: string
          variant_id?: string | null
          variant_name?: string | null
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          sender: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sender?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sender?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount_htg: number
          amount_usd: number
          created_at: string
          created_by: string | null
          description: string
          id: string
          method: string
          order_id: string | null
          package_id: string | null
          proof_url: string | null
          reference: string | null
          status: string
          type: string
          user_id: string
          user_name: string | null
          wallet_id: string | null
        }
        Insert: {
          amount_htg?: number
          amount_usd: number
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          method?: string
          order_id?: string | null
          package_id?: string | null
          proof_url?: string | null
          reference?: string | null
          status?: string
          type: string
          user_id: string
          user_name?: string | null
          wallet_id?: string | null
        }
        Update: {
          amount_htg?: number
          amount_usd?: number
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          method?: string
          order_id?: string | null
          package_id?: string | null
          proof_url?: string | null
          reference?: string | null
          status?: string
          type?: string
          user_id?: string
          user_name?: string | null
          wallet_id?: string | null
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance_usd: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_usd?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_usd?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_staff_by_email: {
        Args: { _email: string; _role: Database["public"]["Enums"]["app_role"] }
        Returns: string
      }
      admin_adjust_wallet: {
        Args: { _amount_usd: number; _reason: string; _user_id: string }
        Returns: number
      }
      admin_setup_available: { Args: never; Returns: boolean }
      can_manage_packages: { Args: { _user_id: string }; Returns: boolean }
      claim_first_admin: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      place_shop_order: { Args: { _order: Json }; Returns: Json }
      request_wallet_topup: {
        Args: {
          _amount_htg: number
          _amount_usd: number
          _method: string
          _proof_url: string
          _reference: string
        }
        Returns: string
      }
      review_wallet_topup: {
        Args: { _approve: boolean; _tx_id: string }
        Returns: string
      }
      track_package: { Args: { _tracking: string }; Returns: Json }
    }
    Enums: {
      address_kind: "etranger" | "retrait" | "livraison"
      app_role:
        | "super_admin"
        | "admin"
        | "agent_colis"
        | "agent_finance"
        | "agent_support"
      package_status:
        | "declare"
        | "attente_reception"
        | "recu_entrepot"
        | "preparation"
        | "expedie"
        | "en_transit"
        | "arrive_haiti"
        | "douane"
        | "disponible_retrait"
        | "livraison_locale"
        | "livre"
        | "incident"
        | "retourne"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      address_kind: ["etranger", "retrait", "livraison"],
      app_role: [
        "super_admin",
        "admin",
        "agent_colis",
        "agent_finance",
        "agent_support",
      ],
      package_status: [
        "declare",
        "attente_reception",
        "recu_entrepot",
        "preparation",
        "expedie",
        "en_transit",
        "arrive_haiti",
        "douane",
        "disponible_retrait",
        "livraison_locale",
        "livre",
        "incident",
        "retourne",
      ],
    },
  },
} as const
