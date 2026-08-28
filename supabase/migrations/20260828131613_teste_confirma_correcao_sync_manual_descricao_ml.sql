-- Segunda parte do teste ao vivo (28/08/2026): apos implementar e deployar
-- a correcao (chamada PUT /items/{id}/description em sync-plataforma e
-- ml-sync-core), muda a descricao de novo com um marcador NOVO e diferente
-- do teste anterior, pra confirmar que a correcao realmente funciona.
UPDATE public.veiculos
SET descricao = '[TESTE-SYNC-CORRIGIDO-28AGO-XYZ999] ' || descricao
WHERE placa = 'PUQ3A75' AND descricao NOT LIKE '%XYZ999%';
