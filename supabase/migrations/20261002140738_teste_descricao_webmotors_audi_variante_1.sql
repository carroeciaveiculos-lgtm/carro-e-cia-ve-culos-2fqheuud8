-- TESTE (02/10/2026): descobrir qual trecho do texto do Audi a Webmotors oculta na página.
-- Texto original (restaurar depois): Audi A3 Sedan Ambition 2.0 2015/2016. Laudo cautelar aprovado. Vários Upgrades!!! Chama que eu te passo tudo. Você vai se surpreender!
-- Variante 1: sem "!!!", sem "Chama que eu te passo tudo" e sem "Você vai se surpreender!".
-- Decisão da Adriana (02/10/2026): MANTER a versão limpa.
UPDATE public.veiculos
SET descricao_webmotors = 'Audi A3 Sedan Ambition 2.0 2015/2016. Laudo cautelar aprovado. Vários upgrades.'
WHERE id = '6726501e-c879-4e92-a1b4-63f05f6c82b1';
