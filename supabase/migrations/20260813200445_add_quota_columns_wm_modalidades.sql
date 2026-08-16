-- Cota real por modalidade (pedido da Adriana, 13/08/2026): "isso precisa
-- estar alinhado com o nosso portal". Valores iniciais vieram de ObterModalidade
-- consultado ao vivo contra a conta de produção — atualizados de novo por
-- wm-catalog-fetch (manual) e no início de cada rodada do wm-sync (automático).
ALTER TABLE wm_modalidades ADD COLUMN IF NOT EXISTS quantidade_total integer;
ALTER TABLE wm_modalidades ADD COLUMN IF NOT EXISTS quantidade_usados integer;
ALTER TABLE wm_modalidades ADD COLUMN IF NOT EXISTS atualizado_em timestamptz;

UPDATE wm_modalidades SET quantidade_total = 20, quantidade_usados = 17, atualizado_em = now() WHERE codigo_wm = '6351';
UPDATE wm_modalidades SET quantidade_total = 2, quantidade_usados = 2, atualizado_em = now() WHERE codigo_wm = '6914';
