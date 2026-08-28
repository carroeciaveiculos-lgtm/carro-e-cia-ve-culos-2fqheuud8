-- Reverte os marcadores de teste inseridos no Honda Fit LX (PUQ3A75) pra
-- confirmar/corrigir o bug de sync manual de descricao no Mercado Livre.
-- Correcao ja confirmada funcionando (28/08/2026) -- devolvendo a descricao
-- original.
UPDATE public.veiculos
SET descricao = replace(
  replace(descricao, '[TESTE-SYNC-CORRIGIDO-28AGO-XYZ999] ', ''),
  '[TESTE-SYNC-MANUAL-28AGO-ABC123] ', ''
)
WHERE placa = 'PUQ3A75';
