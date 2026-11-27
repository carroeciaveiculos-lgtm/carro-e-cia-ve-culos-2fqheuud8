-- 27/11/2026: Central de Ajuda acompanha o contador de dias (vendido para de contar na venda) e a retirada das
-- etiquetas "Encalhado" e "Poucas Visualizações" da lista do Estoque. Autorização permanente para artigos (09/11/2026).
update public.ajuda_conteudos
   set como_utilizar = replace(
         como_utilizar,
         ', "Encalhado (N dias)" (mais de 60 dias) e "Poucas Visualizações".',
         '. Embaixo do preço aparece o contador de dias (desde 27/11/2026): "N dias" desde o cadastro no sistema para carro disponível, devolvido ou em rascunho; "Vendeu em N dias" (do cadastro até a data da venda, sem continuar contando) para vendido; "—" quando a venda não tem data registrada. As etiquetas "Encalhado" e "Poucas Visualizações" foram retiradas em 27/11/2026.'
       )
 where id = '4624c201-00b5-46af-8dd8-6005ac8fb336'
   and como_utilizar like '%"Encalhado (N dias)" (mais de 60 dias) e "Poucas Visualizações".%';

update public.ajuda_conteudos
   set como_utilizar = como_utilizar || E'\nDias em estoque (desde 27/11/2026): para carro vendido é o tempo do cadastro até a venda (não conta mais até hoje); vendido sem data de venda aparece com "—" e só entra no filtro de dias quando ele está em "Todos". "Dias médio" usa só quem tem contagem (com só Vendidos marcado, vira o tempo médio até vender). "Parados +30 dias" conta só quem ainda está no estoque.'
 where id = 'eee821f9-1e71-4fe4-8698-5b7023e14468'
   and como_utilizar not like '%Dias em estoque (desde 27/11/2026)%';
