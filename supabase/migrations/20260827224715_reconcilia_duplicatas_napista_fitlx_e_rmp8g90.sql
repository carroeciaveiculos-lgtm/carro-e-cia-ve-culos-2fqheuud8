-- Fit LX (PUQ3A75): 3 linhas napista com 3 ofertas REAIS diferentes.
-- Checagem ao vivo: ef397293 = PUBLISHED, 9c44eba2 (a que a tabela de
-- mapeamento apontava como oficial) = UNPUBLISHED, 7e702358 = PUBLISHED
-- (2 duplicatas vivas). Fechada 7e702358 de verdade (UNPUBLISHED,
-- confirmado). Mantem ef397293 como oferta oficial (a que o sistema vinha
-- tratando como atual a sessao toda) e corrige o ponteiro do mapeamento.
UPDATE public.napista_mapeamento_veiculos
SET napista_offer_id = 'ef397293-4cf4-4a7c-a891-5454fcb78bbd'
WHERE veiculo_id = (SELECT id FROM public.veiculos WHERE placa = 'PUQ3A75');

UPDATE public.estoque_publicacoes
SET status = 'publicado', erro_msg = NULL, updated_at = now()
WHERE post_id = 'ef397293-4cf4-4a7c-a891-5454fcb78bbd';

UPDATE public.estoque_publicacoes
SET status = 'despublicado', updated_at = now()
WHERE post_id IN ('9c44eba2-ac32-458d-812c-320b0a8e9911', '7e702358-7771-4415-a164-7fe0e1ccda00');

-- RMP8G90: mapeamento aponta 38dde347 (checagem ao vivo: PUBLISHED, real) --
-- correto. A outra linha (a8d18554) retornou 404 (nao existe mais de
-- verdade, nao so "0 fotos"). Remove a linha morta.
DELETE FROM public.estoque_publicacoes WHERE post_id = 'a8d18554-5cc9-45b5-a0b5-332879cb1891';
