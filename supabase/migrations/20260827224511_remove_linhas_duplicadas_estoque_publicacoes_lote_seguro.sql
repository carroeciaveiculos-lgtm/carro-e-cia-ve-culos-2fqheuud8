-- Achado ao auditar sincronizacao real (27/08/2026, pedido da Adriana): 19
-- combinacoes veiculo+plataforma tinham linhas duplicadas em
-- estoque_publicacoes (o wm-sync/napista-sync processava o mesmo veiculo
-- 2-4x por rodada). Este lote cobre os casos SEGUROS -- todas as linhas do
-- grupo com o MESMO post_id e MESMO status (duplicata real de linha, nao
-- ofertas/anuncios diferentes) -- mantendo so a mais recente.
-- PUQ3A75 (napista) e RMP8G90 (napista) ficam de fora -- tem post_id
-- diferentes entre as linhas (ofertas reais distintas), precisam de
-- checagem individual antes de decidir qual manter.
WITH duplicatas AS (
  SELECT ep.id,
    row_number() OVER (PARTITION BY ep.veiculo_id, ep.platform ORDER BY ep.updated_at DESC) AS rn
  FROM public.estoque_publicacoes ep
  JOIN public.veiculos v ON v.id = ep.veiculo_id
  WHERE v.placa IN ('FJK7E17','PZL2G96','QNT3C30','QTR7D13','RFM6A28','RTS4D70','RUG8F56','STE4D79','TCQ0B23')
)
DELETE FROM public.estoque_publicacoes
WHERE id IN (SELECT id FROM duplicatas WHERE rn > 1);
