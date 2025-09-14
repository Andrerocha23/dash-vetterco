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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          alerta_saldo_baixo: number | null
          ativar_campanhas_meta: boolean | null
          budget_mensal_global: number | null
          budget_mensal_google: number | null
          budget_mensal_meta: number | null
          canais: string[]
          canal_relatorio: string | null
          centro_custo: string | null
          contrato_inicio: string | null
          contrato_renovacao: string | null
          conversoes: string[] | null
          created_at: string
          email: string | null
          forma_pagamento: string | null
          ga4_stream_id: string | null
          gestor_id: string
          google_ads_id: string | null
          gtm_id: string | null
          horario_relatorio: string | null
          id: string
          id_grupo: string | null
          link_drive: string | null
          link_google: string | null
          link_meta: string | null
          meta_account_id: string | null
          meta_business_id: string | null
          meta_page_id: string | null
          modo_saldo_meta: string | null
          monitorar_saldo_meta: boolean | null
          nome_cliente: string
          nome_empresa: string
          notificacao_erro_sync: boolean | null
          notificacao_leads_diarios: boolean | null
          notificacao_saldo_baixo: boolean | null
          observacoes: string | null
          ocultar_ranking: boolean | null
          papel_padrao: string | null
          pixel_meta: string | null
          saldo_meta: number | null
          somar_metricas: boolean | null
          status: string
          telefone: string
          templates_padrao: string[] | null
          traqueamento_ativo: boolean | null
          typebot_ativo: boolean | null
          typebot_url: string | null
          updated_at: string
          url_crm: string | null
          usa_crm_externo: boolean | null
          usa_google_ads: boolean | null
          usa_meta_ads: boolean | null
          user_id: string
          usuarios_vinculados: string[] | null
          utm_padrao: string | null
          webhook_google: string | null
          webhook_meta: string | null
        }
        Insert: {
          alerta_saldo_baixo?: number | null
          ativar_campanhas_meta?: boolean | null
          budget_mensal_global?: number | null
          budget_mensal_google?: number | null
          budget_mensal_meta?: number | null
          canais?: string[]
          canal_relatorio?: string | null
          centro_custo?: string | null
          contrato_inicio?: string | null
          contrato_renovacao?: string | null
          conversoes?: string[] | null
          created_at?: string
          email?: string | null
          forma_pagamento?: string | null
          ga4_stream_id?: string | null
          gestor_id: string
          google_ads_id?: string | null
          gtm_id?: string | null
          horario_relatorio?: string | null
          id?: string
          id_grupo?: string | null
          link_drive?: string | null
          link_google?: string | null
          link_meta?: string | null
          meta_account_id?: string | null
          meta_business_id?: string | null
          meta_page_id?: string | null
          modo_saldo_meta?: string | null
          monitorar_saldo_meta?: boolean | null
          nome_cliente: string
          nome_empresa: string
          notificacao_erro_sync?: boolean | null
          notificacao_leads_diarios?: boolean | null
          notificacao_saldo_baixo?: boolean | null
          observacoes?: string | null
          ocultar_ranking?: boolean | null
          papel_padrao?: string | null
          pixel_meta?: string | null
          saldo_meta?: number | null
          somar_metricas?: boolean | null
          status?: string
          telefone: string
          templates_padrao?: string[] | null
          traqueamento_ativo?: boolean | null
          typebot_ativo?: boolean | null
          typebot_url?: string | null
          updated_at?: string
          url_crm?: string | null
          usa_crm_externo?: boolean | null
          usa_google_ads?: boolean | null
          usa_meta_ads?: boolean | null
          user_id?: string
          usuarios_vinculados?: string[] | null
          utm_padrao?: string | null
          webhook_google?: string | null
          webhook_meta?: string | null
        }
        Update: {
          alerta_saldo_baixo?: number | null
          ativar_campanhas_meta?: boolean | null
          budget_mensal_global?: number | null
          budget_mensal_google?: number | null
          budget_mensal_meta?: number | null
          canais?: string[]
          canal_relatorio?: string | null
          centro_custo?: string | null
          contrato_inicio?: string | null
          contrato_renovacao?: string | null
          conversoes?: string[] | null
          created_at?: string
          email?: string | null
          forma_pagamento?: string | null
          ga4_stream_id?: string | null
          gestor_id?: string
          google_ads_id?: string | null
          gtm_id?: string | null
          horario_relatorio?: string | null
          id?: string
          id_grupo?: string | null
          link_drive?: string | null
          link_google?: string | null
          link_meta?: string | null
          meta_account_id?: string | null
          meta_business_id?: string | null
          meta_page_id?: string | null
          modo_saldo_meta?: string | null
          monitorar_saldo_meta?: boolean | null
          nome_cliente?: string
          nome_empresa?: string
          notificacao_erro_sync?: boolean | null
          notificacao_leads_diarios?: boolean | null
          notificacao_saldo_baixo?: boolean | null
          observacoes?: string | null
          ocultar_ranking?: boolean | null
          papel_padrao?: string | null
          pixel_meta?: string | null
          saldo_meta?: number | null
          somar_metricas?: boolean | null
          status?: string
          telefone?: string
          templates_padrao?: string[] | null
          traqueamento_ativo?: boolean | null
          typebot_ativo?: boolean | null
          typebot_url?: string | null
          updated_at?: string
          url_crm?: string | null
          usa_crm_externo?: boolean | null
          usa_google_ads?: boolean | null
          usa_meta_ads?: boolean | null
          user_id?: string
          usuarios_vinculados?: string[] | null
          utm_padrao?: string | null
          webhook_google?: string | null
          webhook_meta?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
    Enums: {},
  },
} as const
