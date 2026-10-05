-- Fotos com marca de IA (04/10/2026): o Galaxy AI (Samsung, "Photo assist") grava uma marca d'água visível "Conteúdo gerado por IA" nos pixels e Credenciais de Conteúdo (C2PA) nos metadados.
-- Esta tabela guarda o resultado da verificação por foto (detecção pelos metadados) para o carrossel só usar fotos limpas e para o relatório da aba "Fotos".
CREATE TABLE IF NOT EXISTS public.veiculo_fotos_ia (
  url text PRIMARY KEY,
  veiculo_id uuid REFERENCES public.veiculos(id) ON DELETE CASCADE,
  marcada boolean NOT NULL,
  verificada_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS veiculo_fotos_ia_veiculo_idx ON public.veiculo_fotos_ia (veiculo_id);

ALTER TABLE public.veiculo_fotos_ia ENABLE ROW LEVEL SECURITY;
-- Equipe logada no painel (mesmo padrão das tabelas sociais). As functions usam a chave de serviço.
CREATE POLICY allow_all_veiculo_fotos_ia ON public.veiculo_fotos_ia FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Quantas fotos do post têm marca de IA (NULL = não verificado, posts antigos). Mostrado no cartão de aprovação.
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS fotos_marcadas_ia integer;
