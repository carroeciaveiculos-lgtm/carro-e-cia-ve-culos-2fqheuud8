ALTER TABLE public.veiculos
ADD COLUMN IF NOT EXISTS proprietario_email TEXT,
ADD COLUMN IF NOT EXISTS proprietario_cpf TEXT;

CREATE TABLE IF NOT EXISTS public.contratos_consignacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    veiculo_id UUID REFERENCES public.veiculos(id) ON DELETE SET NULL,
    proprietario_nome TEXT,
    proprietario_email TEXT,
    proprietario_cpf TEXT,
    proprietario_telefone TEXT,
    numero_contrato TEXT,
    assinatura_link TEXT,
    assinatura_id_externo TEXT,
    assinatura_status TEXT DEFAULT 'nao_enviado',
    assinatura_data TIMESTAMPTZ,
    pdf_url TEXT,
    pdf_assinado_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assinatura_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrato_id UUID REFERENCES public.contratos_consignacao(id) ON DELETE CASCADE,
    evento TEXT NOT NULL,
    detalhes JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.contratos_consignacao ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_auth_all_contratos_consignacao" ON public.contratos_consignacao;
CREATE POLICY "allow_auth_all_contratos_consignacao" ON public.contratos_consignacao FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.assinatura_historico ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_auth_all_assinatura_historico" ON public.assinatura_historico;
CREATE POLICY "allow_auth_all_assinatura_historico" ON public.assinatura_historico FOR ALL TO authenticated USING (true) WITH CHECK (true);
