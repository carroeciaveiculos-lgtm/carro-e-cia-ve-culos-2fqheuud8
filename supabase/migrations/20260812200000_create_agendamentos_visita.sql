-- Fase 2 do projeto "Clara ponta a ponta" (12/08/2026, ver docs/leads-e-sdr.md
-- e o plano aprovado da sessão). Não existia nenhuma tabela pra agendamento de
-- visita/test-drive/avaliação presencial de comprador — a tabela `avaliacoes`
-- já existente é sobre outro processo (avaliação de veículo do CLIENTE pra
-- consignação/troca), não confundir. `agendar_test_drive` estava declarada
-- pro Gemini desde antes mas nunca gravava nada em lugar nenhum.
CREATE TABLE IF NOT EXISTS public.agendamentos_visita (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    veiculo_id UUID REFERENCES public.veiculos(id),
    data_hora TIMESTAMPTZ NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'visita', -- 'visita' | 'avaliacao'
    status TEXT NOT NULL DEFAULT 'agendado', -- 'agendado' | 'realizado' | 'cancelado' | 'nao_compareceu'
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agendamentos_visita ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_auth_all_agendamentos_visita" ON public.agendamentos_visita;
CREATE POLICY "allow_auth_all_agendamentos_visita" ON public.agendamentos_visita
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- service_role (usado pelas edge functions, inclusive a Clara) já tem acesso
-- irrestrito por padrão no Supabase, sem precisar de policy extra.
