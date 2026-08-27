-- Fase 4, lote completo: restante dos 24 veiculos ativos (piloto das 2
-- Hilux SW4 ja confirmado antes). Todos os 26 ja estao com backup em
-- veiculos_modelo_versao_backup_fase4.
UPDATE public.veiculos v
SET modelo = c.modelo, versao = c.versao
FROM (
  SELECT id, (public.cortar_modelo_versao(modelo)).*
  FROM public.veiculos
  WHERE status = 'disponivel' AND placa NOT IN ('PYT5J89', 'SSF5A83')
) AS c
WHERE v.id = c.id;
