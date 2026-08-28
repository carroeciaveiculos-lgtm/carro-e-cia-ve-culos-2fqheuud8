-- Teste ao vivo pedido pela Adriana 28/08/2026: reproduzir o bug relatado
-- (descricao gerada por IA nao sincroniza no clique manual "Publicar/
-- Sincronizar Agora" pro Mercado Livre) antes de implementar qualquer
-- correcao. Marcador unico e reversivel, veiculo de baixo risco (Honda Fit
-- LX, PUQ3A75, ja publicado ha tempo, sem interesse ativo de comprador
-- registrado). Revertido apos o teste.
UPDATE public.veiculos
SET descricao = '[TESTE-SYNC-MANUAL-28AGO-ABC123] ' || descricao
WHERE placa = 'PUQ3A75';
