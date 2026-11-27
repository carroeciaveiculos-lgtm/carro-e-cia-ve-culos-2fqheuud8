-- 27/11/2026: Central de Ajuda acompanha as datas permanentes de venda/devolução, o recomeço da contagem e o fim
-- do apagamento de fotos ao vender/devolver. Autorização permanente para artigos (09/11/2026).

-- "Vender, devolver, reativar, despublicar ou excluir um veículo"
update public.ajuda_conteudos
   set como_utilizar = replace(
         como_utilizar,
         '"N dias" desde o cadastro no sistema para carro disponível, devolvido ou em rascunho; "Vendeu em N dias" (do cadastro até a data da venda, sem continuar contando) para vendido; "—" quando a venda não tem data registrada.',
         '"N dias" desde a entrada no estoque para carro disponível ou em rascunho; "Vendeu em N dias" (da entrada até a venda) e "Devolvido em N dias" (da entrada até a devolução), que param de contar; "—" quando a data não foi registrada (vendas antes de 28/09/2026 e devoluções antes de 27/11/2026). Se um carro vendido ou devolvido voltar ao estoque, a contagem recomeça do zero. As datas de venda e de devolução ficam guardadas para sempre, e cada troca de status fica no histórico do veículo. Desde 27/11/2026 vender ou devolver NÃO apaga mais as fotos da ficha (a limpeza automática tira as extras 30 dias depois e mantém a capa).'
       )
 where id = '4624c201-00b5-46af-8dd8-6005ac8fb336';

-- "Imprimir o Relatório de Estoque em PDF"
update public.ajuda_conteudos
   set como_utilizar = replace(
         como_utilizar,
         'Dias em estoque (desde 27/11/2026): para carro vendido é o tempo do cadastro até a venda (não conta mais até hoje); vendido sem data de venda aparece com "—"',
         'Dias em estoque (desde 27/11/2026): conta a partir da entrada no estoque (recomeça do zero se o carro voltou depois de vendido ou devolvido); para vendido é o tempo até a venda e para devolvido até a devolução (não contam mais até hoje); sem a data de saída aparece "—"'
       )
 where id = 'eee821f9-1e71-4fe4-8698-5b7023e14468';

update public.ajuda_conteudos
   set como_utilizar = replace(como_utilizar, '"Parados +30 dias" conta só quem ainda está no estoque.',
         '"Parados +30 dias" conta só quem ainda está no estoque (vendidos e devolvidos não contam).')
 where id = 'eee821f9-1e71-4fe4-8698-5b7023e14468';

-- "Limpeza automática das fotos de veículos vendidos, devolvidos ou excluídos"
update public.ajuda_conteudos
   set como_utilizar = como_utilizar || E'\nDesde 27/11/2026 vender ou devolver não apaga mais as fotos da ficha na hora (havia uma regra antiga que fazia isso). As capas que tinham sido apagadas foram recuperadas da lixeira quando o nome do arquivo indicava qual era a capa.'
 where titulo = 'Limpeza automática das fotos de veículos vendidos, devolvidos ou excluídos'
   and como_utilizar not like '%Desde 27/11/2026 vender ou devolver não apaga mais%';
