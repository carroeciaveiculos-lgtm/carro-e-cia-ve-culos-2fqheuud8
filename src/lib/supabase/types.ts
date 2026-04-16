// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
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
      access_log: {
        Row: {
          acao: string | null
          id: number
          modulo: string | null
          timestamp: string | null
          usuario_id: string | null
        }
        Insert: {
          acao?: string | null
          id?: number
          modulo?: string | null
          timestamp?: string | null
          usuario_id?: string | null
        }
        Update: {
          acao?: string | null
          id?: number
          modulo?: string | null
          timestamp?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_log_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      assinatura_historico: {
        Row: {
          contrato_id: string | null
          created_at: string | null
          detalhes: Json | null
          evento: string
          id: string
        }
        Insert: {
          contrato_id?: string | null
          created_at?: string | null
          detalhes?: Json | null
          evento: string
          id?: string
        }
        Update: {
          contrato_id?: string | null
          created_at?: string | null
          detalhes?: Json | null
          evento?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assinatura_historico_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos_consignacao"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_api: {
        Row: {
          api_key: string | null
          ativo: boolean | null
          auth_token: string | null
          created_at: string | null
          id: string
          portal: string
          updated_at: string | null
        }
        Insert: {
          api_key?: string | null
          ativo?: boolean | null
          auth_token?: string | null
          created_at?: string | null
          id?: string
          portal: string
          updated_at?: string | null
        }
        Update: {
          api_key?: string | null
          ativo?: boolean | null
          auth_token?: string | null
          created_at?: string | null
          id?: string
          portal?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      consignacoes: {
        Row: {
          comissao: number | null
          created_at: string | null
          data_entrada: string | null
          data_vencimento: string | null
          id: string
          lead_id: string | null
          proprietario_nome: string | null
          proprietario_telefone: string | null
          status: string | null
          valor_anuncio: number | null
          valor_minimo: number | null
          veiculo_id: string | null
        }
        Insert: {
          comissao?: number | null
          created_at?: string | null
          data_entrada?: string | null
          data_vencimento?: string | null
          id?: string
          lead_id?: string | null
          proprietario_nome?: string | null
          proprietario_telefone?: string | null
          status?: string | null
          valor_anuncio?: number | null
          valor_minimo?: number | null
          veiculo_id?: string | null
        }
        Update: {
          comissao?: number | null
          created_at?: string | null
          data_entrada?: string | null
          data_vencimento?: string | null
          id?: string
          lead_id?: string | null
          proprietario_nome?: string | null
          proprietario_telefone?: string | null
          status?: string | null
          valor_anuncio?: number | null
          valor_minimo?: number | null
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consignacoes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consignacoes_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos_consignacao: {
        Row: {
          assinatura_data: string | null
          assinatura_id_externo: string | null
          assinatura_link: string | null
          assinatura_status: string | null
          created_at: string | null
          id: string
          numero_contrato: string | null
          pdf_assinado_url: string | null
          pdf_url: string | null
          proprietario_cpf: string | null
          proprietario_email: string | null
          proprietario_nome: string | null
          proprietario_telefone: string | null
          updated_at: string | null
          veiculo_id: string | null
        }
        Insert: {
          assinatura_data?: string | null
          assinatura_id_externo?: string | null
          assinatura_link?: string | null
          assinatura_status?: string | null
          created_at?: string | null
          id?: string
          numero_contrato?: string | null
          pdf_assinado_url?: string | null
          pdf_url?: string | null
          proprietario_cpf?: string | null
          proprietario_email?: string | null
          proprietario_nome?: string | null
          proprietario_telefone?: string | null
          updated_at?: string | null
          veiculo_id?: string | null
        }
        Update: {
          assinatura_data?: string | null
          assinatura_id_externo?: string | null
          assinatura_link?: string | null
          assinatura_status?: string | null
          created_at?: string | null
          id?: string
          numero_contrato?: string | null
          pdf_assinado_url?: string | null
          pdf_url?: string | null
          proprietario_cpf?: string | null
          proprietario_email?: string | null
          proprietario_nome?: string | null
          proprietario_telefone?: string | null
          updated_at?: string | null
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contratos_consignacao_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      financeiras: {
        Row: {
          aceita_restricao: boolean | null
          ativa: boolean | null
          created_at: string | null
          entrada_minima_percentual: number | null
          id: string
          logo_url: string | null
          nome: string
          observacoes: string | null
          prazo_maximo: number | null
          taxa_juros_mensal: number | null
        }
        Insert: {
          aceita_restricao?: boolean | null
          ativa?: boolean | null
          created_at?: string | null
          entrada_minima_percentual?: number | null
          id?: string
          logo_url?: string | null
          nome: string
          observacoes?: string | null
          prazo_maximo?: number | null
          taxa_juros_mensal?: number | null
        }
        Update: {
          aceita_restricao?: boolean | null
          ativa?: boolean | null
          created_at?: string | null
          entrada_minima_percentual?: number | null
          id?: string
          logo_url?: string | null
          nome?: string
          observacoes?: string | null
          prazo_maximo?: number | null
          taxa_juros_mensal?: number | null
        }
        Relationships: []
      }
      fipe_anos: {
        Row: {
          codigo: string
          codigo_fipe: string | null
          combustivel: string | null
          id: number
          marca_codigo: string
          mes_referencia: string | null
          modelo_codigo: string
          nome: string
          updated_at: string | null
          valor_fipe: number | null
        }
        Insert: {
          codigo: string
          codigo_fipe?: string | null
          combustivel?: string | null
          id?: number
          marca_codigo: string
          mes_referencia?: string | null
          modelo_codigo: string
          nome: string
          updated_at?: string | null
          valor_fipe?: number | null
        }
        Update: {
          codigo?: string
          codigo_fipe?: string | null
          combustivel?: string | null
          id?: number
          marca_codigo?: string
          mes_referencia?: string | null
          modelo_codigo?: string
          nome?: string
          updated_at?: string | null
          valor_fipe?: number | null
        }
        Relationships: []
      }
      fipe_marcas: {
        Row: {
          codigo: string
          created_at: string | null
          id: number
          nome: string
        }
        Insert: {
          codigo: string
          created_at?: string | null
          id?: number
          nome: string
        }
        Update: {
          codigo?: string
          created_at?: string | null
          id?: number
          nome?: string
        }
        Relationships: []
      }
      fipe_modelos: {
        Row: {
          codigo: string
          created_at: string | null
          id: number
          marca_codigo: string
          nome: string
        }
        Insert: {
          codigo: string
          created_at?: string | null
          id?: number
          marca_codigo: string
          nome: string
        }
        Update: {
          codigo?: string
          created_at?: string | null
          id?: number
          marca_codigo?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "fipe_modelos_marca_codigo_fkey"
            columns: ["marca_codigo"]
            isOneToOne: false
            referencedRelation: "fipe_marcas"
            referencedColumns: ["codigo"]
          },
        ]
      }
      followups: {
        Row: {
          concluido: boolean | null
          created_at: string | null
          data_agendada: string | null
          id: string
          lead_id: string | null
          lembrete: string | null
          responsavel_id: string | null
        }
        Insert: {
          concluido?: boolean | null
          created_at?: string | null
          data_agendada?: string | null
          id?: string
          lead_id?: string | null
          lembrete?: string | null
          responsavel_id?: string | null
        }
        Update: {
          concluido?: boolean | null
          created_at?: string | null
          data_agendada?: string | null
          id?: string
          lead_id?: string | null
          lembrete?: string | null
          responsavel_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "followups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followups_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      interacoes: {
        Row: {
          canal: string | null
          created_at: string | null
          descricao: string | null
          id: string
          lead_id: string | null
          tipo: string | null
          usuario_id: string | null
        }
        Insert: {
          canal?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          lead_id?: string | null
          tipo?: string | null
          usuario_id?: string | null
        }
        Update: {
          canal?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          lead_id?: string | null
          tipo?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interacoes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          carro_ano: string | null
          carro_km: string | null
          carro_marca: string | null
          carro_modelo: string | null
          carro_placa: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          faixa_preco: string | null
          forma_pagamento: string | null
          id: string
          nome: string
          observacoes: string | null
          origem: string | null
          responsavel_id: string | null
          status: string | null
          telefone: string | null
          temperatura: string | null
          tipo: string
          unico_dono: boolean | null
          updated_at: string | null
          valor_veiculo: number | null
          veiculo_id: string | null
          veiculo_interesse: string | null
        }
        Insert: {
          carro_ano?: string | null
          carro_km?: string | null
          carro_marca?: string | null
          carro_modelo?: string | null
          carro_placa?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          faixa_preco?: string | null
          forma_pagamento?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          origem?: string | null
          responsavel_id?: string | null
          status?: string | null
          telefone?: string | null
          temperatura?: string | null
          tipo: string
          unico_dono?: boolean | null
          updated_at?: string | null
          valor_veiculo?: number | null
          veiculo_id?: string | null
          veiculo_interesse?: string | null
        }
        Update: {
          carro_ano?: string | null
          carro_km?: string | null
          carro_marca?: string | null
          carro_modelo?: string | null
          carro_placa?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          faixa_preco?: string | null
          forma_pagamento?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          origem?: string | null
          responsavel_id?: string | null
          status?: string | null
          telefone?: string | null
          temperatura?: string | null
          tipo?: string
          unico_dono?: boolean | null
          updated_at?: string | null
          valor_veiculo?: number | null
          veiculo_id?: string | null
          veiculo_interesse?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_integracao: {
        Row: {
          created_at: string | null
          id: string
          payload_erro: Json | null
          portal: string
          status: string | null
          veiculo_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          payload_erro?: Json | null
          portal: string
          status?: string | null
          veiculo_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          payload_erro?: Json | null
          portal?: string
          status?: string | null
          veiculo_id?: string | null
        }
        Relationships: []
      }
      mensagens_template: {
        Row: {
          ativo: boolean | null
          canal: string | null
          conteudo: string
          created_at: string | null
          id: string
          tipo: string | null
          titulo: string
          variaveis: Json | null
        }
        Insert: {
          ativo?: boolean | null
          canal?: string | null
          conteudo: string
          created_at?: string | null
          id?: string
          tipo?: string | null
          titulo: string
          variaveis?: Json | null
        }
        Update: {
          ativo?: boolean | null
          canal?: string | null
          conteudo?: string
          created_at?: string | null
          id?: string
          tipo?: string | null
          titulo?: string
          variaveis?: Json | null
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          email: string
          id: string
          modulos: string[] | null
          nivel: string | null
          nome: string
          role: string | null
          ultimo_acesso: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          email: string
          id?: string
          modulos?: string[] | null
          nivel?: string | null
          nome: string
          role?: string | null
          ultimo_acesso?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          email?: string
          id?: string
          modulos?: string[] | null
          nivel?: string | null
          nome?: string
          role?: string | null
          ultimo_acesso?: string | null
        }
        Relationships: []
      }
      veiculos: {
        Row: {
          ano_fabricacao: number | null
          ano_modelo: number | null
          cambio: string | null
          caracteristicas: Json | null
          categoria: string | null
          chassi: string | null
          cliques_whatsapp: number | null
          combustivel: string | null
          cor: string | null
          created_at: string | null
          descricao: string | null
          destaque: boolean | null
          diferenciais: Json | null
          final_placa: string | null
          fipe_ref: string | null
          fotos: Json | null
          id: string
          info_personalizadas: Json | null
          ipva_pago: boolean | null
          is_consignado: boolean | null
          is_zero_km: boolean | null
          marca: string
          mesma_obs_classificados: boolean | null
          modelo: string
          nao_exibir_km: boolean | null
          placa: string | null
          portas: number | null
          preco_classificados: number | null
          preco_minimo: number | null
          preco_venda: number | null
          proprietario_cpf: string | null
          proprietario_email: string | null
          proprietario_nome: string | null
          proprietario_telefone: string | null
          publicado_icarros: boolean | null
          publicado_mercadolivre: boolean | null
          publicado_napista: boolean | null
          publicado_olx: boolean | null
          publicado_webmotors: boolean | null
          quilometragem: number | null
          renavam: string | null
          responsavel_id: string | null
          status: string | null
          updated_at: string | null
          valor_fipe: number | null
          versao: string | null
          video_url: string | null
          visualizacoes_site: number | null
        }
        Insert: {
          ano_fabricacao?: number | null
          ano_modelo?: number | null
          cambio?: string | null
          caracteristicas?: Json | null
          categoria?: string | null
          chassi?: string | null
          cliques_whatsapp?: number | null
          combustivel?: string | null
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          destaque?: boolean | null
          diferenciais?: Json | null
          final_placa?: string | null
          fipe_ref?: string | null
          fotos?: Json | null
          id?: string
          info_personalizadas?: Json | null
          ipva_pago?: boolean | null
          is_consignado?: boolean | null
          is_zero_km?: boolean | null
          marca: string
          mesma_obs_classificados?: boolean | null
          modelo: string
          nao_exibir_km?: boolean | null
          placa?: string | null
          portas?: number | null
          preco_classificados?: number | null
          preco_minimo?: number | null
          preco_venda?: number | null
          proprietario_cpf?: string | null
          proprietario_email?: string | null
          proprietario_nome?: string | null
          proprietario_telefone?: string | null
          publicado_icarros?: boolean | null
          publicado_mercadolivre?: boolean | null
          publicado_napista?: boolean | null
          publicado_olx?: boolean | null
          publicado_webmotors?: boolean | null
          quilometragem?: number | null
          renavam?: string | null
          responsavel_id?: string | null
          status?: string | null
          updated_at?: string | null
          valor_fipe?: number | null
          versao?: string | null
          video_url?: string | null
          visualizacoes_site?: number | null
        }
        Update: {
          ano_fabricacao?: number | null
          ano_modelo?: number | null
          cambio?: string | null
          caracteristicas?: Json | null
          categoria?: string | null
          chassi?: string | null
          cliques_whatsapp?: number | null
          combustivel?: string | null
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          destaque?: boolean | null
          diferenciais?: Json | null
          final_placa?: string | null
          fipe_ref?: string | null
          fotos?: Json | null
          id?: string
          info_personalizadas?: Json | null
          ipva_pago?: boolean | null
          is_consignado?: boolean | null
          is_zero_km?: boolean | null
          marca?: string
          mesma_obs_classificados?: boolean | null
          modelo?: string
          nao_exibir_km?: boolean | null
          placa?: string | null
          portas?: number | null
          preco_classificados?: number | null
          preco_minimo?: number | null
          preco_venda?: number | null
          proprietario_cpf?: string | null
          proprietario_email?: string | null
          proprietario_nome?: string | null
          proprietario_telefone?: string | null
          publicado_icarros?: boolean | null
          publicado_mercadolivre?: boolean | null
          publicado_napista?: boolean | null
          publicado_olx?: boolean | null
          publicado_webmotors?: boolean | null
          quilometragem?: number | null
          renavam?: string | null
          responsavel_id?: string | null
          status?: string | null
          updated_at?: string | null
          valor_fipe?: number | null
          versao?: string | null
          video_url?: string | null
          visualizacoes_site?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "veiculos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
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


// ====== DATABASE EXTENDED CONTEXT (auto-generated) ======
// This section contains actual PostgreSQL column types, constraints, RLS policies,
// functions, triggers, indexes and materialized views not present in the type definitions above.
// IMPORTANT: The TypeScript types above map UUID, TEXT, VARCHAR all to "string".
// Use the COLUMN TYPES section below to know the real PostgreSQL type for each column.
// Always use the correct PostgreSQL type when writing SQL migrations.

// --- COLUMN TYPES (actual PostgreSQL types) ---
// Use this to know the real database type when writing migrations.
// "string" in TypeScript types above may be uuid, text, varchar, timestamptz, etc.
// Table: access_log
//   id: bigint (not null, default: nextval('access_log_id_seq'::regclass))
//   usuario_id: uuid (nullable)
//   modulo: text (nullable)
//   acao: text (nullable)
//   timestamp: timestamp without time zone (nullable, default: now())
// Table: assinatura_historico
//   id: uuid (not null, default: gen_random_uuid())
//   contrato_id: uuid (nullable)
//   evento: text (not null)
//   detalhes: jsonb (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: configuracoes_api
//   id: uuid (not null, default: gen_random_uuid())
//   portal: text (not null)
//   api_key: text (nullable)
//   auth_token: text (nullable)
//   ativo: boolean (nullable, default: false)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: consignacoes
//   id: uuid (not null, default: gen_random_uuid())
//   lead_id: uuid (nullable)
//   veiculo_id: uuid (nullable)
//   proprietario_nome: text (nullable)
//   proprietario_telefone: text (nullable)
//   valor_minimo: numeric (nullable)
//   valor_anuncio: numeric (nullable)
//   comissao: numeric (nullable)
//   data_entrada: date (nullable)
//   data_vencimento: date (nullable)
//   status: text (nullable, default: 'ativo'::text)
//   created_at: timestamp without time zone (nullable, default: now())
// Table: contratos_consignacao
//   id: uuid (not null, default: gen_random_uuid())
//   veiculo_id: uuid (nullable)
//   proprietario_nome: text (nullable)
//   proprietario_email: text (nullable)
//   proprietario_cpf: text (nullable)
//   proprietario_telefone: text (nullable)
//   numero_contrato: text (nullable)
//   assinatura_link: text (nullable)
//   assinatura_id_externo: text (nullable)
//   assinatura_status: text (nullable, default: 'nao_enviado'::text)
//   assinatura_data: timestamp with time zone (nullable)
//   pdf_url: text (nullable)
//   pdf_assinado_url: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: financeiras
//   id: uuid (not null, default: gen_random_uuid())
//   nome: text (not null)
//   logo_url: text (nullable)
//   taxa_juros_mensal: numeric (nullable)
//   prazo_maximo: integer (nullable)
//   entrada_minima_percentual: numeric (nullable)
//   aceita_restricao: boolean (nullable, default: false)
//   observacoes: text (nullable)
//   ativa: boolean (nullable, default: true)
//   created_at: timestamp without time zone (nullable, default: now())
// Table: fipe_anos
//   id: integer (not null, default: nextval('fipe_anos_id_seq'::regclass))
//   codigo: text (not null)
//   nome: text (not null)
//   modelo_codigo: text (not null)
//   marca_codigo: text (not null)
//   valor_fipe: numeric (nullable)
//   combustivel: text (nullable)
//   codigo_fipe: text (nullable)
//   mes_referencia: text (nullable)
//   updated_at: timestamp without time zone (nullable, default: now())
// Table: fipe_marcas
//   id: integer (not null, default: nextval('fipe_marcas_id_seq'::regclass))
//   codigo: text (not null)
//   nome: text (not null)
//   created_at: timestamp without time zone (nullable, default: now())
// Table: fipe_modelos
//   id: integer (not null, default: nextval('fipe_modelos_id_seq'::regclass))
//   codigo: text (not null)
//   nome: text (not null)
//   marca_codigo: text (not null)
//   created_at: timestamp without time zone (nullable, default: now())
// Table: followups
//   id: uuid (not null, default: gen_random_uuid())
//   lead_id: uuid (nullable)
//   responsavel_id: uuid (nullable)
//   data_agendada: timestamp without time zone (nullable)
//   lembrete: text (nullable)
//   concluido: boolean (nullable, default: false)
//   created_at: timestamp without time zone (nullable, default: now())
// Table: interacoes
//   id: uuid (not null, default: gen_random_uuid())
//   lead_id: uuid (nullable)
//   usuario_id: uuid (nullable)
//   tipo: text (nullable)
//   canal: text (nullable)
//   descricao: text (nullable)
//   created_at: timestamp without time zone (nullable, default: now())
// Table: leads
//   id: uuid (not null, default: gen_random_uuid())
//   nome: text (not null)
//   telefone: text (nullable)
//   email: text (nullable)
//   cpf: text (nullable)
//   tipo: text (not null)
//   origem: text (nullable)
//   status: text (nullable, default: 'novo'::text)
//   temperatura: text (nullable, default: 'frio'::text)
//   responsavel_id: uuid (nullable)
//   veiculo_id: uuid (nullable)
//   veiculo_interesse: text (nullable)
//   faixa_preco: text (nullable)
//   forma_pagamento: text (nullable)
//   observacoes: text (nullable)
//   created_at: timestamp without time zone (nullable, default: now())
//   updated_at: timestamp without time zone (nullable, default: now())
//   carro_modelo: text (nullable)
//   carro_ano: text (nullable)
//   carro_placa: text (nullable)
//   carro_marca: text (nullable)
//   carro_km: text (nullable)
//   unico_dono: boolean (nullable, default: false)
//   valor_veiculo: numeric (nullable)
// Table: logs_integracao
//   id: uuid (not null, default: gen_random_uuid())
//   veiculo_id: uuid (nullable)
//   portal: text (not null)
//   payload_erro: jsonb (nullable)
//   status: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: mensagens_template
//   id: uuid (not null, default: gen_random_uuid())
//   titulo: text (not null)
//   tipo: text (nullable)
//   canal: text (nullable)
//   conteudo: text (not null)
//   variaveis: jsonb (nullable)
//   ativo: boolean (nullable, default: true)
//   created_at: timestamp without time zone (nullable, default: now())
// Table: usuarios
//   id: uuid (not null, default: gen_random_uuid())
//   nome: text (not null)
//   email: text (not null)
//   role: text (nullable, default: 'vendedor'::text)
//   ativo: boolean (nullable, default: true)
//   created_at: timestamp without time zone (nullable, default: now())
//   modulos: _text (nullable, default: ARRAY['estoque'::text])
//   ultimo_acesso: timestamp without time zone (nullable)
//   nivel: text (nullable, default: 'operador'::text)
// Table: veiculos
//   id: uuid (not null, default: gen_random_uuid())
//   marca: text (not null)
//   modelo: text (not null)
//   versao: text (nullable)
//   ano_fabricacao: integer (nullable)
//   ano_modelo: integer (nullable)
//   cor: text (nullable)
//   quilometragem: integer (nullable)
//   cambio: text (nullable)
//   combustivel: text (nullable)
//   portas: integer (nullable)
//   final_placa: text (nullable)
//   ipva_pago: boolean (nullable, default: false)
//   preco_venda: numeric (nullable)
//   preco_minimo: numeric (nullable)
//   valor_fipe: numeric (nullable)
//   status: text (nullable, default: 'disponivel'::text)
//   is_consignado: boolean (nullable, default: false)
//   proprietario_nome: text (nullable)
//   proprietario_telefone: text (nullable)
//   descricao: text (nullable)
//   diferenciais: jsonb (nullable)
//   fotos: jsonb (nullable)
//   video_url: text (nullable)
//   responsavel_id: uuid (nullable)
//   publicado_olx: boolean (nullable, default: false)
//   publicado_webmotors: boolean (nullable, default: false)
//   publicado_icarros: boolean (nullable, default: false)
//   created_at: timestamp without time zone (nullable, default: now())
//   updated_at: timestamp without time zone (nullable, default: now())
//   placa: text (nullable)
//   chassi: text (nullable)
//   renavam: text (nullable)
//   preco_classificados: numeric (nullable)
//   is_zero_km: boolean (nullable, default: false)
//   categoria: text (nullable, default: 'Carro'::text)
//   destaque: boolean (nullable, default: false)
//   publicado_mercadolivre: boolean (nullable, default: false)
//   publicado_napista: boolean (nullable, default: false)
//   caracteristicas: jsonb (nullable, default: '[]'::jsonb)
//   visualizacoes_site: integer (nullable, default: 0)
//   cliques_whatsapp: integer (nullable, default: 0)
//   nao_exibir_km: boolean (nullable, default: false)
//   mesma_obs_classificados: boolean (nullable, default: false)
//   fipe_ref: text (nullable)
//   info_personalizadas: jsonb (nullable, default: '[]'::jsonb)
//   proprietario_email: text (nullable)
//   proprietario_cpf: text (nullable)

// --- CONSTRAINTS ---
// Table: access_log
//   PRIMARY KEY access_log_pkey: PRIMARY KEY (id)
//   FOREIGN KEY access_log_usuario_id_fkey: FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
// Table: assinatura_historico
//   FOREIGN KEY assinatura_historico_contrato_id_fkey: FOREIGN KEY (contrato_id) REFERENCES contratos_consignacao(id) ON DELETE CASCADE
//   PRIMARY KEY assinatura_historico_pkey: PRIMARY KEY (id)
// Table: configuracoes_api
//   PRIMARY KEY configuracoes_api_pkey: PRIMARY KEY (id)
//   UNIQUE configuracoes_api_portal_key: UNIQUE (portal)
// Table: consignacoes
//   FOREIGN KEY consignacoes_lead_id_fkey: FOREIGN KEY (lead_id) REFERENCES leads(id)
//   PRIMARY KEY consignacoes_pkey: PRIMARY KEY (id)
//   FOREIGN KEY consignacoes_veiculo_id_fkey: FOREIGN KEY (veiculo_id) REFERENCES veiculos(id)
// Table: contratos_consignacao
//   PRIMARY KEY contratos_consignacao_pkey: PRIMARY KEY (id)
//   FOREIGN KEY contratos_consignacao_veiculo_id_fkey: FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE SET NULL
// Table: financeiras
//   PRIMARY KEY financeiras_pkey: PRIMARY KEY (id)
// Table: fipe_anos
//   UNIQUE fipe_anos_codigo_modelo_codigo_marca_codigo_key: UNIQUE (codigo, modelo_codigo, marca_codigo)
//   PRIMARY KEY fipe_anos_pkey: PRIMARY KEY (id)
// Table: fipe_marcas
//   UNIQUE fipe_marcas_codigo_key: UNIQUE (codigo)
//   PRIMARY KEY fipe_marcas_pkey: PRIMARY KEY (id)
// Table: fipe_modelos
//   UNIQUE fipe_modelos_codigo_marca_codigo_key: UNIQUE (codigo, marca_codigo)
//   FOREIGN KEY fipe_modelos_marca_codigo_fkey: FOREIGN KEY (marca_codigo) REFERENCES fipe_marcas(codigo)
//   PRIMARY KEY fipe_modelos_pkey: PRIMARY KEY (id)
// Table: followups
//   FOREIGN KEY followups_lead_id_fkey: FOREIGN KEY (lead_id) REFERENCES leads(id)
//   PRIMARY KEY followups_pkey: PRIMARY KEY (id)
//   FOREIGN KEY followups_responsavel_id_fkey: FOREIGN KEY (responsavel_id) REFERENCES usuarios(id)
// Table: interacoes
//   FOREIGN KEY interacoes_lead_id_fkey: FOREIGN KEY (lead_id) REFERENCES leads(id)
//   PRIMARY KEY interacoes_pkey: PRIMARY KEY (id)
//   FOREIGN KEY interacoes_usuario_id_fkey: FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
// Table: leads
//   PRIMARY KEY leads_pkey: PRIMARY KEY (id)
//   FOREIGN KEY leads_responsavel_id_fkey: FOREIGN KEY (responsavel_id) REFERENCES usuarios(id)
//   FOREIGN KEY leads_veiculo_id_fkey: FOREIGN KEY (veiculo_id) REFERENCES veiculos(id)
// Table: logs_integracao
//   PRIMARY KEY logs_integracao_pkey: PRIMARY KEY (id)
// Table: mensagens_template
//   PRIMARY KEY mensagens_template_pkey: PRIMARY KEY (id)
// Table: usuarios
//   UNIQUE usuarios_email_key: UNIQUE (email)
//   PRIMARY KEY usuarios_pkey: PRIMARY KEY (id)
// Table: veiculos
//   PRIMARY KEY veiculos_pkey: PRIMARY KEY (id)
//   FOREIGN KEY veiculos_responsavel_id_fkey: FOREIGN KEY (responsavel_id) REFERENCES usuarios(id)

// --- ROW LEVEL SECURITY POLICIES ---
// Table: access_log
//   Policy "allow_auth_all_access_log" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: assinatura_historico
//   Policy "allow_auth_all_assinatura_historico" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: configuracoes_api
//   Policy "allow_auth_all_configuracoes_api" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: consignacoes
//   Policy "allow_auth_all_consignacoes" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: contratos_consignacao
//   Policy "allow_auth_all_contratos_consignacao" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: leads
//   Policy "allow_anon_insert_leads" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: true
//   Policy "allow_auth_all_leads" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: logs_integracao
//   Policy "allow_auth_all_logs_integracao" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: usuarios
//   Policy "allow_auth_all_usuarios" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: veiculos
//   Policy "allow_anon_select_veiculos" (SELECT, PERMISSIVE) roles={public}
//     USING: true
//   Policy "allow_auth_all_veiculos" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true

// --- WARNING: TABLES WITH RLS ENABLED BUT NO POLICIES ---
// These tables have Row Level Security enabled but NO policies defined.
// This means ALL queries (SELECT, INSERT, UPDATE, DELETE) will return ZERO rows
// for non-superuser roles (including the anon and authenticated roles used by the app).
// You MUST create RLS policies for these tables to allow data access.
//   - financeiras
//   - fipe_anos
//   - fipe_marcas
//   - fipe_modelos
//   - followups
//   - interacoes
//   - mensagens_template

// --- DATABASE FUNCTIONS ---
// FUNCTION rls_auto_enable()
//   CREATE OR REPLACE FUNCTION public.rls_auto_enable()
//    RETURNS event_trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'pg_catalog'
//   AS $function$
//   DECLARE
//     cmd record;
//   BEGIN
//     FOR cmd IN
//       SELECT *
//       FROM pg_event_trigger_ddl_commands()
//       WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
//         AND object_type IN ('table','partitioned table')
//     LOOP
//        IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
//         BEGIN
//           EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
//           RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
//         EXCEPTION
//           WHEN OTHERS THEN
//             RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
//         END;
//        ELSE
//           RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
//        END IF;
//     END LOOP;
//   END;
//   $function$
//   

// --- INDEXES ---
// Table: configuracoes_api
//   CREATE UNIQUE INDEX configuracoes_api_portal_key ON public.configuracoes_api USING btree (portal)
// Table: fipe_anos
//   CREATE UNIQUE INDEX fipe_anos_codigo_modelo_codigo_marca_codigo_key ON public.fipe_anos USING btree (codigo, modelo_codigo, marca_codigo)
// Table: fipe_marcas
//   CREATE UNIQUE INDEX fipe_marcas_codigo_key ON public.fipe_marcas USING btree (codigo)
// Table: fipe_modelos
//   CREATE UNIQUE INDEX fipe_modelos_codigo_marca_codigo_key ON public.fipe_modelos USING btree (codigo, marca_codigo)
// Table: usuarios
//   CREATE UNIQUE INDEX usuarios_email_key ON public.usuarios USING btree (email)

