-- Adriana confirmou (27/08/2026) que excluiu manualmente, no painel
-- Webmotors, o anuncio do BMW 320iA (UDJ9A33, anuncio 75274239) no mesmo dia
-- do HR-V. Ao contrario do caso do HR-V, ObterFotosCarro continuou
-- retornando sucesso com 20 fotos reais horas depois -- confirma que nem
-- ObterEstoqueAtual nem ObterFotosCarro sao confiaveis pra detectar exclusao
-- manual recente (ver docs/webmotors-integracao.md, Becos sem saida).
-- Corrige o registro pela palavra dela, fonte real.
UPDATE public.estoque_publicacoes
SET status = 'despublicado', erro_msg = 'Excluído manualmente pela Adriana no painel Webmotors (confirmado por ela, 27/08/2026) — ObterFotosCarro ainda retorna fotos, API não é confiável aqui, valendo a palavra dela.', updated_at = now()
WHERE veiculo_id = (SELECT id FROM public.veiculos WHERE placa = 'UDJ9A33')
  AND platform = 'webmotors';
