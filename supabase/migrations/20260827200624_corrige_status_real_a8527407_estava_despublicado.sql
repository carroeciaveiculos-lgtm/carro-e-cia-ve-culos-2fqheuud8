-- Correcao de um erro meu: a migracao anterior
-- (corrige_status_real_sw4_2017_napista_republicado) atualizou por
-- veiculo_id+platform sem filtrar pelo post_id, e marcou 'publicado' as 3
-- linhas de estoque_publicacoes do NaPista pra esse carro -- mas checagem
-- real (GET por offer_id) mostrou que so 2 das 3 estao de fato PUBLISHED
-- (09fdf129... e 6842bee7..., duplicatas ao vivo no NaPista) e a terceira
-- (a8527407...) esta genuinamente UNPUBLISHED. Corrige so essa linha.
UPDATE public.estoque_publicacoes
SET status = 'despublicado', updated_at = now()
WHERE post_id = 'a8527407-40bd-44c8-abe0-3b16d6d0a9e7' AND platform = 'napista';
