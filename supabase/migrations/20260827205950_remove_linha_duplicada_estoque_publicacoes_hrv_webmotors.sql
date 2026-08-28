-- Achado testando o fix da modalidade: existiam DUAS linhas em
-- estoque_publicacoes pro HR-V/webmotors, mesmo post_id (73668233), criadas
-- em datas diferentes (13/08 e 26/08) -- o wm-sync processava as duas a cada
-- rodada ("processed: 2" pra 1 veiculo so). Remove a mais antiga, mantem a
-- de 26/08.
DELETE FROM public.estoque_publicacoes
WHERE id = 'f10500b4-520b-48b3-a9ff-409dfeb73907';
