-- Fase 1 do plano de corte Modelo/Versao (sessao 16, MEMORY_WORK.MD).
-- Hoje a equipe digita tudo em Modelo (o proprio texto de ajuda do form
-- incentiva isso) -- Clara/site/admin so buscam por Modelo, nunca por
-- Versao. Regra validada com dado real da FIPE: cortar no 1o espaco
-- (Modelo = 1a palavra, Versao = resto), com excecao pra nome composto.
-- Duas categorias de excecao:
--   'generico'  -- 1a palavra sozinha ja indica nome composto de 2 palavras,
--                  vale pra qualquer marca (ex: 'Grand' cobre Grand Vitara,
--                  Grand Cherokee, etc; 'Range' cobre Range R., Range
--                  R.Evoque, Range R.Sport)
--   'composto'  -- frase de 2 palavras especifica, so da match exato
--                  (ex: 'C4 Cactus', 'Classe A')
-- So a base (tabela + funcao) -- nao mexe em busca nem em veiculo
-- existente ainda (isso e' Fase 2/3/4 do plano).
CREATE TABLE IF NOT EXISTS public.modelo_versao_excecoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN ('generico', 'composto')),
  termo text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (tipo, termo)
);

ALTER TABLE public.modelo_versao_excecoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access_modelo_versao_excecoes" ON public.modelo_versao_excecoes;
CREATE POLICY "service_role_full_access_modelo_versao_excecoes"
  ON public.modelo_versao_excecoes FOR ALL TO service_role USING (true) WITH CHECK (true);

INSERT INTO public.modelo_versao_excecoes (tipo, termo) VALUES
  ('generico', 'Grand'),
  ('generico', 'Land'),
  ('generico', 'Range'),
  ('generico', 'New'),
  ('generico', 'Haval'),
  ('generico', 'XC'),
  ('composto', 'Corolla Cross'),
  ('composto', 'C4 Cactus'),
  ('composto', 'Grand Vitara'),
  ('composto', 'XC 40'),
  ('composto', 'L200 Triton'),
  ('composto', 'Classe A'),
  ('composto', 'Classe B'),
  ('composto', 'Santa Fe'),
  ('composto', 'Ram 2500'),
  ('composto', 'PT Cruiser'),
  ('composto', 'Corolla Fielder')
ON CONFLICT (tipo, termo) DO NOTHING;

-- Recebe o texto de Modelo hoje (ex: "Corolla Cross XRE") e devolve
-- {modelo, versao} separados, consultando as excecoes acima.
CREATE OR REPLACE FUNCTION public.cortar_modelo_versao(texto_modelo text)
RETURNS TABLE(modelo text, versao text)
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  palavras text[];
  primeira text;
  duas_palavras text;
  is_excecao boolean;
BEGIN
  texto_modelo := trim(texto_modelo);

  IF texto_modelo IS NULL OR texto_modelo = '' THEN
    RETURN QUERY SELECT NULL::text, NULL::text;
    RETURN;
  END IF;

  palavras := regexp_split_to_array(texto_modelo, '\s+');

  IF array_length(palavras, 1) = 1 THEN
    RETURN QUERY SELECT palavras[1], NULL::text;
    RETURN;
  END IF;

  primeira := palavras[1];
  duas_palavras := palavras[1] || ' ' || palavras[2];

  SELECT EXISTS(
    SELECT 1 FROM public.modelo_versao_excecoes
    WHERE (tipo = 'generico' AND lower(termo) = lower(primeira))
       OR (tipo = 'composto' AND lower(termo) = lower(duas_palavras))
  ) INTO is_excecao;

  IF is_excecao THEN
    IF array_length(palavras, 1) = 2 THEN
      RETURN QUERY SELECT duas_palavras, NULL::text;
    ELSE
      RETURN QUERY SELECT duas_palavras, array_to_string(palavras[3:array_length(palavras, 1)], ' ');
    END IF;
    RETURN;
  END IF;

  IF array_length(palavras, 1) = 2 THEN
    RETURN QUERY SELECT primeira, palavras[2];
  ELSE
    RETURN QUERY SELECT primeira, array_to_string(palavras[2:array_length(palavras, 1)], ' ');
  END IF;
END;
$function$;
