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
      businesses: {
        Row: {
          address: string | null
          business_type: string | null
          created_at: string
          id: string
          lat: number
          lng: number
          name: string
          osm_id: number | null
          town: string
        }
        Insert: {
          address?: string | null
          business_type?: string | null
          created_at?: string
          id?: string
          lat: number
          lng: number
          name: string
          osm_id?: number | null
          town: string
        }
        Update: {
          address?: string | null
          business_type?: string | null
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          name?: string
          osm_id?: number | null
          town?: string
        }
        Relationships: []
      }
      merge_suggestions: {
        Row: {
          created_at: string
          decided_at: string | null
          id: string
          proposed_body: string | null
          proposed_category: Database["public"]["Enums"]["request_category"]
          proposed_title: string
          status: string
          suggester_id: string
          target_request_id: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          id?: string
          proposed_body?: string | null
          proposed_category: Database["public"]["Enums"]["request_category"]
          proposed_title: string
          status?: string
          suggester_id: string
          target_request_id: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          id?: string
          proposed_body?: string | null
          proposed_category?: Database["public"]["Enums"]["request_category"]
          proposed_title?: string
          status?: string
          suggester_id?: string
          target_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "merge_suggestions_target_request_id_fkey"
            columns: ["target_request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      request_categories: {
        Row: {
          color: string
          created_at: string
          icon_name: string
          id: string
          is_active: boolean
          label: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color: string
          created_at?: string
          icon_name: string
          id?: string
          is_active?: boolean
          label: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          icon_name?: string
          id?: string
          is_active?: boolean
          label?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      request_category_fields: {
        Row: {
          category_id: string
          created_at: string
          field_type: string
          help_text: string | null
          id: string
          is_active: boolean
          key: string
          label: string
          options: Json | null
          placeholder: string | null
          required: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          field_type: string
          help_text?: string | null
          id?: string
          is_active?: boolean
          key: string
          label: string
          options?: Json | null
          placeholder?: string | null
          required?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          field_type?: string
          help_text?: string | null
          id?: string
          is_active?: boolean
          key?: string
          label?: string
          options?: Json | null
          placeholder?: string | null
          required?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_category_fields_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "request_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      request_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          kind: string
          request_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          kind?: string
          request_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          request_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_comments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_cosigners: {
        Row: {
          created_at: string
          id: string
          note: string | null
          request_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          request_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          request_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_cosigners_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          brand_name: string | null
          brand_website: string | null
          business_id: string | null
          business_kind: string | null
          business_type_slug: string | null
          category: Database["public"]["Enums"]["request_category"]
          cosigner_count: number
          created_at: string
          description: string | null
          field_values: Json
          id: string
          id_short: string | null
          lat: number
          lng: number
          radius_m: number | null
          share_count: number
          slug: string | null
          status: string
          title: string
          town: string
          updated_at: string
          upvote_count: number
          user_id: string
          view_count: number
        }
        Insert: {
          brand_name?: string | null
          brand_website?: string | null
          business_id?: string | null
          business_kind?: string | null
          business_type_slug?: string | null
          category: Database["public"]["Enums"]["request_category"]
          cosigner_count?: number
          created_at?: string
          description?: string | null
          field_values?: Json
          id?: string
          id_short?: string | null
          lat: number
          lng: number
          radius_m?: number | null
          share_count?: number
          slug?: string | null
          status?: string
          title: string
          town: string
          updated_at?: string
          upvote_count?: number
          user_id: string
          view_count?: number
        }
        Update: {
          brand_name?: string | null
          brand_website?: string | null
          business_id?: string | null
          business_kind?: string | null
          business_type_slug?: string | null
          category?: Database["public"]["Enums"]["request_category"]
          cosigner_count?: number
          created_at?: string
          description?: string | null
          field_values?: Json
          id?: string
          id_short?: string | null
          lat?: number
          lng?: number
          radius_m?: number | null
          share_count?: number
          slug?: string | null
          status?: string
          title?: string
          town?: string
          updated_at?: string
          upvote_count?: number
          user_id?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      upvotes: {
        Row: {
          created_at: string
          id: string
          request_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          request_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          request_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "upvotes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_merge_suggestion: { Args: { _id: string }; Returns: undefined }
      find_similar_requests: {
        Args: {
          _category: Database["public"]["Enums"]["request_category"]
          _lat: number
          _limit?: number
          _lng: number
          _text: string
        }
        Returns: {
          category: Database["public"]["Enums"]["request_category"]
          cosigner_count: number
          description: string
          distance_km: number
          id: string
          lat: number
          lng: number
          score: number
          slug: string
          title: string
          town: string
          trgm_score: number
          upvote_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_request_share: {
        Args: { _request_id: string }
        Returns: undefined
      }
      increment_request_view: {
        Args: { _request_id: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      slugify: { Args: { input: string }; Returns: string }
    }
    Enums: {
      app_role: "user" | "business" | "authority" | "admin"
      request_category:
        | "opening_hours"
        | "new_branch"
        | "classes_sessions"
        | "artist_visit"
        | "announcement"
        | "nature_outdoors"
        | "culture_art"
        | "community_service"
        | "wild_idea"
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
      app_role: ["user", "business", "authority", "admin"],
      request_category: [
        "opening_hours",
        "new_branch",
        "classes_sessions",
        "artist_visit",
        "announcement",
        "nature_outdoors",
        "culture_art",
        "community_service",
        "wild_idea",
      ],
    },
  },
} as const
