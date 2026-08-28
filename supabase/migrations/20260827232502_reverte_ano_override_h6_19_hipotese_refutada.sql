-- Teste real (fluxo de producao, wm-sync + ano_modelo_override_wm=2024):
-- XML confirmado enviando AnoDoModelo=2024 (ate AnoFabricacao=2024, mesmo
-- ano) -- e a Webmotors recusou de novo com 43|41,43|37. A hipotese "e so o
-- ano" esta REFUTADA por teste real, nao so descartada por suposicao.
-- Reverte o override (nao ajuda, nao deve ficar sugerindo que e a
-- correcao). Campo ano_modelo_override_wm continua disponivel no codigo
-- pra uso futuro, se surgir evidencia real de qual ano/versao certos.
UPDATE public.wm_mapeamento_veiculos
SET ano_modelo_override_wm = NULL
WHERE veiculo_id = (SELECT id FROM public.veiculos WHERE placa = 'SGI9C15');
