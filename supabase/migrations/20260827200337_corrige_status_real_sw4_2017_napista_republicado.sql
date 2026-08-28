-- SW4 2017 (PYT5J89) estava com o mapeamento NaPista limpo (mapeado,
-- confirmado_manualmente, sem erro) mas a oferta seguia despublicada por uma
-- inconsistencia de sync anterior. Reativada de verdade via chamada real
-- PUT .../offer/{id}/PUBLISHED (confirmado por GET: offerStatus=PUBLISHED).
-- Corrige o registro pra refletir o estado real.
UPDATE public.estoque_publicacoes
SET status = 'publicado', erro_msg = NULL, publicado_em = now(), updated_at = now()
WHERE veiculo_id = (SELECT id FROM public.veiculos WHERE placa = 'PYT5J89')
  AND platform = 'napista';
