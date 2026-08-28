-- Achado ao vivo (27/08/2026): Fit LX (PUQ3A75) ja estava publicado na
-- Webmotors sob um codigo de anuncio diferente do que o banco rastreava
-- (78447550), e o NaPista tinha sido reativado de verdade via chamada real
-- PUT .../offer/{id}/PUBLISHED. Corrige os registros pra refletir o estado
-- real confirmado nas duas plataformas.
UPDATE public.estoque_publicacoes
SET status = 'publicado', post_id = '78447550', erro_msg = NULL, updated_at = now()
WHERE veiculo_id = (SELECT id FROM public.veiculos WHERE placa = 'PUQ3A75')
  AND platform = 'webmotors';

UPDATE public.estoque_publicacoes
SET status = 'publicado', erro_msg = NULL, publicado_em = now(), updated_at = now()
WHERE veiculo_id = (SELECT id FROM public.veiculos WHERE placa = 'PUQ3A75')
  AND platform = 'napista';
