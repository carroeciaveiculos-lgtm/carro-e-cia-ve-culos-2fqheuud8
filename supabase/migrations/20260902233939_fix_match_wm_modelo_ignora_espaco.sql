-- Corrige o empate de trigram entre modelos que so diferem por espaco
-- (ex: "XC 60" vindo da FIPE vs "XC60" no catalogo da Webmotors), que fazia
-- XC40/XC60/XC70/XC90 empatarem em 0.4 e o sistema escolher um arbitrario
-- (achado real 02/09/2026: Volvo XC60 SYI6C55 publicado errado como XC40
-- na Webmotors por causa desse empate).
-- Validado (02/09/2026): sem colisao nova no catalogo Webmotors hoje ao
-- ignorar espaco (varredura em wm_modelos nao achou dois modelos DIFERENTES
-- que colidissem so por espaco/caixa) -- unico efeito e' desempatar
-- corretamente casos como XC, alem de blindar contra o mesmo padrao em
-- outras marcas com codigo numerico (BMW Serie/X/M, Mercedes Classe/SL/CLK,
-- Audi A/S, Porsche 9xx, Peugeot 2xx-8xx) se algum dia entrarem no estoque.
--
-- NAO aplicar essa mesma ideia em match_napista_modelo: o catalogo da
-- NaPista tem duplicatas reais que so diferem por espaco (ex: napista_modelos
-- "XC 60" com todas as versoes cadastradas vs "XC60" vazio/sem versao) --
-- ignorar espaco lá criaria um empate novo que HOJE nao existe (testado:
-- "XC 60" bate 1.0 vs 0.4 do "XC60" sem essa mudanca; com ela os dois
-- empatariam em 0.8).
CREATE OR REPLACE FUNCTION public.match_wm_modelo(texto_busca text, p_codigo_marca_wm text)
RETURNS TABLE(codigo_wm text, nome_wm text, score real)
LANGUAGE sql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT
    mo.codigo_wm,
    mo.nome_wm,
    GREATEST(
      word_similarity(unaccent(lower(mo.nome_wm)), unaccent(lower(texto_busca))),
      word_similarity(
        replace(unaccent(lower(mo.nome_wm)), ' ', ''),
        replace(unaccent(lower(texto_busca)), ' ', '')
      )
    ) AS score
  FROM public.wm_modelos mo
  WHERE mo.codigo_marca_wm = p_codigo_marca_wm
    AND mo.nome_wm IS NOT NULL
  ORDER BY score DESC
  LIMIT 3;
$function$;
