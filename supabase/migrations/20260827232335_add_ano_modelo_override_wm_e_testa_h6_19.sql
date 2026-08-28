-- Campo real pra sobrescrever, so no XML enviado a Webmotors, o ano do
-- modelo esperado por uma CodigoVersao especifica -- sem tocar em
-- veiculos.ano_modelo (dado real do carro, usado por NaPista/ML/contratos).
-- Motivo: H6 19 (SGI9C15) rejeitado ha dias em VIP com 43|41+43|37
-- ("Ano do Modelo invalido"/inconsistente), enquanto marca/modelo bateram
-- 100%. Teste real, a pedido da Adriana: a versao PHEV E-TRACTION do outro
-- Haval H6 do estoque (SIQ5H93) esta registrada como ano 2024 no Cockpit
-- real da Webmotors -- testando a mesma versao (399259) com AnoDoModelo
-- 2024 em vez do ano_modelo real do veiculo (2025).
ALTER TABLE public.wm_mapeamento_veiculos
  ADD COLUMN IF NOT EXISTS ano_modelo_override_wm integer;

COMMENT ON COLUMN public.wm_mapeamento_veiculos.ano_modelo_override_wm IS
  'Ano especifico que o catalogo da Webmotors espera pra essa CodigoVersao, quando difere do ano_modelo real do veiculo. Nao altera o cadastro do carro.';

UPDATE public.wm_mapeamento_veiculos
SET ano_modelo_override_wm = 2024
WHERE veiculo_id = (SELECT id FROM public.veiculos WHERE placa = 'SGI9C15');
