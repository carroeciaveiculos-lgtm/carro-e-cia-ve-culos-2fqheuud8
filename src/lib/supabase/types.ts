// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
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
            foreignKeyName: 'access_log_usuario_id_fkey'
            columns: ['usuario_id']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
        ]
      }
      article_versions: {
        Row: {
          acao: string | null
          article_id: string
          artigo_pillar: boolean | null
          artigos_relacionados: Json | null
          autor_convidado: string | null
          autor_id: string | null
          canonical_url: string | null
          categoria: string | null
          categoria_secundaria: string | null
          conteudo: string | null
          criado_em: string | null
          data_agendamento: string | null
          destaque: boolean | null
          h1_artigo: string | null
          id: string
          imagem_destaque_url: string | null
          indice_google: boolean | null
          meta_description: string | null
          meta_title: string | null
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
          palavras_chave_principais: Json | null
          palavras_chave_secundarias: Json | null
          permitir_comentarios: boolean | null
          proximo_artigo_sugerido: string | null
          resumo: string | null
          resumo_mudancas: Json | null
          robots_meta: string | null
          schema_markup: string | null
          seo_score: number | null
          slug: string | null
          status_publicacao: string | null
          tags: Json | null
          tempo_leitura: number | null
          titulo: string | null
          url_fonte_externa: string | null
        }
        Insert: {
          acao?: string | null
          article_id: string
          artigo_pillar?: boolean | null
          artigos_relacionados?: Json | null
          autor_convidado?: string | null
          autor_id?: string | null
          canonical_url?: string | null
          categoria?: string | null
          categoria_secundaria?: string | null
          conteudo?: string | null
          criado_em?: string | null
          data_agendamento?: string | null
          destaque?: boolean | null
          h1_artigo?: string | null
          id?: string
          imagem_destaque_url?: string | null
          indice_google?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          palavras_chave_principais?: Json | null
          palavras_chave_secundarias?: Json | null
          permitir_comentarios?: boolean | null
          proximo_artigo_sugerido?: string | null
          resumo?: string | null
          resumo_mudancas?: Json | null
          robots_meta?: string | null
          schema_markup?: string | null
          seo_score?: number | null
          slug?: string | null
          status_publicacao?: string | null
          tags?: Json | null
          tempo_leitura?: number | null
          titulo?: string | null
          url_fonte_externa?: string | null
        }
        Update: {
          acao?: string | null
          article_id?: string
          artigo_pillar?: boolean | null
          artigos_relacionados?: Json | null
          autor_convidado?: string | null
          autor_id?: string | null
          canonical_url?: string | null
          categoria?: string | null
          categoria_secundaria?: string | null
          conteudo?: string | null
          criado_em?: string | null
          data_agendamento?: string | null
          destaque?: boolean | null
          h1_artigo?: string | null
          id?: string
          imagem_destaque_url?: string | null
          indice_google?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          palavras_chave_principais?: Json | null
          palavras_chave_secundarias?: Json | null
          permitir_comentarios?: boolean | null
          proximo_artigo_sugerido?: string | null
          resumo?: string | null
          resumo_mudancas?: Json | null
          robots_meta?: string | null
          schema_markup?: string | null
          seo_score?: number | null
          slug?: string | null
          status_publicacao?: string | null
          tags?: Json | null
          tempo_leitura?: number | null
          titulo?: string | null
          url_fonte_externa?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'article_versions_article_id_fkey'
            columns: ['article_id']
            isOneToOne: false
            referencedRelation: 'articles'
            referencedColumns: ['id']
          },
        ]
      }
      articles: {
        Row: {
          artigo_pillar: boolean | null
          artigos_relacionados: Json | null
          atualizado_em: string | null
          autor_convidado: string | null
          autor_id: string | null
          canonical_url: string | null
          categoria: string | null
          categoria_secundaria: string | null
          conteudo: string | null
          criado_em: string | null
          data_agendamento: string | null
          destaque: boolean | null
          h1_artigo: string | null
          ia_confidence: string | null
          ia_generated: boolean | null
          id: string
          image_prompt: string | null
          imagem_destaque_url: string | null
          indice_google: boolean | null
          keyword: string | null
          meta_description: string | null
          meta_title: string | null
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
          palavras_chave_principais: Json | null
          palavras_chave_secundarias: Json | null
          permitir_comentarios: boolean | null
          proximo_artigo_sugerido: string | null
          requires_review: boolean | null
          resumo: string | null
          robots_meta: string | null
          schema_markup: string | null
          seo_score: number | null
          slug: string
          status_publicacao: string | null
          tags: Json | null
          tempo_leitura: number | null
          titulo: string
          url_fonte_externa: string | null
          url_path: string | null
        }
        Insert: {
          artigo_pillar?: boolean | null
          artigos_relacionados?: Json | null
          atualizado_em?: string | null
          autor_convidado?: string | null
          autor_id?: string | null
          canonical_url?: string | null
          categoria?: string | null
          categoria_secundaria?: string | null
          conteudo?: string | null
          criado_em?: string | null
          data_agendamento?: string | null
          destaque?: boolean | null
          h1_artigo?: string | null
          ia_confidence?: string | null
          ia_generated?: boolean | null
          id?: string
          image_prompt?: string | null
          imagem_destaque_url?: string | null
          indice_google?: boolean | null
          keyword?: string | null
          meta_description?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          palavras_chave_principais?: Json | null
          palavras_chave_secundarias?: Json | null
          permitir_comentarios?: boolean | null
          proximo_artigo_sugerido?: string | null
          requires_review?: boolean | null
          resumo?: string | null
          robots_meta?: string | null
          schema_markup?: string | null
          seo_score?: number | null
          slug: string
          status_publicacao?: string | null
          tags?: Json | null
          tempo_leitura?: number | null
          titulo: string
          url_fonte_externa?: string | null
          url_path?: string | null
        }
        Update: {
          artigo_pillar?: boolean | null
          artigos_relacionados?: Json | null
          atualizado_em?: string | null
          autor_convidado?: string | null
          autor_id?: string | null
          canonical_url?: string | null
          categoria?: string | null
          categoria_secundaria?: string | null
          conteudo?: string | null
          criado_em?: string | null
          data_agendamento?: string | null
          destaque?: boolean | null
          h1_artigo?: string | null
          ia_confidence?: string | null
          ia_generated?: boolean | null
          id?: string
          image_prompt?: string | null
          imagem_destaque_url?: string | null
          indice_google?: boolean | null
          keyword?: string | null
          meta_description?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          palavras_chave_principais?: Json | null
          palavras_chave_secundarias?: Json | null
          permitir_comentarios?: boolean | null
          proximo_artigo_sugerido?: string | null
          requires_review?: boolean | null
          resumo?: string | null
          robots_meta?: string | null
          schema_markup?: string | null
          seo_score?: number | null
          slug?: string
          status_publicacao?: string | null
          tags?: Json | null
          tempo_leitura?: number | null
          titulo?: string
          url_fonte_externa?: string | null
          url_path?: string | null
        }
        Relationships: []
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
            foreignKeyName: 'assinatura_historico_contrato_id_fkey'
            columns: ['contrato_id']
            isOneToOne: false
            referencedRelation: 'contratos_consignacao'
            referencedColumns: ['id']
          },
        ]
      }
      avaliacoes: {
        Row: {
          ano: string | null
          cliente_nome: string | null
          cliente_telefone: string | null
          condicao_geral: string | null
          created_at: string | null
          data_avaliacao: string | null
          id: string
          lead_id: string | null
          marca: string | null
          margem_esperada: number | null
          modelo: string | null
          observacoes: string | null
          placa_veiculo: string | null
          preco_consignacao: number | null
          quilometragem: number | null
          status: string | null
          valor_avaliado: number | null
          valor_fipe: number | null
        }
        Insert: {
          ano?: string | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          condicao_geral?: string | null
          created_at?: string | null
          data_avaliacao?: string | null
          id?: string
          lead_id?: string | null
          marca?: string | null
          margem_esperada?: number | null
          modelo?: string | null
          observacoes?: string | null
          placa_veiculo?: string | null
          preco_consignacao?: number | null
          quilometragem?: number | null
          status?: string | null
          valor_avaliado?: number | null
          valor_fipe?: number | null
        }
        Update: {
          ano?: string | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          condicao_geral?: string | null
          created_at?: string | null
          data_avaliacao?: string | null
          id?: string
          lead_id?: string | null
          marca?: string | null
          margem_esperada?: number | null
          modelo?: string | null
          observacoes?: string | null
          placa_veiculo?: string | null
          preco_consignacao?: number | null
          quilometragem?: number | null
          status?: string | null
          valor_avaliado?: number | null
          valor_fipe?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'avaliacoes_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
        ]
      }
      block_templates: {
        Row: {
          categoria: string
          conteudo: Json
          criado_em: string | null
          id: string
          nome: string
          preview_url: string | null
        }
        Insert: {
          categoria: string
          conteudo: Json
          criado_em?: string | null
          id?: string
          nome: string
          preview_url?: string | null
        }
        Update: {
          categoria?: string
          conteudo?: Json
          criado_em?: string | null
          id?: string
          nome?: string
          preview_url?: string | null
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          autor_email: string
          autor_nome: string
          conteudo: string
          created_at: string | null
          id: string
          post_id: string | null
          publicado: boolean | null
        }
        Insert: {
          autor_email: string
          autor_nome: string
          conteudo: string
          created_at?: string | null
          id?: string
          post_id?: string | null
          publicado?: boolean | null
        }
        Update: {
          autor_email?: string
          autor_nome?: string
          conteudo?: string
          created_at?: string | null
          id?: string
          post_id?: string | null
          publicado?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: 'blog_comments_post_id_fkey'
            columns: ['post_id']
            isOneToOne: false
            referencedRelation: 'blog_posts'
            referencedColumns: ['id']
          },
        ]
      }
      blog_posts: {
        Row: {
          author: string | null
          category: string | null
          content: string
          created_at: string | null
          ia_confidence: string | null
          ia_generated: boolean | null
          id: string
          image_prompt: string | null
          image_url: string | null
          keyword: string | null
          meta_description: string | null
          published: boolean | null
          read_time: string | null
          requires_review: boolean | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string | null
          url_path: string | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          content: string
          created_at?: string | null
          ia_confidence?: string | null
          ia_generated?: boolean | null
          id?: string
          image_prompt?: string | null
          image_url?: string | null
          keyword?: string | null
          meta_description?: string | null
          published?: boolean | null
          read_time?: string | null
          requires_review?: boolean | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          url_path?: string | null
        }
        Update: {
          author?: string | null
          category?: string | null
          content?: string
          created_at?: string | null
          ia_confidence?: string | null
          ia_generated?: boolean | null
          id?: string
          image_prompt?: string | null
          image_url?: string | null
          keyword?: string | null
          meta_description?: string | null
          published?: boolean | null
          read_time?: string | null
          requires_review?: boolean | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          url_path?: string | null
        }
        Relationships: []
      }
      brain_ia_knowledge: {
        Row: {
          conteudo: string | null
          created_at: string
          created_by: string | null
          file_name: string | null
          file_url: string | null
          id: string
          tipo: string
          titulo: string
        }
        Insert: {
          conteudo?: string | null
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          tipo?: string
          titulo: string
        }
        Update: {
          conteudo?: string | null
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          tipo?: string
          titulo?: string
        }
        Relationships: []
      }
      chatbot_history: {
        Row: {
          criado_em: string | null
          editor_id: string | null
          id: string
          pergunta: string | null
          resposta: string | null
          tipo_editor: string | null
          usuario_id: string | null
        }
        Insert: {
          criado_em?: string | null
          editor_id?: string | null
          id?: string
          pergunta?: string | null
          resposta?: string | null
          tipo_editor?: string | null
          usuario_id?: string | null
        }
        Update: {
          criado_em?: string | null
          editor_id?: string | null
          id?: string
          pergunta?: string | null
          resposta?: string | null
          tipo_editor?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          cpf: string
          created_at: string
          data_nascimento: string | null
          email: string | null
          estado: string | null
          id: string
          idade: string | null
          logradouro: string | null
          nome: string
          nome_mae: string | null
          numero: string | null
          rg: string | null
          sexo: string | null
          situacao_receita: string | null
          situacao_receita_data: string | null
          telefone: string | null
          telefone_residencial: string | null
          telefone_trabalho: string | null
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf: string
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          idade?: string | null
          logradouro?: string | null
          nome: string
          nome_mae?: string | null
          numero?: string | null
          rg?: string | null
          sexo?: string | null
          situacao_receita?: string | null
          situacao_receita_data?: string | null
          telefone?: string | null
          telefone_residencial?: string | null
          telefone_trabalho?: string | null
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf?: string
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          idade?: string | null
          logradouro?: string | null
          nome?: string
          nome_mae?: string | null
          numero?: string | null
          rg?: string | null
          sexo?: string | null
          situacao_receita?: string | null
          situacao_receita_data?: string | null
          telefone?: string | null
          telefone_residencial?: string | null
          telefone_trabalho?: string | null
          updated_at?: string
        }
        Relationships: []
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
            foreignKeyName: 'consignacoes_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'consignacoes_veiculo_id_fkey'
            columns: ['veiculo_id']
            isOneToOne: false
            referencedRelation: 'veiculos'
            referencedColumns: ['id']
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
            foreignKeyName: 'contratos_consignacao_veiculo_id_fkey'
            columns: ['veiculo_id']
            isOneToOne: false
            referencedRelation: 'veiculos'
            referencedColumns: ['id']
          },
        ]
      }
      conversation_history: {
        Row: {
          created_at: string
          id: string
          lead_id: string | null
          message_text: string
          sender: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id?: string | null
          message_text: string
          sender: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string | null
          message_text?: string
          sender?: string
        }
        Relationships: [
          {
            foreignKeyName: 'conversation_history_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
        ]
      }
      crm_conversas: {
        Row: {
          cliente_nome: string | null
          cliente_psid: string | null
          cliente_telefone: string | null
          cliente_wamid: string | null
          created_at: string | null
          id: string
          meta_account_id: string | null
          meta_data: Json | null
          platform: string
          status: string | null
          tags: string[] | null
          ultima_msg_em: string | null
          updated_at: string | null
          vendedor_id: string | null
        }
        Insert: {
          cliente_nome?: string | null
          cliente_psid?: string | null
          cliente_telefone?: string | null
          cliente_wamid?: string | null
          created_at?: string | null
          id?: string
          meta_account_id?: string | null
          meta_data?: Json | null
          platform: string
          status?: string | null
          tags?: string[] | null
          ultima_msg_em?: string | null
          updated_at?: string | null
          vendedor_id?: string | null
        }
        Update: {
          cliente_nome?: string | null
          cliente_psid?: string | null
          cliente_telefone?: string | null
          cliente_wamid?: string | null
          created_at?: string | null
          id?: string
          meta_account_id?: string | null
          meta_data?: Json | null
          platform?: string
          status?: string | null
          tags?: string[] | null
          ultima_msg_em?: string | null
          updated_at?: string | null
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'crm_conversas_meta_account_id_fkey'
            columns: ['meta_account_id']
            isOneToOne: false
            referencedRelation: 'meta_accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'crm_conversas_meta_account_id_fkey'
            columns: ['meta_account_id']
            isOneToOne: false
            referencedRelation: 'meta_accounts_a_vencer'
            referencedColumns: ['id']
          },
        ]
      }
      crm_mensagens: {
        Row: {
          conteudo: string | null
          conversa_id: string
          created_at: string | null
          direcao: string
          erro_msg: string | null
          id: string
          meta_data: Json | null
          meta_message_id: string | null
          status: string | null
          tipo: string | null
        }
        Insert: {
          conteudo?: string | null
          conversa_id: string
          created_at?: string | null
          direcao: string
          erro_msg?: string | null
          id?: string
          meta_data?: Json | null
          meta_message_id?: string | null
          status?: string | null
          tipo?: string | null
        }
        Update: {
          conteudo?: string | null
          conversa_id?: string
          created_at?: string | null
          direcao?: string
          erro_msg?: string | null
          id?: string
          meta_data?: Json | null
          meta_message_id?: string | null
          status?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'crm_mensagens_conversa_id_fkey'
            columns: ['conversa_id']
            isOneToOne: false
            referencedRelation: 'crm_conversas'
            referencedColumns: ['id']
          },
        ]
      }
      despesas: {
        Row: {
          categoria: string | null
          comprovante_url: string | null
          created_at: string | null
          data_despesa: string | null
          descricao: string | null
          forma_pagamento: string | null
          id: string
          registrada_por: string | null
          responsabilidade: string | null
          valor: number | null
          veiculo_id: string | null
        }
        Insert: {
          categoria?: string | null
          comprovante_url?: string | null
          created_at?: string | null
          data_despesa?: string | null
          descricao?: string | null
          forma_pagamento?: string | null
          id?: string
          registrada_por?: string | null
          responsabilidade?: string | null
          valor?: number | null
          veiculo_id?: string | null
        }
        Update: {
          categoria?: string | null
          comprovante_url?: string | null
          created_at?: string | null
          data_despesa?: string | null
          descricao?: string | null
          forma_pagamento?: string | null
          id?: string
          registrada_por?: string | null
          responsabilidade?: string | null
          valor?: number | null
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'despesas_veiculo_id_fkey'
            columns: ['veiculo_id']
            isOneToOne: false
            referencedRelation: 'veiculos'
            referencedColumns: ['id']
          },
        ]
      }
      documentos: {
        Row: {
          created_at: string | null
          id: string
          nome_documento: string | null
          tamanho: number | null
          tipo: string | null
          url_documento: string | null
          veiculo_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome_documento?: string | null
          tamanho?: number | null
          tipo?: string | null
          url_documento?: string | null
          veiculo_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nome_documento?: string | null
          tamanho?: number | null
          tipo?: string | null
          url_documento?: string | null
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'documentos_veiculo_id_fkey'
            columns: ['veiculo_id']
            isOneToOne: false
            referencedRelation: 'veiculos'
            referencedColumns: ['id']
          },
        ]
      }
      estoque_publicacoes: {
        Row: {
          created_at: string | null
          erro_msg: string | null
          id: string
          meta_account_id: string | null
          payload: Json | null
          platform: string
          post_id: string | null
          publicado_em: string | null
          status: string | null
          updated_at: string | null
          url_publicacao: string | null
          veiculo_id: string
        }
        Insert: {
          created_at?: string | null
          erro_msg?: string | null
          id?: string
          meta_account_id?: string | null
          payload?: Json | null
          platform: string
          post_id?: string | null
          publicado_em?: string | null
          status?: string | null
          updated_at?: string | null
          url_publicacao?: string | null
          veiculo_id: string
        }
        Update: {
          created_at?: string | null
          erro_msg?: string | null
          id?: string
          meta_account_id?: string | null
          payload?: Json | null
          platform?: string
          post_id?: string | null
          publicado_em?: string | null
          status?: string | null
          updated_at?: string | null
          url_publicacao?: string | null
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'estoque_publicacoes_meta_account_id_fkey'
            columns: ['meta_account_id']
            isOneToOne: false
            referencedRelation: 'meta_accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'estoque_publicacoes_meta_account_id_fkey'
            columns: ['meta_account_id']
            isOneToOne: false
            referencedRelation: 'meta_accounts_a_vencer'
            referencedColumns: ['id']
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
            foreignKeyName: 'fipe_modelos_marca_codigo_fkey'
            columns: ['marca_codigo']
            isOneToOne: false
            referencedRelation: 'fipe_marcas'
            referencedColumns: ['codigo']
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
            foreignKeyName: 'followups_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'followups_responsavel_id_fkey'
            columns: ['responsavel_id']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
        ]
      }
      hashtags: {
        Row: {
          categoria: string | null
          created_at: string | null
          id: string
          tag: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          id?: string
          tag: string
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          id?: string
          tag?: string
        }
        Relationships: []
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
            foreignKeyName: 'interacoes_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'interacoes_usuario_id_fkey'
            columns: ['usuario_id']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
        ]
      }
      internal_notes: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          lead_id: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          lead_id?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          lead_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'internal_notes_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
        ]
      }
      keywords: {
        Row: {
          categoria: string | null
          criado_em: string | null
          dificuldade: string | null
          id: string
          palavra_chave: string | null
          volume_busca: number | null
        }
        Insert: {
          categoria?: string | null
          criado_em?: string | null
          dificuldade?: string | null
          id?: string
          palavra_chave?: string | null
          volume_busca?: number | null
        }
        Update: {
          categoria?: string | null
          criado_em?: string | null
          dificuldade?: string | null
          id?: string
          palavra_chave?: string | null
          volume_busca?: number | null
        }
        Relationships: []
      }
      landing_pages: {
        Row: {
          content: Json | null
          created_at: string | null
          id: string
          meta_description: string | null
          published: boolean | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          id?: string
          meta_description?: string | null
          published?: boolean | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          id?: string
          meta_description?: string | null
          published?: boolean | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      lead_automations: {
        Row: {
          brevo_message_id: string | null
          created_at: string | null
          detalhes: Json | null
          id: string
          lead_id: string | null
          proximo_retry: string | null
          retry_count: number | null
          status: string | null
          tipo_automacao: string | null
        }
        Insert: {
          brevo_message_id?: string | null
          created_at?: string | null
          detalhes?: Json | null
          id?: string
          lead_id?: string | null
          proximo_retry?: string | null
          retry_count?: number | null
          status?: string | null
          tipo_automacao?: string | null
        }
        Update: {
          brevo_message_id?: string | null
          created_at?: string | null
          detalhes?: Json | null
          id?: string
          lead_id?: string | null
          proximo_retry?: string | null
          retry_count?: number | null
          status?: string | null
          tipo_automacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'lead_automations_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
        ]
      }
      lead_eventos_gtm: {
        Row: {
          evento_nome: string | null
          id: string
          lead_id: string | null
          propriedades: Json | null
          sincronizado_google_ads: boolean | null
          timestamp: string | null
          valor_conversao: number | null
        }
        Insert: {
          evento_nome?: string | null
          id?: string
          lead_id?: string | null
          propriedades?: Json | null
          sincronizado_google_ads?: boolean | null
          timestamp?: string | null
          valor_conversao?: number | null
        }
        Update: {
          evento_nome?: string | null
          id?: string
          lead_id?: string | null
          propriedades?: Json | null
          sincronizado_google_ads?: boolean | null
          timestamp?: string | null
          valor_conversao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'lead_eventos_gtm_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
        ]
      }
      lead_integracao_log: {
        Row: {
          acao: string | null
          ferramenta: string | null
          id: string
          lead_id: string | null
          mensagem_erro: string | null
          retry_agendado: boolean | null
          status_code: number | null
          timestamp: string | null
        }
        Insert: {
          acao?: string | null
          ferramenta?: string | null
          id?: string
          lead_id?: string | null
          mensagem_erro?: string | null
          retry_agendado?: boolean | null
          status_code?: number | null
          timestamp?: string | null
        }
        Update: {
          acao?: string | null
          ferramenta?: string | null
          id?: string
          lead_id?: string | null
          mensagem_erro?: string | null
          retry_agendado?: boolean | null
          status_code?: number | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'lead_integracao_log_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
        ]
      }
      leads: {
        Row: {
          ai_enabled: boolean | null
          brevo_contact_id: string | null
          campanha: string | null
          carro_ano: string | null
          carro_km: string | null
          carro_marca: string | null
          carro_modelo: string | null
          carro_placa: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          external_lead_id: string | null
          faixa_preco: string | null
          forma_pagamento: string | null
          google_ads_customer_id: string | null
          id: string
          nome: string
          notas_internas: string | null
          observacoes: string | null
          origem: string | null
          payment_method: string | null
          responsavel_id: string | null
          source: string | null
          source_brevo: boolean | null
          source_google_ads: boolean | null
          source_gtm: boolean | null
          status: string | null
          telefone: string | null
          temperatura: string | null
          tipo: string
          trade_in_car: string | null
          unico_dono: boolean | null
          updated_at: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          valor_veiculo: number | null
          veiculo_id: string | null
          veiculo_interesse: string | null
        }
        Insert: {
          ai_enabled?: boolean | null
          brevo_contact_id?: string | null
          campanha?: string | null
          carro_ano?: string | null
          carro_km?: string | null
          carro_marca?: string | null
          carro_modelo?: string | null
          carro_placa?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          external_lead_id?: string | null
          faixa_preco?: string | null
          forma_pagamento?: string | null
          google_ads_customer_id?: string | null
          id?: string
          nome: string
          notas_internas?: string | null
          observacoes?: string | null
          origem?: string | null
          payment_method?: string | null
          responsavel_id?: string | null
          source?: string | null
          source_brevo?: boolean | null
          source_google_ads?: boolean | null
          source_gtm?: boolean | null
          status?: string | null
          telefone?: string | null
          temperatura?: string | null
          tipo: string
          trade_in_car?: string | null
          unico_dono?: boolean | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          valor_veiculo?: number | null
          veiculo_id?: string | null
          veiculo_interesse?: string | null
        }
        Update: {
          ai_enabled?: boolean | null
          brevo_contact_id?: string | null
          campanha?: string | null
          carro_ano?: string | null
          carro_km?: string | null
          carro_marca?: string | null
          carro_modelo?: string | null
          carro_placa?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          external_lead_id?: string | null
          faixa_preco?: string | null
          forma_pagamento?: string | null
          google_ads_customer_id?: string | null
          id?: string
          nome?: string
          notas_internas?: string | null
          observacoes?: string | null
          origem?: string | null
          payment_method?: string | null
          responsavel_id?: string | null
          source?: string | null
          source_brevo?: boolean | null
          source_google_ads?: boolean | null
          source_gtm?: boolean | null
          status?: string | null
          telefone?: string | null
          temperatura?: string | null
          tipo?: string
          trade_in_car?: string | null
          unico_dono?: boolean | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          valor_veiculo?: number | null
          veiculo_id?: string | null
          veiculo_interesse?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'leads_responsavel_id_fkey'
            columns: ['responsavel_id']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leads_veiculo_id_fkey'
            columns: ['veiculo_id']
            isOneToOne: false
            referencedRelation: 'veiculos'
            referencedColumns: ['id']
          },
        ]
      }
      logs_ia: {
        Row: {
          acao: string
          alertas: Json | null
          certeza_reportada: string | null
          created_at: string
          id: string
          modelo: string
          provider: string
          status: string
          tokens_input: number | null
          tokens_output: number | null
          usuario_id: string | null
        }
        Insert: {
          acao: string
          alertas?: Json | null
          certeza_reportada?: string | null
          created_at?: string
          id?: string
          modelo: string
          provider: string
          status: string
          tokens_input?: number | null
          tokens_output?: number | null
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          alertas?: Json | null
          certeza_reportada?: string | null
          created_at?: string
          id?: string
          modelo?: string
          provider?: string
          status?: string
          tokens_input?: number | null
          tokens_output?: number | null
          usuario_id?: string | null
        }
        Relationships: []
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
      marketing_logs: {
        Row: {
          campanha_id: string | null
          created_at: string
          detalhes: Json | null
          id: string
          status: string
          tipo: string
        }
        Insert: {
          campanha_id?: string | null
          created_at?: string
          detalhes?: Json | null
          id?: string
          status: string
          tipo: string
        }
        Update: {
          campanha_id?: string | null
          created_at?: string
          detalhes?: Json | null
          id?: string
          status?: string
          tipo?: string
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          alt_text: string | null
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          folder: string | null
          height: number | null
          id: string
          mime_type: string | null
          updated_at: string
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          folder?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          folder?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
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
      meta_accounts: {
        Row: {
          access_token: string
          account_id: string
          account_name: string | null
          created_at: string | null
          id: string
          meta_data: Json | null
          phone_number_id: string | null
          platform: string
          status: string | null
          token_expires_at: string | null
          updated_at: string | null
          waba_id: string | null
        }
        Insert: {
          access_token: string
          account_id: string
          account_name?: string | null
          created_at?: string | null
          id?: string
          meta_data?: Json | null
          phone_number_id?: string | null
          platform: string
          status?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          waba_id?: string | null
        }
        Update: {
          access_token?: string
          account_id?: string
          account_name?: string | null
          created_at?: string | null
          id?: string
          meta_data?: Json | null
          phone_number_id?: string | null
          platform?: string
          status?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          waba_id?: string | null
        }
        Relationships: []
      }
      meta_webhook_logs: {
        Row: {
          created_at: string | null
          error: string | null
          event_type: string | null
          id: number
          payload: Json
          platform: string
          processed: boolean | null
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          event_type?: string | null
          id?: number
          payload: Json
          platform: string
          processed?: boolean | null
        }
        Update: {
          created_at?: string | null
          error?: string | null
          event_type?: string | null
          id?: number
          payload?: Json
          platform?: string
          processed?: boolean | null
        }
        Relationships: []
      }
      notas_fiscais: {
        Row: {
          cliente_cpf_cnpj: string | null
          cliente_nome: string | null
          cofins: number | null
          created_at: string | null
          data_venda: string | null
          icms: number | null
          id: string
          numero_nota: string | null
          pdf_url: string | null
          pis: number | null
          status: string | null
          valor_liquido: number | null
          valor_venda: number | null
          veiculo_id: string | null
        }
        Insert: {
          cliente_cpf_cnpj?: string | null
          cliente_nome?: string | null
          cofins?: number | null
          created_at?: string | null
          data_venda?: string | null
          icms?: number | null
          id?: string
          numero_nota?: string | null
          pdf_url?: string | null
          pis?: number | null
          status?: string | null
          valor_liquido?: number | null
          valor_venda?: number | null
          veiculo_id?: string | null
        }
        Update: {
          cliente_cpf_cnpj?: string | null
          cliente_nome?: string | null
          cofins?: number | null
          created_at?: string | null
          data_venda?: string | null
          icms?: number | null
          id?: string
          numero_nota?: string | null
          pdf_url?: string | null
          pis?: number | null
          status?: string | null
          valor_liquido?: number | null
          valor_venda?: number | null
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'notas_fiscais_veiculo_id_fkey'
            columns: ['veiculo_id']
            isOneToOne: false
            referencedRelation: 'veiculos'
            referencedColumns: ['id']
          },
        ]
      }
      pages: {
        Row: {
          atualizado_em: string | null
          autor_id: string | null
          canonical_url: string | null
          conteudo: string | null
          criado_em: string | null
          data_agendamento: string | null
          descricao_interna: string | null
          h1_pagina: string | null
          ia_confidence: string | null
          ia_generated: boolean | null
          id: string
          image_prompt: string | null
          imagem_destaque_url: string | null
          indice_google: boolean | null
          keyword: string | null
          meta_description: string | null
          meta_title: string | null
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
          ordem_menu: number | null
          palavras_chave_principais: Json | null
          requires_review: boolean | null
          robots_meta: string | null
          schema_markup: string | null
          slug: string
          status_publicacao: string | null
          template: string | null
          titulo: string
          url_path: string | null
          visibilidade: string | null
        }
        Insert: {
          atualizado_em?: string | null
          autor_id?: string | null
          canonical_url?: string | null
          conteudo?: string | null
          criado_em?: string | null
          data_agendamento?: string | null
          descricao_interna?: string | null
          h1_pagina?: string | null
          ia_confidence?: string | null
          ia_generated?: boolean | null
          id?: string
          image_prompt?: string | null
          imagem_destaque_url?: string | null
          indice_google?: boolean | null
          keyword?: string | null
          meta_description?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          ordem_menu?: number | null
          palavras_chave_principais?: Json | null
          requires_review?: boolean | null
          robots_meta?: string | null
          schema_markup?: string | null
          slug: string
          status_publicacao?: string | null
          template?: string | null
          titulo: string
          url_path?: string | null
          visibilidade?: string | null
        }
        Update: {
          atualizado_em?: string | null
          autor_id?: string | null
          canonical_url?: string | null
          conteudo?: string | null
          criado_em?: string | null
          data_agendamento?: string | null
          descricao_interna?: string | null
          h1_pagina?: string | null
          ia_confidence?: string | null
          ia_generated?: boolean | null
          id?: string
          image_prompt?: string | null
          imagem_destaque_url?: string | null
          indice_google?: boolean | null
          keyword?: string | null
          meta_description?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          ordem_menu?: number | null
          palavras_chave_principais?: Json | null
          requires_review?: boolean | null
          robots_meta?: string | null
          schema_markup?: string | null
          slug?: string
          status_publicacao?: string | null
          template?: string | null
          titulo?: string
          url_path?: string | null
          visibilidade?: string | null
        }
        Relationships: []
      }
      pages_versions: {
        Row: {
          acao: string | null
          autor_id: string | null
          canonical_url: string | null
          conteudo: string | null
          criado_em: string | null
          data_agendamento: string | null
          descricao_interna: string | null
          h1_pagina: string | null
          id: string
          imagem_destaque_url: string | null
          indice_google: boolean | null
          meta_description: string | null
          meta_title: string | null
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
          ordem_menu: number | null
          page_id: string
          palavras_chave_principais: Json | null
          resumo_mudancas: Json | null
          robots_meta: string | null
          schema_markup: string | null
          slug: string | null
          status_publicacao: string | null
          template: string | null
          titulo: string | null
          visibilidade: string | null
        }
        Insert: {
          acao?: string | null
          autor_id?: string | null
          canonical_url?: string | null
          conteudo?: string | null
          criado_em?: string | null
          data_agendamento?: string | null
          descricao_interna?: string | null
          h1_pagina?: string | null
          id?: string
          imagem_destaque_url?: string | null
          indice_google?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          ordem_menu?: number | null
          page_id: string
          palavras_chave_principais?: Json | null
          resumo_mudancas?: Json | null
          robots_meta?: string | null
          schema_markup?: string | null
          slug?: string | null
          status_publicacao?: string | null
          template?: string | null
          titulo?: string | null
          visibilidade?: string | null
        }
        Update: {
          acao?: string | null
          autor_id?: string | null
          canonical_url?: string | null
          conteudo?: string | null
          criado_em?: string | null
          data_agendamento?: string | null
          descricao_interna?: string | null
          h1_pagina?: string | null
          id?: string
          imagem_destaque_url?: string | null
          indice_google?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          ordem_menu?: number | null
          page_id?: string
          palavras_chave_principais?: Json | null
          resumo_mudancas?: Json | null
          robots_meta?: string | null
          schema_markup?: string | null
          slug?: string | null
          status_publicacao?: string | null
          template?: string | null
          titulo?: string | null
          visibilidade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'pages_versions_page_id_fkey'
            columns: ['page_id']
            isOneToOne: false
            referencedRelation: 'pages'
            referencedColumns: ['id']
          },
        ]
      }
      parametros_avaliacao: {
        Row: {
          ajuste_percentual: number | null
          ativo: boolean | null
          condicao: string | null
          created_at: string | null
          id: string
          parametro: string
        }
        Insert: {
          ajuste_percentual?: number | null
          ativo?: boolean | null
          condicao?: string | null
          created_at?: string | null
          id?: string
          parametro: string
        }
        Update: {
          ajuste_percentual?: number | null
          ativo?: boolean | null
          condicao?: string | null
          created_at?: string | null
          id?: string
          parametro?: string
        }
        Relationships: []
      }
      simulacoes: {
        Row: {
          cliente_cpf: string | null
          cliente_nome: string | null
          cliente_telefone: string | null
          created_at: string | null
          entrada_percentual: number | null
          id: string
          prazo_meses: number | null
          prestacao_mensal: number | null
          status: string | null
          taxa_juros: number | null
          valor_carro: number | null
          veiculo_id: string | null
        }
        Insert: {
          cliente_cpf?: string | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          created_at?: string | null
          entrada_percentual?: number | null
          id?: string
          prazo_meses?: number | null
          prestacao_mensal?: number | null
          status?: string | null
          taxa_juros?: number | null
          valor_carro?: number | null
          veiculo_id?: string | null
        }
        Update: {
          cliente_cpf?: string | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          created_at?: string | null
          entrada_percentual?: number | null
          id?: string
          prazo_meses?: number | null
          prestacao_mensal?: number | null
          status?: string | null
          taxa_juros?: number | null
          valor_carro?: number | null
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'simulacoes_veiculo_id_fkey'
            columns: ['veiculo_id']
            isOneToOne: false
            referencedRelation: 'veiculos'
            referencedColumns: ['id']
          },
        ]
      }
      site_banners: {
        Row: {
          ativo: boolean | null
          botao_link: string | null
          botao_texto: string | null
          created_at: string | null
          id: string
          imagem_url: string | null
          ordem: number | null
          texto: string | null
          titulo: string | null
        }
        Insert: {
          ativo?: boolean | null
          botao_link?: string | null
          botao_texto?: string | null
          created_at?: string | null
          id?: string
          imagem_url?: string | null
          ordem?: number | null
          texto?: string | null
          titulo?: string | null
        }
        Update: {
          ativo?: boolean | null
          botao_link?: string | null
          botao_texto?: string | null
          created_at?: string | null
          id?: string
          imagem_url?: string | null
          ordem?: number | null
          texto?: string | null
          titulo?: string | null
        }
        Relationships: []
      }
      site_configuracoes: {
        Row: {
          chave: string
          id: string
          updated_at: string | null
          valor: Json | null
        }
        Insert: {
          chave: string
          id?: string
          updated_at?: string | null
          valor?: Json | null
        }
        Update: {
          chave?: string
          id?: string
          updated_at?: string | null
          valor?: Json | null
        }
        Relationships: []
      }
      site_depoimentos: {
        Row: {
          created_at: string | null
          estrelas: number | null
          foto_url: string | null
          id: string
          nome_cliente: string | null
          publicado: boolean | null
          texto: string | null
          tipo: string | null
          verificado: boolean | null
        }
        Insert: {
          created_at?: string | null
          estrelas?: number | null
          foto_url?: string | null
          id?: string
          nome_cliente?: string | null
          publicado?: boolean | null
          texto?: string | null
          tipo?: string | null
          verificado?: boolean | null
        }
        Update: {
          created_at?: string | null
          estrelas?: number | null
          foto_url?: string | null
          id?: string
          nome_cliente?: string | null
          publicado?: boolean | null
          texto?: string | null
          tipo?: string | null
          verificado?: boolean | null
        }
        Relationships: []
      }
      social_comments: {
        Row: {
          comment_id: string
          created_at: string
          from_id: string
          from_name: string
          id: string
          is_replied: boolean | null
          message: string
          platform: string
          post_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          from_id: string
          from_name: string
          id?: string
          is_replied?: boolean | null
          message: string
          platform: string
          post_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          from_id?: string
          from_name?: string
          id?: string
          is_replied?: boolean | null
          message?: string
          platform?: string
          post_id?: string
        }
        Relationships: []
      }
      social_configuracoes: {
        Row: {
          ai_system_prompt: string | null
          created_at: string | null
          facebook_page_id: string | null
          facebook_token: string | null
          id: string
          instagram_token: string | null
          updated_at: string | null
          whatsapp_number: string | null
        }
        Insert: {
          ai_system_prompt?: string | null
          created_at?: string | null
          facebook_page_id?: string | null
          facebook_token?: string | null
          id?: string
          instagram_token?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          ai_system_prompt?: string | null
          created_at?: string | null
          facebook_page_id?: string | null
          facebook_token?: string | null
          id?: string
          instagram_token?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          criado_em: string | null
          data_agendamento: string | null
          id: string
          imagem: string | null
          redes: Json
          status: string | null
          texto: string | null
          veiculo_id: string | null
        }
        Insert: {
          criado_em?: string | null
          data_agendamento?: string | null
          id?: string
          imagem?: string | null
          redes: Json
          status?: string | null
          texto?: string | null
          veiculo_id?: string | null
        }
        Update: {
          criado_em?: string | null
          data_agendamento?: string | null
          id?: string
          imagem?: string | null
          redes?: Json
          status?: string | null
          texto?: string | null
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'social_posts_veiculo_id_fkey'
            columns: ['veiculo_id']
            isOneToOne: false
            referencedRelation: 'veiculos'
            referencedColumns: ['id']
          },
        ]
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
          categoria_sintetica: string | null
          chassi: string | null
          chassi_completo: string | null
          cliques_whatsapp: number | null
          combustivel: string | null
          combustivel_sintetico: string | null
          cor: string | null
          created_at: string | null
          descricao: string | null
          destaque: boolean | null
          diferenciais: Json | null
          exibir_no_site: boolean | null
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
          proprietario_bairro: string | null
          proprietario_cep: string | null
          proprietario_cidade: string | null
          proprietario_complemento: string | null
          proprietario_cpf: string | null
          proprietario_data_nascimento: string | null
          proprietario_email: string | null
          proprietario_estado: string | null
          proprietario_idade: string | null
          proprietario_logradouro: string | null
          proprietario_mae: string | null
          proprietario_nome: string | null
          proprietario_numero: string | null
          proprietario_rg: string | null
          proprietario_sexo: string | null
          proprietario_situacao_receita: string | null
          proprietario_situacao_receita_data: string | null
          proprietario_telefone: string | null
          proprietario_telefone_residencial: string | null
          proprietario_telefone_trabalho: string | null
          publicado_icarros: boolean | null
          publicado_mercadolivre: boolean | null
          publicado_napista: boolean | null
          publicado_olx: boolean | null
          publicado_webmotors: boolean | null
          qrcode_url: string | null
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
          categoria_sintetica?: string | null
          chassi?: string | null
          chassi_completo?: string | null
          cliques_whatsapp?: number | null
          combustivel?: string | null
          combustivel_sintetico?: string | null
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          destaque?: boolean | null
          diferenciais?: Json | null
          exibir_no_site?: boolean | null
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
          proprietario_bairro?: string | null
          proprietario_cep?: string | null
          proprietario_cidade?: string | null
          proprietario_complemento?: string | null
          proprietario_cpf?: string | null
          proprietario_data_nascimento?: string | null
          proprietario_email?: string | null
          proprietario_estado?: string | null
          proprietario_idade?: string | null
          proprietario_logradouro?: string | null
          proprietario_mae?: string | null
          proprietario_nome?: string | null
          proprietario_numero?: string | null
          proprietario_rg?: string | null
          proprietario_sexo?: string | null
          proprietario_situacao_receita?: string | null
          proprietario_situacao_receita_data?: string | null
          proprietario_telefone?: string | null
          proprietario_telefone_residencial?: string | null
          proprietario_telefone_trabalho?: string | null
          publicado_icarros?: boolean | null
          publicado_mercadolivre?: boolean | null
          publicado_napista?: boolean | null
          publicado_olx?: boolean | null
          publicado_webmotors?: boolean | null
          qrcode_url?: string | null
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
          categoria_sintetica?: string | null
          chassi?: string | null
          chassi_completo?: string | null
          cliques_whatsapp?: number | null
          combustivel?: string | null
          combustivel_sintetico?: string | null
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          destaque?: boolean | null
          diferenciais?: Json | null
          exibir_no_site?: boolean | null
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
          proprietario_bairro?: string | null
          proprietario_cep?: string | null
          proprietario_cidade?: string | null
          proprietario_complemento?: string | null
          proprietario_cpf?: string | null
          proprietario_data_nascimento?: string | null
          proprietario_email?: string | null
          proprietario_estado?: string | null
          proprietario_idade?: string | null
          proprietario_logradouro?: string | null
          proprietario_mae?: string | null
          proprietario_nome?: string | null
          proprietario_numero?: string | null
          proprietario_rg?: string | null
          proprietario_sexo?: string | null
          proprietario_situacao_receita?: string | null
          proprietario_situacao_receita_data?: string | null
          proprietario_telefone?: string | null
          proprietario_telefone_residencial?: string | null
          proprietario_telefone_trabalho?: string | null
          publicado_icarros?: boolean | null
          publicado_mercadolivre?: boolean | null
          publicado_napista?: boolean | null
          publicado_olx?: boolean | null
          publicado_webmotors?: boolean | null
          qrcode_url?: string | null
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
            foreignKeyName: 'veiculos_responsavel_id_fkey'
            columns: ['responsavel_id']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
        ]
      }
      veiculos_cache: {
        Row: {
          ano_fab: string | null
          ano_modelo: string | null
          categoria: string | null
          categoria_sintetica: string | null
          chassi: string | null
          chassi_completo: string | null
          codigo_fipe: string | null
          combustivel: string | null
          combustivel_sintetico: string | null
          cor: string | null
          created_at: string
          historico_fipe: Json | null
          marca: string | null
          mes_referencia: string | null
          modelo: string | null
          placa: string
          preco_fipe: number | null
          renavam: string | null
          updated_at: string
          url_fipe: string | null
        }
        Insert: {
          ano_fab?: string | null
          ano_modelo?: string | null
          categoria?: string | null
          categoria_sintetica?: string | null
          chassi?: string | null
          chassi_completo?: string | null
          codigo_fipe?: string | null
          combustivel?: string | null
          combustivel_sintetico?: string | null
          cor?: string | null
          created_at?: string
          historico_fipe?: Json | null
          marca?: string | null
          mes_referencia?: string | null
          modelo?: string | null
          placa: string
          preco_fipe?: number | null
          renavam?: string | null
          updated_at?: string
          url_fipe?: string | null
        }
        Update: {
          ano_fab?: string | null
          ano_modelo?: string | null
          categoria?: string | null
          categoria_sintetica?: string | null
          chassi?: string | null
          chassi_completo?: string | null
          codigo_fipe?: string | null
          combustivel?: string | null
          combustivel_sintetico?: string | null
          cor?: string | null
          created_at?: string
          historico_fipe?: Json | null
          marca?: string | null
          mes_referencia?: string | null
          modelo?: string | null
          placa?: string
          preco_fipe?: number | null
          renavam?: string | null
          updated_at?: string
          url_fipe?: string | null
        }
        Relationships: []
      }
      whatsapp_templates: {
        Row: {
          categoria: string
          corpo: string | null
          created_at: string | null
          id: string
          idioma: string | null
          meta_account_id: string | null
          meta_data: Json | null
          nome: string
          status: string | null
          variaveis: Json | null
        }
        Insert: {
          categoria: string
          corpo?: string | null
          created_at?: string | null
          id?: string
          idioma?: string | null
          meta_account_id?: string | null
          meta_data?: Json | null
          nome: string
          status?: string | null
          variaveis?: Json | null
        }
        Update: {
          categoria?: string
          corpo?: string | null
          created_at?: string | null
          id?: string
          idioma?: string | null
          meta_account_id?: string | null
          meta_data?: Json | null
          nome?: string
          status?: string | null
          variaveis?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: 'whatsapp_templates_meta_account_id_fkey'
            columns: ['meta_account_id']
            isOneToOne: false
            referencedRelation: 'meta_accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'whatsapp_templates_meta_account_id_fkey'
            columns: ['meta_account_id']
            isOneToOne: false
            referencedRelation: 'meta_accounts_a_vencer'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      meta_accounts_a_vencer: {
        Row: {
          account_name: string | null
          id: string | null
          platform: string | null
          tempo_restante: string | null
          token_expires_at: string | null
        }
        Insert: {
          account_name?: string | null
          id?: string | null
          platform?: string | null
          tempo_restante?: never
          token_expires_at?: string | null
        }
        Update: {
          account_name?: string | null
          id?: string | null
          platform?: string | null
          tempo_restante?: never
          token_expires_at?: string | null
        }
        Relationships: []
      }
      vw_crm_dashboard: {
        Row: {
          abertas: number | null
          fechadas: number | null
          msg_hoje: number | null
          platform: string | null
          sem_vendedor: number | null
          ultima_hora: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_or_create_conversa: {
        Args: {
          p_cliente_id_externo?: string
          p_cliente_nome?: string
          p_cliente_telefone: string
          p_meta_account_id: string
          p_platform: string
        }
        Returns: string
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
