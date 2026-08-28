-- Achado 28/08/2026: Adriana conferiu ao vivo na Webmotors que o anuncio
-- real do Jeep Compass QUK1J80 esta em VIP (Super Acelerador Vip - M, 6914),
-- nao em Basico (6351) como nosso wm_mapeamento_veiculos registrava desde
-- 10/08/2026. O doc de 27/08/2026 ja tinha flagrado isso ao cruzar
-- ObterModalidade+ObterEstoqueAtual (1/2 vagas VIP usadas pelo Compass), mas
-- o registro nunca foi corrigido. Sem essa correcao, uma futura edicao de
-- preco/km desse veiculo dispararia AlterarCarro com CodigoModalidade=6351
-- (errado), arriscando reverter o anuncio real de VIP pra Basico sem querer.
UPDATE public.wm_mapeamento_veiculos
SET codigo_modalidade_wm = '6914'
WHERE veiculo_id = '49a43979-88d7-459c-bdf1-fe2e10fd5fe3'
  AND codigo_modalidade_wm = '6351';
