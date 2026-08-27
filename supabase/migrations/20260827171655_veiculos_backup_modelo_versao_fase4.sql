-- Fase 4 do plano de corte Modelo/Versao: backup do Modelo/Versao atual
-- dos 26 veiculos ativos ANTES de sobrescrever qualquer coisa. So leitura +
-- insercao numa tabela nova, nao toca em public.veiculos.
CREATE TABLE IF NOT EXISTS public.veiculos_modelo_versao_backup_fase4 (
  veiculo_id uuid PRIMARY KEY REFERENCES public.veiculos(id),
  placa text,
  modelo_original text,
  versao_original text,
  backed_up_at timestamptz DEFAULT now()
);

ALTER TABLE public.veiculos_modelo_versao_backup_fase4 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access_veiculos_backup_fase4" ON public.veiculos_modelo_versao_backup_fase4;
CREATE POLICY "service_role_full_access_veiculos_backup_fase4"
  ON public.veiculos_modelo_versao_backup_fase4 FOR ALL TO service_role USING (true) WITH CHECK (true);

INSERT INTO public.veiculos_modelo_versao_backup_fase4 (veiculo_id, placa, modelo_original, versao_original)
SELECT id, placa, modelo, versao
FROM public.veiculos
WHERE status = 'disponivel'
ON CONFLICT (veiculo_id) DO NOTHING;
