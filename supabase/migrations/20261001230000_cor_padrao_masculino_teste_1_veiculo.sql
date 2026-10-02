-- PASSO 1 de 2 — TESTE EM 1 VEÍCULO da padronização de cor para o masculino
-- (regra da Adriana, 01/10/2026: sempre "Preto"/"Branco", nunca "Preta"/"Branca").
--
-- Por que existe o teste: os gatilhos trigger_ml_sync_veiculos (reage a mudança
-- de cor) e trigger_wm_sync_veiculos (reage a qualquer UPDATE) reenviam o veículo
-- aos portais. Aqui eles ficam suspensos SÓ dentro desta transação
-- (session_replication_role = replica). Mercado Livre e Webmotors já publicam a
-- cor no masculino, então nenhum anúncio muda — só o nosso banco fica limpo.
-- Veículo de teste: FDL2J11 (devolvido, sem nenhuma publicação).
--
-- Como rodar: SQL Editor do Supabase, abrindo este arquivo pelo Bloco de Notas.
-- Depois rode a conferência (final do arquivo) e só então o PASSO 2.

BEGIN;

SET LOCAL session_replication_role = 'replica';

UPDATE public.veiculos v
SET cor = m.novo
FROM (VALUES
  ('branca', 'Branco'), ('branco', 'Branco'),
  ('preta', 'Preto'), ('preto', 'Preto'),
  ('prata', 'Prata'), ('cinza', 'Cinza'), ('azul', 'Azul')
) AS m(chave, novo)
WHERE lower(trim(v.cor)) = m.chave
  AND v.cor <> m.novo
  AND v.id = '0fb53974-e00a-4732-825c-196aa019dc6d';

COMMIT;

-- CONFERÊNCIA (rode depois): a cor deve estar "Preto" e NÃO pode ter surgido
-- nenhuma publicação nova pra esse veículo (resultado esperado: pubs = 0).
SELECT v.placa, v.cor, v.status,
       (SELECT count(*) FROM public.estoque_publicacoes p WHERE p.veiculo_id = v.id) AS pubs
FROM public.veiculos v
WHERE v.id = '0fb53974-e00a-4732-825c-196aa019dc6d';
