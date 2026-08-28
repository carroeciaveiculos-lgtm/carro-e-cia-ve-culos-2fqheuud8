-- Achado ao vivo (27/08/2026): ObterEstoqueAtual listou o codigo 77614580
-- (placa PZQ2F46/HR-V) entre os anuncios ativos, e o codigo 73668233 (que o
-- banco rastreava) nao aparecia nessa lista. Concluido, na hora, que
-- 73668233 estaria morto e 77614580 seria o anuncio real -- CONCLUSAO ERRADA,
-- corrigida na migracao seguinte (reverte_correcao_errada_hrv_ad_77614580...)
-- depois que a Adriana confirmou ter excluido 77614580 manualmente e um
-- teste real via ObterFotosCarro provou que 73668233 segue vivo (20 fotos
-- reais) enquanto 77614580 retorna vazio (excluido).
UPDATE public.estoque_publicacoes
SET status = 'publicado', post_id = '77614580', erro_msg = NULL, updated_at = now()
WHERE veiculo_id = (SELECT id FROM public.veiculos WHERE placa = 'PZQ2F46')
  AND platform = 'webmotors';
