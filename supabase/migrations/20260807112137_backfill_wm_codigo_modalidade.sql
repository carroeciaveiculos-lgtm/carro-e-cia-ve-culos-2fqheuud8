-- Backfill do CodigoModalidade "Anúncio Básico" (2943, confirmado via
-- ObterModalidade em 07/08/2026) para veículos que já estavam com status
-- 'mapeado' antes da correção que passou a exigir esse código no guard de
-- wm-sync. Sem isso, esses veículos ficariam bloqueados até alguém rodar
-- wm-mapear-veiculo de novo para cada um.
UPDATE public.wm_mapeamento_veiculos
SET codigo_modalidade_wm = '2943'
WHERE status_sincronizacao = 'mapeado'
  AND codigo_modalidade_wm IS NULL;
