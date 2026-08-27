-- Fase 3 do plano de corte Modelo/Versao: consultar-placa passa a separar
-- o Modelo composto que vem da API/mock usando a funcao ja criada na
-- Fase 1 (cortar_modelo_versao). Precisa de coluna nova pra cachear isso.
ALTER TABLE public.veiculos_cache ADD COLUMN IF NOT EXISTS versao text;
