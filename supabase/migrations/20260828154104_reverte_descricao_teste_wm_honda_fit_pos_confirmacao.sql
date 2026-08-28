-- Reverte o marcador de teste da Webmotors no Honda Fit LX (PUQ3A75).
-- Confirmado ao vivo (28/08/2026) via ObterEstoqueAtual real que o campo
-- Observacao persiste de verdade a descricao enviada -- nao ha bug aqui,
-- diferente do achado no Mercado Livre.
UPDATE public.veiculos
SET descricao = replace(descricao, '[TESTE-WM-OBSERVACAO-28AGO-QRS456] ', '')
WHERE placa = 'PUQ3A75';
