-- Achado testando ao vivo (14/08/2026): napista_versoes cacheava versões só
-- por modelo, sem ano — a API tem um filtro modelYear que devolve conjuntos
-- BEM diferentes por ano (Jeep Compass 2021 tem "2.0 SPORT AUTO"
-- id=77446132017, mas o cache sem filtro de ano pegou uma versão de 2018 pra
-- um carro 2021, e o NaPista rejeitou no cadastro: "versionId invalid for
-- the informed modelYear"). Sem a coluna pra separar por ano, não dá pra
-- cachear com segurança.
ALTER TABLE public.napista_versoes ADD COLUMN IF NOT EXISTS model_year integer;
CREATE INDEX IF NOT EXISTS idx_napista_versoes_modelo_ano
  ON public.napista_versoes(marca_id, modelo_id, model_year);
