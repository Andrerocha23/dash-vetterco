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
      campaign_leads_daily: {
        Row: {
          campaign_id: string
          campaign_name: string
          clicks: number | null
          client_id: string
          client_notes: string | null
          converted_leads: number | null
          cpc: number | null
          cpm: number | null
          created_at: string
          ctr: number | null
          date: string
          disqualified_leads: number | null
          feedback_status: string | null
          id: string
          impressions: number | null
          kanban_status: string | null
          leads_count: number
          no_response_leads: number | null
          platform: string
          qualified_leads: number | null
          quality_score: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          scheduled_leads: number | null
          spend: number | null
          updated_at: string
        }
        Insert: {
          campaign_id: string
          campaign_name: string
          clicks?: number | null
          client_id: string
          client_notes?: string | null
          converted_leads?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string
          ctr?: number | null
          date: string
          disqualified_leads?: number | null
          feedback_status?: string | null
          id?: string
          impressions?: number | null
          kanban_status?: string | null
          leads_count?: number
          no_response_leads?: number | null
          platform: string
          qualified_leads?: number | null
          quality_score?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheduled_leads?: number | null
          spend?: number | null
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          campaign_name?: string
          clicks?: number | null
          client_id?: string
          client_notes?: string | null
          converted_leads?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string
          ctr?: number | null
          date?: string
          disqualified_leads?: number | null
          feedback_status?: string | null
          id?: string
          impressions?: number | null
          kanban_status?: string | null
          leads_count?: number
          no_response_leads?: number | null
          platform?: string
          qualified_leads?: number | null
          quality_score?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheduled_leads?: number | null
          spend?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_leads_daily_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance_stats"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "campaign_leads_daily_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_leads_daily_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "leads_stats"
            referencedColumns: ["client_id"]
          },
        ]
      }
      client_accounts: {
        Row: {
          account_id: string
          client_id: string
          created_at: string
          id: string
          observacoes: string | null
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          account_id: string
          client_id: string
          created_at?: string
          id?: string
          observacoes?: string | null
          status?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          client_id?: string
          created_at?: string
          id?: string
          observacoes?: string | null
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance_stats"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "leads_stats"
            referencedColumns: ["client_id"]
          },
        ]
      }
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
      leads: {
        Row: {
          campanha: string | null
          client_id: string
          created_at: string
          data_conversao: string | null
          email: string | null
          id: string
          interesse: string | null
          ip_address: unknown | null
          landing_page: string | null
          nome: string
          nota_qualificacao: number | null
          observacoes: string | null
          orcamento_max: number | null
          orcamento_min: number | null
          origem: string
          prazo: string | null
          proxima_acao: string | null
          qualificacao: string | null
          referrer: string | null
          responsavel_id: string | null
          status: string
          telefone: string | null
          ultima_interacao: string | null
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          valor_conversao: number | null
        }
        Insert: {
          campanha?: string | null
          client_id: string
          created_at?: string
          data_conversao?: string | null
          email?: string | null
          id?: string
          interesse?: string | null
          ip_address?: unknown | null
          landing_page?: string | null
          nome: string
          nota_qualificacao?: number | null
          observacoes?: string | null
          orcamento_max?: number | null
          orcamento_min?: number | null
          origem: string
          prazo?: string | null
          proxima_acao?: string | null
          qualificacao?: string | null
          referrer?: string | null
          responsavel_id?: string | null
          status?: string
          telefone?: string | null
          ultima_interacao?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          valor_conversao?: number | null
        }
        Update: {
          campanha?: string | null
          client_id?: string
          created_at?: string
          data_conversao?: string | null
          email?: string | null
          id?: string
          interesse?: string | null
          ip_address?: unknown | null
          landing_page?: string | null
          nome?: string
          nota_qualificacao?: number | null
          observacoes?: string | null
          orcamento_max?: number | null
          orcamento_min?: number | null
          origem?: string
          prazo?: string | null
          proxima_acao?: string | null
          qualificacao?: string | null
          referrer?: string | null
          responsavel_id?: string | null
          status?: string
          telefone?: string | null
          ultima_interacao?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          valor_conversao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance_stats"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "leads_stats"
            referencedColumns: ["client_id"]
          },
        ]
      }
      managers: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          department: string | null
          email: string
          id: string
          name: string
          phone: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          status?: string | null
          updated_at?: string | null
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
      public_client_registrations: {
        Row: {
          campanhas_ativas: boolean | null
          campanhas_detalhes: string | null
          cidade_regiao: string
          client_id: string | null
          cnpj_creci: string | null
          created_at: string
          crm_utilizado: string | null
          diferenciais: string | null
          email: string
          forma_receber_relatorios: string | null
          id: string
          instagram: string | null
          meta_mensal_vendas: number | null
          nome_completo: string
          nome_gestor_marketing: string | null
          nome_imobiliaria: string
          num_imoveis_ativos: number | null
          objetivos_marketing: string | null
          observacoes_adicionais: string | null
          pixel_analytics_configurado: boolean | null
          processed_at: string | null
          publico_alvo: string
          redes_sociais_adicionais: string[] | null
          site_institucional: string | null
          status: string | null
          telefone: string
          ticket_medio: number | null
          tipo_imoveis: string
          updated_at: string
          valor_mensal_anuncios: number | null
        }
        Insert: {
          campanhas_ativas?: boolean | null
          campanhas_detalhes?: string | null
          cidade_regiao: string
          client_id?: string | null
          cnpj_creci?: string | null
          created_at?: string
          crm_utilizado?: string | null
          diferenciais?: string | null
          email: string
          forma_receber_relatorios?: string | null
          id?: string
          instagram?: string | null
          meta_mensal_vendas?: number | null
          nome_completo: string
          nome_gestor_marketing?: string | null
          nome_imobiliaria: string
          num_imoveis_ativos?: number | null
          objetivos_marketing?: string | null
          observacoes_adicionais?: string | null
          pixel_analytics_configurado?: boolean | null
          processed_at?: string | null
          publico_alvo: string
          redes_sociais_adicionais?: string[] | null
          site_institucional?: string | null
          status?: string | null
          telefone: string
          ticket_medio?: number | null
          tipo_imoveis: string
          updated_at?: string
          valor_mensal_anuncios?: number | null
        }
        Update: {
          campanhas_ativas?: boolean | null
          campanhas_detalhes?: string | null
          cidade_regiao?: string
          client_id?: string | null
          cnpj_creci?: string | null
          created_at?: string
          crm_utilizado?: string | null
          diferenciais?: string | null
          email?: string
          forma_receber_relatorios?: string | null
          id?: string
          instagram?: string | null
          meta_mensal_vendas?: number | null
          nome_completo?: string
          nome_gestor_marketing?: string | null
          nome_imobiliaria?: string
          num_imoveis_ativos?: number | null
          objetivos_marketing?: string | null
          observacoes_adicionais?: string | null
          pixel_analytics_configurado?: boolean | null
          processed_at?: string | null
          publico_alvo?: string
          redes_sociais_adicionais?: string[] | null
          site_institucional?: string | null
          status?: string | null
          telefone?: string
          ticket_medio?: number | null
          tipo_imoveis?: string
          updated_at?: string
          valor_mensal_anuncios?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "public_client_registrations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance_stats"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "public_client_registrations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_client_registrations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "leads_stats"
            referencedColumns: ["client_id"]
          },
        ]
      }
      relatorio_config: {
        Row: {
          ativo: boolean | null
          client_id: string
          created_at: string
          dias_semana: number[] | null
          horario_disparo: string | null
          id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          client_id: string
          created_at?: string
          dias_semana?: number[] | null
          horario_disparo?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          client_id?: string
          created_at?: string
          dias_semana?: number[] | null
          horario_disparo?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "relatorio_config_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "campaign_performance_stats"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "relatorio_config_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relatorio_config_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "leads_stats"
            referencedColumns: ["client_id"]
          },
        ]
      }
      relatorio_disparos: {
        Row: {
          client_id: string
          created_at: string
          dados_enviados: Json | null
          data_disparo: string
          horario_disparo: string
          id: string
          mensagem_erro: string | null
          status: string
          webhook_response: Json | null
        }
        Insert: {
          client_id: string
          created_at?: string
          dados_enviados?: Json | null
          data_disparo: string
          horario_disparo?: string
          id?: string
          mensagem_erro?: string | null
          status?: string
          webhook_response?: Json | null
        }
        Update: {
          client_id?: string
          created_at?: string
          dados_enviados?: Json | null
          data_disparo?: string
          horario_disparo?: string
          id?: string
          mensagem_erro?: string | null
          status?: string
          webhook_response?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "relatorio_disparos_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance_stats"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "relatorio_disparos_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relatorio_disparos_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "leads_stats"
            referencedColumns: ["client_id"]
          },
        ]
      }
    }
    Views: {
      campaign_performance_stats: {
        Row: {
          avg_quality_score: number | null
          client_id: string | null
          conversion_rate: number | null
          nome_cliente: string | null
          pending_feedback: number | null
          qualification_rate: number | null
          total_campaign_days: number | null
          total_converted: number | null
          total_disqualified: number | null
          total_leads: number | null
          total_qualified: number | null
          total_spend: number | null
        }
        Relationships: []
      }
      leads_stats: {
        Row: {
          client_id: string | null
          leads_contatados: number | null
          leads_convertidos: number | null
          leads_desqualificados: number | null
          leads_google: number | null
          leads_meta: number | null
          leads_novos: number | null
          leads_organico: number | null
          leads_qualificados: number | null
          nome_cliente: string | null
          nota_media: number | null
          total_leads: number | null
          valor_total_conversoes: number | null
        }
        Relationships: []
      }
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
