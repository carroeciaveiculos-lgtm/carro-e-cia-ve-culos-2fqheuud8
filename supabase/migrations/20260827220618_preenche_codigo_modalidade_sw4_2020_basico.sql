-- SW4 2020 (QXH1J94) nunca tinha sido publicado -- wm_mapeamento_veiculos
-- estava com codigo_modalidade_wm NULL (nunca passou pelo wm-mapear-veiculo
-- de verdade). Preenche com o valor real de Basico (mesmo que
-- obterCodigoModalidadeBasico() usaria), sem precisar reprocessar o
-- matching de marca/modelo/versao que ja estava correto.
UPDATE public.wm_mapeamento_veiculos
SET codigo_modalidade_wm = '6351'
WHERE veiculo_id = (SELECT id FROM public.veiculos WHERE placa = 'QXH1J94')
  AND codigo_modalidade_wm IS NULL;
