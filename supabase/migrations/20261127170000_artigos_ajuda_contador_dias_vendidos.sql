-- 27/11/2026: Central de Ajuda acompanha o ajuste do contador de dias (vendido para de contar na venda).
-- Autorização permanente da Adriana para artigos (09/11/2026).
update public.ajuda_conteudos
   set como_utilizar = como_utilizar || E'\nContador de dias (desde 27/11/2026): carro disponível, devolvido ou em rascunho mostra "Dias: N" (dias desde o cadastro no sistema). Carro vendido mostra "Vendeu em: N dias" (do cadastro até a data da venda) e para de contar; venda sem data registrada mostra "—".'
 where id = '4624c201-00b5-46af-8dd8-6005ac8fb336'
   and como_utilizar not like '%Contador de dias (desde 27/11/2026)%';

update public.ajuda_conteudos
   set como_utilizar = como_utilizar || E'\nDias em estoque (desde 27/11/2026): para carro vendido é o tempo do cadastro até a venda (não conta mais até hoje); vendido sem data de venda aparece com "—" e só entra no filtro de dias quando ele está em "Todos". "Dias médio" usa só quem tem contagem (com só Vendidos marcado, vira o tempo médio até vender). "Parados +30 dias" conta só quem ainda está no estoque.'
 where id = 'eee821f9-1e71-4fe4-8698-5b7023e14468'
   and como_utilizar not like '%Dias em estoque (desde 27/11/2026)%';
