-- Investigacao do erro persistente 43|36 ("Anuncio nao pode ser alterado")
-- no HR-V (PZQ2F46, anuncio real 73668233): achado que wm_mapeamento_veiculos
-- tinha codigo_modalidade_wm='6914' (VIP) para esse veiculo, mas nenhum
-- codigo atual escreve esse valor (wm-mapear-veiculo sempre grava Basico via
-- obterCodigoModalidadeBasico()) -- e a cota VIP real (ObterModalidade) so
-- mostra 1 uso, do Jeep Compass (QUK1J80), confirmando que o anuncio do HR-V
-- nao e VIP de verdade. Corrige pra 6351 (Basico) e marca a publicacao pra
-- reprocessar. RESULTADO: testado ao vivo depois (wm-sync real) -- corrigiu
-- o CodigoModalidade enviado, mas o erro 43|36 PERSISTIU. Ou seja, a
-- modalidade errada era um bug real (e ficou corrigido), mas NAO era a causa
-- raiz do 43|36 -- essa segue sem explicacao via nossos dados, indicando
-- travamento do lado da Webmotors nesse anuncio especifico.
UPDATE public.wm_mapeamento_veiculos
SET codigo_modalidade_wm = '6351'
WHERE veiculo_id = (SELECT id FROM public.veiculos WHERE placa = 'PZQ2F46');

UPDATE public.estoque_publicacoes
SET status = 'pending_update', erro_msg = 'Modalidade corrigida (era 6914/VIP indevido, voltou pra 6351/Básico) — aguardando novo AlterarCarro', updated_at = now()
WHERE veiculo_id = (SELECT id FROM public.veiculos WHERE placa = 'PZQ2F46')
  AND platform = 'webmotors';
