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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          id: string
          payload: Json | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          id?: string
          payload?: Json | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          id?: string
          payload?: Json | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      api_config: {
        Row: {
          id: string
          key_name: string
          key_value: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          key_name: string
          key_value: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          key_name?: string
          key_value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean
          is_approved: boolean
          message: string
          name: string
          parent_id: string | null
          rating: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin?: boolean
          is_approved?: boolean
          message: string
          name?: string
          parent_id?: string | null
          rating?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean
          is_approved?: boolean
          message?: string
          name?: string
          parent_id?: string | null
          rating?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_html: string
          id: string
          subject: string
          template_key: string
          updated_at: string | null
        }
        Insert: {
          body_html: string
          id?: string
          subject: string
          template_key: string
          updated_at?: string | null
        }
        Update: {
          body_html?: string
          id?: string
          subject?: string
          template_key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_reads: {
        Row: {
          id: string
          notification_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          notification_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          notification_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          created_by: string
          id: string
          message: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          message: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          message?: string
          title?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          completed_at: string | null
          created_at: string
          credits: number
          id: string
          master_email: string | null
          order_id_lovable: string | null
          order_type: string
          price: number
          status: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          credits: number
          id?: string
          master_email?: string | null
          order_id_lovable?: string | null
          order_type?: string
          price: number
          status?: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          credits?: number
          id?: string
          master_email?: string | null
          order_id_lovable?: string | null
          order_type?: string
          price?: number
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          mercadopago_payment_id: string | null
          order_id: string
          status: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          mercadopago_payment_id?: string | null
          order_id: string
          status?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          mercadopago_payment_id?: string | null
          order_id?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_cache: {
        Row: {
          id: string
          prices: Json
          updated_at: string
        }
        Insert: {
          id?: string
          prices?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          prices?: Json
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          price: number
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price: number
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_banned: boolean
          updated_at: string
          wallet_balance: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_banned?: boolean
          updated_at?: string
          wallet_balance?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_banned?: boolean
          updated_at?: string
          wallet_balance?: number
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          attempted_at: string
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          attempted_at?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          attempted_at?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      refund_requests: {
        Row: {
          amount: number
          created_at: string
          id: string
          mercadopago_payment_id: string | null
          order_id: string
          reason: string | null
          refund_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          mercadopago_payment_id?: string | null
          order_id: string
          reason?: string | null
          refund_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          mercadopago_payment_id?: string | null
          order_id?: string
          reason?: string | null
          refund_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refund_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      reseller_links: {
        Row: {
          client_name: string | null
          client_phone: string | null
          conversions: number
          cost: number
          created_at: string
          id: string
          is_active: boolean
          margin_mode: string
          pack: number
          profit: number
          reseller_id: string
          sale_price: number
          slug: string
          updated_at: string
          views: number
        }
        Insert: {
          client_name?: string | null
          client_phone?: string | null
          conversions?: number
          cost?: number
          created_at?: string
          id?: string
          is_active?: boolean
          margin_mode?: string
          pack: number
          profit?: number
          reseller_id: string
          sale_price?: number
          slug: string
          updated_at?: string
          views?: number
        }
        Update: {
          client_name?: string | null
          client_phone?: string | null
          conversions?: number
          cost?: number
          created_at?: string
          id?: string
          is_active?: boolean
          margin_mode?: string
          pack?: number
          profit?: number
          reseller_id?: string
          sale_price?: number
          slug?: string
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "reseller_links_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
      }
      reseller_orders: {
        Row: {
          api_order_id: string | null
          client_email: string | null
          client_whatsapp: string | null
          completed_at: string | null
          cost: number
          created_at: string
          credits: number
          delivery_logs: Json
          delivery_started_at: string | null
          expires_at: string | null
          final_price: number
          id: string
          profit: number
          public_token: string
          refunded: boolean
          reseller_id: string
          reseller_link_id: string | null
          status: string
          tutorial_viewed_at: string | null
          updated_at: string
        }
        Insert: {
          api_order_id?: string | null
          client_email?: string | null
          client_whatsapp?: string | null
          completed_at?: string | null
          cost?: number
          created_at?: string
          credits: number
          delivery_logs?: Json
          delivery_started_at?: string | null
          expires_at?: string | null
          final_price: number
          id?: string
          profit?: number
          public_token: string
          refunded?: boolean
          reseller_id: string
          reseller_link_id?: string | null
          status?: string
          tutorial_viewed_at?: string | null
          updated_at?: string
        }
        Update: {
          api_order_id?: string | null
          client_email?: string | null
          client_whatsapp?: string | null
          completed_at?: string | null
          cost?: number
          created_at?: string
          credits?: number
          delivery_logs?: Json
          delivery_started_at?: string | null
          expires_at?: string | null
          final_price?: number
          id?: string
          profit?: number
          public_token?: string
          refunded?: boolean
          reseller_id?: string
          reseller_link_id?: string | null
          status?: string
          tutorial_viewed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reseller_orders_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reseller_orders_reseller_link_id_fkey"
            columns: ["reseller_link_id"]
            isOneToOne: false
            referencedRelation: "reseller_links"
            referencedColumns: ["id"]
          },
        ]
      }
      reseller_referrals: {
        Row: {
          clicked_at: string
          converted: boolean
          created_at: string
          id: string
          order_id: string | null
          pack: number
          reseller_id: string
          source: string | null
        }
        Insert: {
          clicked_at?: string
          converted?: boolean
          created_at?: string
          id?: string
          order_id?: string | null
          pack?: number
          reseller_id: string
          source?: string | null
        }
        Update: {
          clicked_at?: string
          converted?: boolean
          created_at?: string
          id?: string
          order_id?: string | null
          pack?: number
          reseller_id?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reseller_referrals_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reseller_referrals_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
      }
      resellers: {
        Row: {
          created_at: string | null
          id: string
          margin_pct: number | null
          slug: string | null
          status: string
          store_name: string | null
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          margin_pct?: number | null
          slug?: string | null
          status?: string
          store_name?: string | null
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          margin_pct?: number | null
          slug?: string | null
          status?: string
          store_name?: string | null
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      seo_clusters: {
        Row: {
          created_at: string
          description: string | null
          hub_page_id: string | null
          id: string
          keyword: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          hub_page_id?: string | null
          id?: string
          keyword?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          hub_page_id?: string | null
          id?: string
          keyword?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_clusters_hub_page_id_fkey"
            columns: ["hub_page_id"]
            isOneToOne: false
            referencedRelation: "seo_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_opportunities: {
        Row: {
          action: string
          cluster_id: string | null
          cluster_suggestion: string | null
          created_at: string
          id: string
          intent_type: string
          keyword: string
          opportunity_score: number
          reason: string | null
          resolved_page_id: string | null
          risk_score: number
          similar_pages: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          action?: string
          cluster_id?: string | null
          cluster_suggestion?: string | null
          created_at?: string
          id?: string
          intent_type?: string
          keyword: string
          opportunity_score?: number
          reason?: string | null
          resolved_page_id?: string | null
          risk_score?: number
          similar_pages?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          action?: string
          cluster_id?: string | null
          cluster_suggestion?: string | null
          created_at?: string
          id?: string
          intent_type?: string
          keyword?: string
          opportunity_score?: number
          reason?: string | null
          resolved_page_id?: string | null
          risk_score?: number
          similar_pages?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_opportunities_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "seo_clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_opportunities_resolved_page_id_fkey"
            columns: ["resolved_page_id"]
            isOneToOne: false
            referencedRelation: "seo_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_optimizations: {
        Row: {
          applied_at: string | null
          created_at: string
          current_value: string | null
          id: string
          optimization_type: string
          page_id: string
          reason: string | null
          status: string
          suggested_value: string | null
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          current_value?: string | null
          id?: string
          optimization_type: string
          page_id: string
          reason?: string | null
          status?: string
          suggested_value?: string | null
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          current_value?: string | null
          id?: string
          optimization_type?: string
          page_id?: string
          reason?: string | null
          status?: string
          suggested_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_optimizations_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "seo_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_page_metrics: {
        Row: {
          avg_position: number | null
          classification: string | null
          clicks: number | null
          created_at: string
          ctr: number | null
          id: string
          impressions: number | null
          notes: string | null
          page_id: string
          snapshot_day: number
        }
        Insert: {
          avg_position?: number | null
          classification?: string | null
          clicks?: number | null
          created_at?: string
          ctr?: number | null
          id?: string
          impressions?: number | null
          notes?: string | null
          page_id: string
          snapshot_day?: number
        }
        Update: {
          avg_position?: number | null
          classification?: string | null
          clicks?: number | null
          created_at?: string
          ctr?: number | null
          id?: string
          impressions?: number | null
          notes?: string | null
          page_id?: string
          snapshot_day?: number
        }
        Relationships: [
          {
            foreignKeyName: "seo_page_metrics_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "seo_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_pages: {
        Row: {
          cluster_id: string | null
          content_json: Json
          created_at: string
          h1: string
          id: string
          intent_type: string | null
          internal_links_json: Json | null
          is_published: boolean
          keyword: string
          meta_description: string
          opportunity_score: number | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          cluster_id?: string | null
          content_json?: Json
          created_at?: string
          h1: string
          id?: string
          intent_type?: string | null
          internal_links_json?: Json | null
          is_published?: boolean
          keyword: string
          meta_description: string
          opportunity_score?: number | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          cluster_id?: string | null
          content_json?: Json
          created_at?: string
          h1?: string
          id?: string
          intent_type?: string | null
          internal_links_json?: Json | null
          is_published?: boolean
          keyword?: string
          meta_description?: string
          opportunity_score?: number | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_pages_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "seo_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      simulator_intents: {
        Row: {
          created_at: string
          description: string | null
          emoji: string | null
          id: string
          is_active: boolean
          label: string
          sort_order: number
          suggested_credits: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number
          suggested_credits: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
          suggested_credits?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          order_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string
          id?: string
          order_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          order_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_rate_limits: { Args: never; Returns: undefined }
      credit_wallet: {
        Args: {
          _amount: number
          _description: string
          _order_id?: string
          _user_id: string
        }
        Returns: boolean
      }
      debit_wallet: {
        Args: {
          _amount: number
          _description: string
          _order_id?: string
          _user_id: string
        }
        Returns: boolean
      }
      get_completed_orders_count: { Args: never; Returns: number }
      get_credits_delivered_24h: { Args: never; Returns: number }
      get_public_link_info: {
        Args: { _reseller_id: string; _slug: string }
        Returns: {
          id: string
          is_active: boolean
          pack: number
          reseller_id: string
          sale_price: number
        }[]
      }
      get_public_reseller_info: {
        Args: { _slug: string }
        Returns: {
          id: string
          slug: string
          status: string
          store_name: string
        }[]
      }
      get_recent_purchase_name: { Args: { _user_id: string }; Returns: string }
      get_recent_purchases: {
        Args: { _limit?: number }
        Returns: {
          credits: number
          first_name: string
          minutes_ago: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_link_views: { Args: { _link_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
