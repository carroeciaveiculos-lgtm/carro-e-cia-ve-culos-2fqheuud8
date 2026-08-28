-- wm-sync marcou o HR-V como "already_published" usando 77614580, achado
-- pelo proprio ObterEstoqueAtual -- mas checagem real (ObterFotosCarro)
-- confirmou 77614580 vazio (CodigoAnuncio=0, 0 fotos), batendo com a
-- exclusao manual que a Adriana confirmou. Bug real do proprio wm-sync: o
-- guard de duplicidade confia em ObterEstoqueAtual sem checagem cruzada, e
-- esse endpoint mostrou-se stale (mesmo +24h depois da exclusao). Reverte
-- pro estado real: anuncio antigo (73668233) segue existindo (fotos reais)
-- mas travado (43|36); nenhum anuncio novo foi criado agora.
UPDATE public.estoque_publicacoes
SET status = 'error', post_id = '73668233',
    erro_msg = 'CodigoRetorno 43|36: Anúncio não pode ser alterado (real, com fotos, mas trava qualquer alteração — causa raiz não confirmada). Tentativa de publicar anúncio novo em 27/08 foi bloqueada pelo guard de duplicidade do wm-sync usando 77614580 (ad fantasma/já excluído pela Adriana) — falso positivo confirmado ao vivo.',
    updated_at = now()
WHERE veiculo_id = (SELECT id FROM public.veiculos WHERE placa = 'PZQ2F46')
  AND platform = 'webmotors';

UPDATE public.veiculos SET publicado_webmotors = false WHERE placa = 'PZQ2F46';
