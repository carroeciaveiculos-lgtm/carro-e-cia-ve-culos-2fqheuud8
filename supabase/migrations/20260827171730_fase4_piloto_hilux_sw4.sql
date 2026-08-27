-- Fase 4, piloto: so as 2 Hilux SW4 (ja testadas a mao antes), pra
-- conferir o resultado antes de rodar o lote com o restante dos 24.
UPDATE public.veiculos v
SET modelo = c.modelo, versao = c.versao
FROM (
  SELECT id, (public.cortar_modelo_versao(modelo)).*
  FROM public.veiculos
  WHERE placa IN ('PYT5J89', 'SSF5A83')
) AS c
WHERE v.id = c.id;
