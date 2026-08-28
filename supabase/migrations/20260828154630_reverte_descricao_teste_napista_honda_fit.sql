-- Reverte o marcador de teste do NaPista no Honda Fit LX (PUQ3A75).
-- Confirmado ao vivo (28/08/2026) via GET real do offer que o campo
-- description persiste de verdade a descricao enviada -- nao ha bug aqui,
-- igual Webmotors, diferente do achado no Mercado Livre.
UPDATE public.veiculos
SET descricao = replace(descricao, '[TESTE-NAPISTA-DESC-28AGO-LMN789] ', '')
WHERE placa = 'PUQ3A75';
