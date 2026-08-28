-- Teste ao vivo pedido pela Adriana 28/08/2026: confirmar se o NaPista
-- realmente persiste a descricao (campo "description" do payload), mesmo
-- padrao de verificacao ja feito com Mercado Livre (achou bug real) e
-- Webmotors (confirmado correto). Mesmo veiculo de baixo risco (Honda Fit
-- LX, PUQ3A75, ja publicado no NaPista real, offer 9c44eba2-ac32-458d-812c-320b0a8e9911).
UPDATE public.veiculos
SET descricao = '[TESTE-NAPISTA-DESC-28AGO-LMN789] ' || descricao
WHERE placa = 'PUQ3A75';
