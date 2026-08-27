-- Limpeza pedida pela Adriana (27/08/2026): linha orfa em ml_listings pro
-- Toyota Hilux SW4 (QXH1J94) -- status 'pending_update' sem ml_item_id,
-- criada em 21/08, nunca processada porque ml-sync so trata
-- 'pending_update' quando ja existe ml_item_id (senao seria 'pending_create').
-- Veiculo tem publicado_mercadolivre=false hoje -- nao ha nada de verdade
-- pendente de publicar; apaga a linha travada. Se ela ativar publicacao no
-- ML pra esse veiculo depois, o gatilho cria uma linha nova e correta.
DELETE FROM public.ml_listings
WHERE veiculo_id = (SELECT id FROM public.veiculos WHERE placa = 'QXH1J94')
  AND status = 'pending_update' AND ml_item_id IS NULL;
