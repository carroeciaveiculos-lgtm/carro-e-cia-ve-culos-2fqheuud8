DO $$
BEGIN
    ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS proprietario_rg TEXT;
    ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS proprietario_data_nascimento TEXT;
    ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS proprietario_idade TEXT;
    ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS proprietario_sexo TEXT;
    ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS proprietario_mae TEXT;
    ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS proprietario_situacao_receita TEXT;
    ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS proprietario_situacao_receita_data TEXT;
END $$;

CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cpf TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    rg TEXT,
    email TEXT,
    telefone TEXT,
    data_nascimento TEXT,
    idade TEXT,
    sexo TEXT,
    nome_mae TEXT,
    situacao_receita TEXT,
    situacao_receita_data TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_auth_all_clientes" ON public.clientes;
CREATE POLICY "allow_auth_all_clientes" ON public.clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.veiculos_cache (
    placa TEXT PRIMARY KEY,
    chassi TEXT,
    renavam TEXT,
    marca TEXT,
    modelo TEXT,
    ano_fab TEXT,
    ano_modelo TEXT,
    combustivel TEXT,
    cor TEXT,
    preco_fipe NUMERIC,
    mes_referencia TEXT,
    codigo_fipe TEXT,
    url_fipe TEXT,
    historico_fipe JSONB,
    categoria TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.veiculos_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_auth_all_veiculos_cache" ON public.veiculos_cache;
CREATE POLICY "allow_auth_all_veiculos_cache" ON public.veiculos_cache FOR ALL TO authenticated USING (true) WITH CHECK (true);
