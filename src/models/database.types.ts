export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      betalingen: {
        Row: {
          aangemaakt_op: string
          bedrag: number
          betaler_contact_id: string | null
          betaler_gebruiker_id: string | null
          datum: string
          id: string
          ontvanger_id: string
          status: string
        }
        Insert: {
          aangemaakt_op?: string
          bedrag: number
          betaler_contact_id?: string | null
          betaler_gebruiker_id?: string | null
          datum?: string
          id?: string
          ontvanger_id: string
          status?: string
        }
        Update: {
          aangemaakt_op?: string
          bedrag?: number
          betaler_contact_id?: string | null
          betaler_gebruiker_id?: string | null
          datum?: string
          id?: string
          ontvanger_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: 'betalingen_betaler_contact_id_fkey'
            columns: ['betaler_contact_id']
            isOneToOne: false
            referencedRelation: 'lokale_contacten'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'betalingen_betaler_gebruiker_id_fkey'
            columns: ['betaler_gebruiker_id']
            isOneToOne: false
            referencedRelation: 'gebruikers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'betalingen_ontvanger_id_fkey'
            columns: ['ontvanger_id']
            isOneToOne: false
            referencedRelation: 'gebruikers'
            referencedColumns: ['id']
          },
        ]
      }
      gebruikers: {
        Row: {
          aangemaakt_op: string
          email: string | null
          id: string
          naam: string | null
        }
        Insert: {
          aangemaakt_op?: string
          email?: string | null
          id: string
          naam?: string | null
        }
        Update: {
          aangemaakt_op?: string
          email?: string | null
          id?: string
          naam?: string | null
        }
        Relationships: []
      }
      lokale_contacten: {
        Row: {
          aangemaakt_op: string
          eigenaar_id: string
          gekoppeld_gebruiker_id: string | null
          id: string
          naam: string
        }
        Insert: {
          aangemaakt_op?: string
          eigenaar_id: string
          gekoppeld_gebruiker_id?: string | null
          id?: string
          naam: string
        }
        Update: {
          aangemaakt_op?: string
          eigenaar_id?: string
          gekoppeld_gebruiker_id?: string | null
          id?: string
          naam?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lokale_contacten_eigenaar_id_fkey'
            columns: ['eigenaar_id']
            isOneToOne: false
            referencedRelation: 'gebruikers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lokale_contacten_gekoppeld_gebruiker_id_fkey'
            columns: ['gekoppeld_gebruiker_id']
            isOneToOne: false
            referencedRelation: 'gebruikers'
            referencedColumns: ['id']
          },
        ]
      }
      schuldposten: {
        Row: {
          aangemaakt_op: string
          bedrag: number
          datum: string
          gedekt_bedrag: number
          heropend: boolean
          heropening_uitleg: string | null
          id: string
          omschrijving: string | null
          schuldeiser_id: string
          schuldenaar_contact_id: string | null
          schuldenaar_gebruiker_id: string | null
          status: string
        }
        Insert: {
          aangemaakt_op?: string
          bedrag: number
          datum?: string
          gedekt_bedrag?: number
          heropend?: boolean
          heropening_uitleg?: string | null
          id?: string
          omschrijving?: string | null
          schuldeiser_id: string
          schuldenaar_contact_id?: string | null
          schuldenaar_gebruiker_id?: string | null
          status?: string
        }
        Update: {
          aangemaakt_op?: string
          bedrag?: number
          datum?: string
          gedekt_bedrag?: number
          heropend?: boolean
          heropening_uitleg?: string | null
          id?: string
          omschrijving?: string | null
          schuldeiser_id?: string
          schuldenaar_contact_id?: string | null
          schuldenaar_gebruiker_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: 'schuldposten_schuldeiser_id_fkey'
            columns: ['schuldeiser_id']
            isOneToOne: false
            referencedRelation: 'gebruikers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'schuldposten_schuldenaar_contact_id_fkey'
            columns: ['schuldenaar_contact_id']
            isOneToOne: false
            referencedRelation: 'lokale_contacten'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'schuldposten_schuldenaar_gebruiker_id_fkey'
            columns: ['schuldenaar_gebruiker_id']
            isOneToOne: false
            referencedRelation: 'gebruikers'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
