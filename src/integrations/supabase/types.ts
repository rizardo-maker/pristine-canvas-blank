export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      areas: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          areaid: string | null
          createdat: string | null
          id: string
          id_proof_url: string | null
          installmentamount: number | null
          isfullypaid: boolean | null
          mobile: string | null
          name: string
          numberofdays: number
          rateofinterest: number
          totalamountgiven: number
          totalamounttobepaid: number
          user_id: string
        }
        Insert: {
          address?: string | null
          areaid?: string | null
          createdat?: string | null
          id?: string
          id_proof_url?: string | null
          installmentamount?: number | null
          isfullypaid?: boolean | null
          mobile?: string | null
          name: string
          numberofdays: number
          rateofinterest: number
          totalamountgiven: number
          totalamounttobepaid: number
          user_id: string
        }
        Update: {
          address?: string | null
          areaid?: string | null
          createdat?: string | null
          id?: string
          id_proof_url?: string | null
          installmentamount?: number | null
          isfullypaid?: boolean | null
          mobile?: string | null
          name?: string
          numberofdays?: number
          rateofinterest?: number
          totalamountgiven?: number
          totalamounttobepaid?: number
          user_id?: string
        }
        Relationships: []
      }
      device_settings: {
        Row: {
          auto_sync: boolean | null
          created_at: string
          device_id: string
          id: string
          sync_frequency: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_sync?: boolean | null
          created_at?: string
          device_id: string
          id?: string
          sync_frequency?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_sync?: boolean | null
          created_at?: string
          device_id?: string
          id?: string
          sync_frequency?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          agent_name: string | null
          amount: number
          area_id: string | null
          collection_type: string
          created_at: string
          customer_id: string
          customer_name: string
          date: string
          id: string
          serial_number: string
          sync_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_name?: string | null
          amount: number
          area_id?: string | null
          collection_type: string
          created_at?: string
          customer_id: string
          customer_name: string
          date?: string
          id?: string
          serial_number: string
          sync_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_name?: string | null
          amount?: number
          area_id?: string | null
          collection_type?: string
          created_at?: string
          customer_id?: string
          customer_name?: string
          date?: string
          id?: string
          serial_number?: string
          sync_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          created_at: string
          details: Json | null
          device_id: string
          id: string
          status: string
          sync_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          device_id: string
          id?: string
          status: string
          sync_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          device_id?: string
          id?: string
          status?: string
          sync_type?: string
          user_id?: string
        }
        Relationships: []
      }
      sync_metadata: {
        Row: {
          conflict_resolution_strategy: string | null
          device_id: string | null
          last_sync_status: string | null
          last_synced: string | null
          sync_version: number | null
          user_id: string
        }
        Insert: {
          conflict_resolution_strategy?: string | null
          device_id?: string | null
          last_sync_status?: string | null
          last_synced?: string | null
          sync_version?: number | null
          user_id: string
        }
        Update: {
          conflict_resolution_strategy?: string | null
          device_id?: string | null
          last_sync_status?: string | null
          last_synced?: string | null
          sync_version?: number | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_upsert_sync_metadata_function: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      resolve_sync_conflict: {
        Args: {
          p_table_name: string
          p_local_data: Json
          p_server_data: Json
          p_strategy?: string
        }
        Returns: Json
      }
      upsert_sync_metadata: {
        Args: { p_user_id: string; p_last_synced: string; p_device_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
