-- PASSO 2 de 2 — padroniza TODAS as cores do estoque no masculino (rode só
-- depois de conferir o PASSO 1: cor "Preto" e pubs = 0 no veículo de teste).
-- Resolve as 10 grafias hoje no banco (BRANCA, Branca, PRETA, preto, Branco...)
-- para: Branco, Preto, Prata, Cinza, Azul. Mesma suspensão de gatilhos do
-- PASSO 1, só dentro da transação (explicação lá).
--
-- Antes: BRANCA 16, PRETA 11, CINZA 10, PRATA 8, PRETO 3, BRANCO 2, Branca 2,
--        AZUL 2, Branco 1, preto 1.
-- Depois: Branco 21, Preto 15, Cinza 10, Prata 8, Azul 2.

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
  AND v.cor <> m.novo;

COMMIT;

-- CONFERÊNCIA: só podem aparecer Branco, Preto, Prata, Cinza e Azul.
SELECT cor, count(*) AS qtd FROM public.veiculos GROUP BY cor ORDER BY qtd DESC;
