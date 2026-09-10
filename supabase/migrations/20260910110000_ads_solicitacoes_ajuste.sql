-- Fila de aprovacao pra ajuste de anuncios (Meta primeiro, decisao da
-- Adriana em 10/09/2026: nenhum ajuste de orcamento/status deve ir direto
-- pra API, sempre passa por essa fila antes). O botao "Aprovar" na tela
-- e' o que efetivamente dispara a chamada real pra plataforma -- criar a
-- solicitacao aqui NUNCA chama a API de anuncios.
CREATE TABLE IF NOT EXISTS public.ads_solicitacoes_ajuste (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plataforma TEXT NOT NULL CHECK (plataforma IN ('meta', 'google')),
  tipo_ajuste TEXT NOT NULL CHECK (tipo_ajuste IN ('orcamento', 'status')),
  campanha_id TEXT NOT NULL,
  campanha_nome TEXT,
  valor_atual JSONB,
  valor_novo JSONB NOT NULL,
  origem TEXT NOT NULL DEFAULT 'manual' CHECK (origem IN ('manual', 'agente_ia')),
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'aplicado', 'rejeitado', 'erro')),
  solicitado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  solicitado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decidido_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  decidido_em TIMESTAMPTZ,
  resultado_api JSONB,
  erro TEXT
);

ALTER TABLE public.ads_solicitacoes_ajuste ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_auth_all_ads_solicitacoes_ajuste" ON public.ads_solicitacoes_ajuste;
CREATE POLICY "allow_auth_all_ads_solicitacoes_ajuste" ON public.ads_solicitacoes_ajuste
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
