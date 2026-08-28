-- RMP8G90 webmotors: 2 linhas, mesmo post_id (77539036), mesmo status
-- (despublicado) -- duplicata segura de linha.
WITH d1 AS (
  SELECT ep.id, row_number() OVER (ORDER BY ep.updated_at DESC) AS rn
  FROM public.estoque_publicacoes ep
  WHERE ep.veiculo_id = (SELECT id FROM public.veiculos WHERE placa='RMP8G90') AND ep.platform='webmotors'
)
DELETE FROM public.estoque_publicacoes WHERE id IN (SELECT id FROM d1 WHERE rn > 1);

-- PUQ3A75 webmotors: 4 linhas -- 3 identicas (publicado, post_id 78447550)
-- + 1 antiga (error, sem post_id, de antes do anuncio existir). Mantem so a
-- mais recente das 'publicado'.
WITH d2 AS (
  SELECT ep.id, row_number() OVER (ORDER BY ep.updated_at DESC) AS rn
  FROM public.estoque_publicacoes ep
  WHERE ep.veiculo_id = (SELECT id FROM public.veiculos WHERE placa='PUQ3A75') AND ep.platform='webmotors'
    AND ep.post_id = '78447550'
)
DELETE FROM public.estoque_publicacoes WHERE id IN (SELECT id FROM d2 WHERE rn > 1);

DELETE FROM public.estoque_publicacoes
WHERE veiculo_id = (SELECT id FROM public.veiculos WHERE placa='PUQ3A75') AND platform='webmotors' AND post_id IS NULL;
