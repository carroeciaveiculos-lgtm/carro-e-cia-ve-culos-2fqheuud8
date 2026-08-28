-- Teste ao vivo pedido pela Adriana 28/08/2026: confirmar se a Webmotors
-- realmente persiste o campo Observacao (descricao) quando reenviado via
-- AlterarCarro, e nao so ecoa sucesso sem persistir de verdade (padrao ja
-- visto varias vezes nesta sessao com outros campos). Mesmo veiculo de
-- baixo risco usado no teste do Mercado Livre (Honda Fit LX, PUQ3A75, ja
-- publicado na Webmotors real, CodigoAnuncio 78447550).
UPDATE public.veiculos
SET descricao = '[TESTE-WM-OBSERVACAO-28AGO-QRS456] ' || descricao
WHERE placa = 'PUQ3A75';
