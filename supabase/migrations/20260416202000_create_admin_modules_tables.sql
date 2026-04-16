-- Avaliações
CREATE TABLE IF NOT EXISTS public.avaliacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id),
    cliente_nome TEXT,
    cliente_telefone TEXT,
    data_avaliacao TIMESTAMPTZ,
    placa_veiculo TEXT,
    marca TEXT,
    modelo TEXT,
    ano TEXT,
    valor_fipe NUMERIC,
    valor_avaliado NUMERIC,
    preco_consignacao NUMERIC,
    margem_esperada NUMERIC,
    condicao_geral TEXT,
    quilometragem INTEGER,
    observacoes TEXT,
    status TEXT DEFAULT 'Agendada',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.parametros_avaliacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parametro TEXT NOT NULL,
    condicao TEXT,
    ajuste_percentual NUMERIC,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site
CREATE TABLE IF NOT EXISTS public.site_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT,
    imagem_url TEXT,
    texto TEXT,
    botao_texto TEXT,
    botao_link TEXT,
    ativo BOOLEAN DEFAULT true,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.site_depoimentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_cliente TEXT,
    foto_url TEXT,
    texto TEXT,
    estrelas INTEGER DEFAULT 5,
    tipo TEXT,
    publicado BOOLEAN DEFAULT false,
    verificado BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.site_configuracoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chave TEXT UNIQUE NOT NULL,
    valor JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Financiamento
CREATE TABLE IF NOT EXISTS public.simulacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_nome TEXT,
    cliente_telefone TEXT,
    cliente_cpf TEXT,
    valor_carro NUMERIC,
    entrada_percentual NUMERIC,
    prazo_meses INTEGER,
    taxa_juros NUMERIC,
    prestacao_mensal NUMERIC,
    status TEXT DEFAULT 'Pendente',
    veiculo_id UUID REFERENCES public.veiculos(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Administrativo
CREATE TABLE IF NOT EXISTS public.despesas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria TEXT,
    descricao TEXT,
    valor NUMERIC,
    data_despesa DATE,
    forma_pagamento TEXT,
    comprovante_url TEXT,
    registrada_por UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notas_fiscais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_nota TEXT,
    cliente_nome TEXT,
    cliente_cpf_cnpj TEXT,
    veiculo_id UUID REFERENCES public.veiculos(id),
    data_venda DATE,
    valor_venda NUMERIC,
    icms NUMERIC,
    pis NUMERIC,
    cofins NUMERIC,
    valor_liquido NUMERIC,
    status TEXT DEFAULT 'Emitida',
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.documentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_documento TEXT,
    tipo TEXT,
    url_documento TEXT,
    veiculo_id UUID REFERENCES public.veiculos(id),
    tamanho INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Fixes
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_auth_all_avaliacoes" ON public.avaliacoes;
CREATE POLICY "allow_auth_all_avaliacoes" ON public.avaliacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.parametros_avaliacao ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_auth_all_parametros" ON public.parametros_avaliacao;
CREATE POLICY "allow_auth_all_parametros" ON public.parametros_avaliacao FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.site_banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_banners_select" ON public.site_banners;
CREATE POLICY "allow_all_banners_select" ON public.site_banners FOR SELECT USING (true);
DROP POLICY IF EXISTS "allow_auth_banners_all" ON public.site_banners;
CREATE POLICY "allow_auth_banners_all" ON public.site_banners FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.site_depoimentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_depoimentos_select" ON public.site_depoimentos;
CREATE POLICY "allow_all_depoimentos_select" ON public.site_depoimentos FOR SELECT USING (true);
DROP POLICY IF EXISTS "allow_auth_depoimentos_all" ON public.site_depoimentos;
CREATE POLICY "allow_auth_depoimentos_all" ON public.site_depoimentos FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.site_configuracoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_configuracoes_select" ON public.site_configuracoes;
CREATE POLICY "allow_all_configuracoes_select" ON public.site_configuracoes FOR SELECT USING (true);
DROP POLICY IF EXISTS "allow_auth_configuracoes_all" ON public.site_configuracoes;
CREATE POLICY "allow_auth_configuracoes_all" ON public.site_configuracoes FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.simulacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_anon_insert_simulacoes" ON public.simulacoes;
CREATE POLICY "allow_anon_insert_simulacoes" ON public.simulacoes FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "allow_auth_all_simulacoes" ON public.simulacoes;
CREATE POLICY "allow_auth_all_simulacoes" ON public.simulacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_auth_all_despesas" ON public.despesas;
CREATE POLICY "allow_auth_all_despesas" ON public.despesas FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_auth_all_notas_fiscais" ON public.notas_fiscais;
CREATE POLICY "allow_auth_all_notas_fiscais" ON public.notas_fiscais FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_auth_all_documentos" ON public.documentos;
CREATE POLICY "allow_auth_all_documentos" ON public.documentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
