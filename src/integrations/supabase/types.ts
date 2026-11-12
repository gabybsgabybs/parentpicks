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
      admin_invites: {
        Row: {
          email: string
          neighborhood_id: string
        }
        Insert: {
          email: string
          neighborhood_id: string
        }
        Update: {
          email?: string
          neighborhood_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_invites_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      flags: {
        Row: {
          created_at: string
          id: string
          neighborhood_id: string
          note: string
          provider_id: string
          resolved: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          neighborhood_id: string
          note: string
          provider_id: string
          resolved?: boolean
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          neighborhood_id?: string
          note?: string
          provider_id?: string
          resolved?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flags_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flags_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      import_mentions: {
        Row: {
          mentioned_at: string | null
          n: number | null
          name: string | null
          paraphrase: string | null
          sentiment: string | null
        }
        Insert: {
          mentioned_at?: string | null
          n?: number | null
          name?: string | null
          paraphrase?: string | null
          sentiment?: string | null
        }
        Update: {
          mentioned_at?: string | null
          n?: number | null
          name?: string | null
          paraphrase?: string | null
          sentiment?: string | null
        }
        Relationships: []
      }
      import_providers: {
        Row: {
          address: string | null
          booking_url: string | null
          category: string | null
          first_mention: string | null
          last_mention: string | null
          location: string | null
          name: string | null
          negative: number | null
          parent_count: number | null
          phone: string | null
          positive: number | null
          summary: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          booking_url?: string | null
          category?: string | null
          first_mention?: string | null
          last_mention?: string | null
          location?: string | null
          name?: string | null
          negative?: number | null
          parent_count?: number | null
          phone?: string | null
          positive?: number | null
          summary?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          booking_url?: string | null
          category?: string | null
          first_mention?: string | null
          last_mention?: string | null
          location?: string | null
          name?: string | null
          negative?: number | null
          parent_count?: number | null
          phone?: string | null
          positive?: number | null
          summary?: string | null
          website?: string | null
        }
        Relationships: []
      }
      match_suggestions: {
        Row: {
          created_at: string
          id: string
          neighborhood_id: string
          provider_a: string
          provider_b: string
          reason: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          neighborhood_id: string
          provider_a: string
          provider_b: string
          reason?: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          neighborhood_id?: string
          provider_a?: string
          provider_b?: string
          reason?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_suggestions_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_suggestions_provider_a_fkey"
            columns: ["provider_a"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_suggestions_provider_b_fkey"
            columns: ["provider_b"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          email: string | null
          id: string
          neighborhood_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          neighborhood_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          neighborhood_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      mentions: {
        Row: {
          category: string
          created_at: string
          id: string
          location: string | null
          mentioned_at: string
          neighborhood_id: string
          paraphrase: string
          provider_id: string | null
          raw_name: string
          self_promo: boolean
          sender_hash: string
          sentiment: string
          upload_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          location?: string | null
          mentioned_at: string
          neighborhood_id: string
          paraphrase: string
          provider_id?: string | null
          raw_name: string
          self_promo?: boolean
          sender_hash: string
          sentiment: string
          upload_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          location?: string | null
          mentioned_at?: string
          neighborhood_id?: string
          paraphrase?: string
          provider_id?: string | null
          raw_name?: string
          self_promo?: boolean
          sender_hash?: string
          sentiment?: string
          upload_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentions_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentions_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      neighborhoods: {
        Row: {
          created_at: string
          id: string
          invite_code: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_code?: string
          name?: string
        }
        Relationships: []
      }
      providers: {
        Row: {
          address: string | null
          aliases: string[]
          booking_url: string | null
          category: string
          contact_checked_at: string | null
          contact_unverified: boolean
          created_at: string
          first_mention: string | null
          id: string
          last_mention: string | null
          location: string | null
          mixed: number
          name: string
          negative: number
          neighborhood_id: string
          parent_count: number
          phone: string | null
          positive: number
          self_promo_flag: boolean
          status: string
          summary: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          aliases?: string[]
          booking_url?: string | null
          category?: string
          contact_checked_at?: string | null
          contact_unverified?: boolean
          created_at?: string
          first_mention?: string | null
          id?: string
          last_mention?: string | null
          location?: string | null
          mixed?: number
          name: string
          negative?: number
          neighborhood_id: string
          parent_count?: number
          phone?: string | null
          positive?: number
          self_promo_flag?: boolean
          status?: string
          summary?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          aliases?: string[]
          booking_url?: string | null
          category?: string
          contact_checked_at?: string | null
          contact_unverified?: boolean
          created_at?: string
          first_mention?: string | null
          id?: string
          last_mention?: string | null
          location?: string | null
          mixed?: number
          name?: string
          negative?: number
          neighborhood_id?: string
          parent_count?: number
          phone?: string | null
          positive?: number
          self_promo_flag?: boolean
          status?: string
          summary?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "providers_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      uploads: {
        Row: {
          created_at: string
          id: string
          messages_read: number
          neighborhood_id: string
          recommendations_found: number
          status: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages_read?: number
          neighborhood_id: string
          recommendations_found?: number
          status?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          id?: string
          messages_read?: number
          neighborhood_id?: string
          recommendations_found?: number
          status?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploads_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      village_chat: {
        Row: {
          content: string
          created_at: string
          id: string
          neighborhood_id: string
          place_ids: string[]
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          neighborhood_id: string
          place_ids?: string[]
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          neighborhood_id?: string
          place_ids?: string[]
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_manage_review: {
        Args: {
          _action: string
          _mention: string
          _neighborhood: string
          _paraphrase?: string
          _provider: string
          _sentiment?: string
        }
        Returns: undefined
      }
      is_admin: { Args: { _nb: string }; Returns: boolean }
      is_member: { Args: { _nb: string }; Returns: boolean }
      join_with_code: { Args: { _code: string }; Returns: string }
      recompute_provider: { Args: { _p: string }; Returns: undefined }
      rotate_invite_code: { Args: { _nb: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
