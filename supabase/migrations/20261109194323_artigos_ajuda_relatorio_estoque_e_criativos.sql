-- Central de Ajuda (09/11/2026): 3 artigos novos e 3 ajustes. Pode rodar de novo sem duplicar.
-- Novos: Relatório de Estoque (impressão/PDF), Criativos do cadastro (Modelo Padrão), Relatórios Gerenciais.
-- Ajustados (texto acrescentado no fim): posts orgânicos automáticos, esteira de postagens, criativo Marketing IA.

-- 1) Relatório de Estoque para imprimir
INSERT INTO public.ajuda_conteudos (titulo, setor_id, categoria, caminho, o_que_e, para_que_serve, quando_utilizar, como_utilizar, dependencias)
SELECT
  'Imprimir o Relatório de Estoque em PDF',
  '91be7040-6a3a-425c-9f01-01e2b04900d4'::uuid,
  'Estoque',
  'Menu lateral → Estoque/Portais → Relatórios (/admin/relatorio-estoque)',
  $t$Uma folha de estoque pronta para imprimir ou salvar em PDF, tamanho A4 na vertical, com o logo da empresa, o título "Relatório de Estoque", os filtros usados, a data e a hora da impressão e uma linha por veículo (em ordem alfabética de marca e modelo). No rodapé mostra o total de veículos e, se a coluna de preço estiver marcada, a soma dos preços de venda.$t$,
  $t$Levar para reunião, conferência física do pátio ou arquivo uma lista do estoque atualizada, escolhendo quais veículos e quais dados entram. Só o preço de venda é impresso: preço de compra, preço mínimo, revenda e valor FIPE nunca entram no relatório.$t$,
  $t$Quando precisar de uma lista impressa ou em PDF do estoque (por exemplo, só os veículos ativos, ou os vendidos do mês).$t$,
  $t$1. No menu lateral, clique em Estoque/Portais → Relatórios. (A mesma tela também aparece em Relatórios Gerenciais → aba Estoque.)
2. Em "Tipos de veículo", marque o que quer listar: Ativos (marcado de início), Vendidos, Devolvidos, Em preparação e Rascunhos. Pode marcar mais de um.
3. Em "Dados a imprimir", marque as colunas extras: Ano, Placa, Km, Cor, Combustível, Câmbio, Preço de venda e Dias em estoque. De início vêm marcadas Ano, Placa, Km, Cor, Preço e Dias. Se você marcar mais de um tipo de veículo, a coluna "Situação" entra sozinha.
4. Se quiser, use também os filtros Marca e Tempo parado (até 15 dias, 16 a 30, 31 a 60, mais de 60).
5. Clique em "Visualizar impressão" para ver a folha na tela antes de imprimir. As linhas vermelhas tracejadas mostram, de forma aproximada, onde uma página termina. Para fechar a prévia, clique em "Fechar" ou aperte Esc.
6. Clique em "Imprimir / Salvar PDF". Na janela do navegador, escolha a impressora, ou "Salvar como PDF" para gerar o arquivo. Desligue a opção "Cabeçalhos e rodapés" da janela de impressão para o navegador não somar data e endereço por cima do relatório.
Observações: com muitas colunas marcadas a folha usa letra e espaços menores e a coluna do veículo fica mais estreita, para tudo caber na largura A4. Veículo zero km aparece com a marcação "Zero km". A prévia e a impressão saem iguais. Escrito pela leitura da tela e do código e por simulação de impressão; ainda sem teste logado com os veículos reais.$t$,
  $t$Acesso ao setor Estoque/Portais. Veículos cadastrados no Estoque. Para salvar em PDF basta o navegador (Chrome ou Edge); não precisa de programa extra.$t$
WHERE NOT EXISTS (
  SELECT 1 FROM public.ajuda_conteudos WHERE titulo = 'Imprimir o Relatório de Estoque em PDF'
);

-- 2) Criativos do cadastro (Modelo Padrão) e envio para aprovação
INSERT INTO public.ajuda_conteudos (titulo, setor_id, categoria, caminho, o_que_e, para_que_serve, quando_utilizar, como_utilizar, dependencias)
SELECT
  'Gerar criativos do veículo (Modelo Padrão) e enviar para aprovação',
  '42cc009b-1f94-4bf1-bd2e-8b486f4c11fa'::uuid,
  'Estoque',
  'Menu lateral → Estoque/Portais → Estoque (/admin/estoque) → editar o veículo → aba "Fotos & Mídia" → "Imagens para criativo de anúncios"',
  $t$Uma seção do cadastro do veículo que monta, no Modelo Padrão, as imagens de divulgação a partir de 4 fotos que você escolhe. O sistema desenha marca, modelo, preço, ano e quilometragem com os dados do próprio cadastro e guarda 3 formatos na pasta do veículo: Feed 4:5 (Instagram e Facebook), Stories 9:16 (Instagram) e Quadrado 1:1 (tráfego pago). A foto é a original, sem IA.$t$,
  $t$Ter as imagens de divulgação de cada veículo prontas e corretas sem designer, e mandar os posts para aprovação na Central de Redes Sociais com um clique. Preço e dados nunca são digitados à mão: vêm do cadastro.$t$,
  $t$Ao cadastrar um veículo novo, ou quando preço, quilometragem, ano ou situação mudarem e a imagem precisar ser refeita.$t$,
  $t$1. Abra o veículo em Estoque (botão de editar), salve se for novo, e vá na aba "Fotos & Mídia". Role até "Imagens para criativo de anúncios".
2. Clique em exatamente 4 fotos. A primeira que você clicar é a principal; o número da ordem aparece em cada foto. "Usar as 4 primeiras" escolhe sozinho e "Limpar" desmarca tudo. Pode usar qualquer foto da galeria.
3. Clique em "Gerar criativos". Leva alguns segundos e mostra o andamento de cada formato.
4. Em "Criativos prontos deste veículo" aparecem os 3 formatos. Clique em um para abrir a imagem em tamanho grande.
5. Para mandar para as redes, clique em "Enviar para aprovação". O sistema cria 3 posts em Rascunho: feed do Facebook, feed do Instagram e Stories do Instagram, cada um com a legenda da rede. Aprove, edite ou exclua em Central de Redes Sociais → aba "Aprovações". Nada é publicado antes da aprovação.
6. Se aparecer "Nada novo para enviar", já existem posts desse veículo aguardando aprovação.
7. Se mudar preço, km, ano ou situação, aparece um aviso amarelo no topo da seção e o botão "Enviar para aprovação" fica desligado. Salve o veículo e clique em "Gerar criativos de novo" para a imagem não mostrar dado velho.
Observações: "Gerar criativos de novo" substitui o conjunto anterior desta seção; os arquivos antigos continuam guardados no armazenamento até serem removidos manualmente. É uma ferramenta diferente da aba Marketing IA (criativo quadrado com IA tratando a foto). A esteira automática de 2 veículos por dia com estes criativos ainda não existe: por enquanto o envio é manual, veículo a veículo. A publicação do Stories ainda não foi conferida na Meta; confira o resultado na primeira aprovação. Escrito pela leitura do código; ainda sem teste logado completo.$t$,
  $t$Setor Marketing. Veículo salvo, com pelo menos 4 fotos na galeria (a seção avisa se faltar) e com preço, ano e quilometragem preenchidos. Para publicar depois de aprovar: Instagram e Facebook conectados na Central de Redes Sociais.$t$
WHERE NOT EXISTS (
  SELECT 1 FROM public.ajuda_conteudos WHERE titulo = 'Gerar criativos do veículo (Modelo Padrão) e enviar para aprovação'
);

-- 3) Relatórios Gerenciais
INSERT INTO public.ajuda_conteudos (titulo, setor_id, categoria, caminho, o_que_e, para_que_serve, quando_utilizar, como_utilizar, dependencias)
SELECT
  'Relatórios Gerenciais (Leads, Estoque e Clientes)',
  'abdaaba6-1434-4006-96c5-efdb7f9c754d'::uuid,
  'Relatórios',
  'Relatórios Gerenciais (/admin/relatorios)',
  $t$Uma página com três abas de relatórios: Leads, Estoque e Clientes. Cada aba tem filtros próprios e mostra gráficos e listas calculados com os dados do sistema.$t$,
  $t$Acompanhar o volume e a conversão de leads por vendedor, o estoque por marca e tempo parado, e os clientes por vendedor e região, sem montar planilha.$t$,
  $t$Em reuniões de resultado, ao avaliar vendedores ou ao decidir o que fazer com veículos parados.$t$,
  $t$1. Abra Relatórios Gerenciais e escolha a aba.
2. Aba Leads: filtre por período (últimos 7, 15, 30 ou 90 dias), vendedor e região. Veja "Volume de Leads" e "Conversão por Vendedor". O botão "Exportar CSV" baixa os dados para planilha.
3. Aba Estoque: filtre por marca e tempo parado. Mostra os veículos por marca e a lista. Para imprimir a lista em PDF com colunas à sua escolha, veja o artigo "Imprimir o Relatório de Estoque em PDF" (também acessível em Estoque/Portais → Relatórios).
4. Aba Clientes: filtre por período (todo o período, 30 dias, 90 dias, último ano), vendedor e região. Veja "Por Vendedor" e "Lista de Clientes".
Observação: descrito pela leitura da tela; as abas Leads e Clientes ainda sem teste logado para este artigo.$t$,
  $t$Acesso ao setor Institucional. Leads, vendas e veículos cadastrados no sistema.$t$
WHERE NOT EXISTS (
  SELECT 1 FROM public.ajuda_conteudos WHERE titulo = 'Relatórios Gerenciais (Leads, Estoque e Clientes)'
);

-- 4) Ajustes (acrescentam um aviso no fim; não repetem se rodar de novo)
UPDATE public.ajuda_conteudos
SET como_utilizar = como_utilizar || E'\n\n' || $t$Atualização de 09/11/2026: a criação automática diária (todo dia às 8h) deste post orgânico está PAUSADA desde 08/11/2026. Os posts agora chegam à aba "Aprovações" pelo botão "Enviar para aprovação" do cadastro do veículo (veja o artigo "Gerar criativos do veículo (Modelo Padrão) e enviar para aprovação") e pela esteira de carrosséis. Aprovar, Editar, Excluir e Publicar novamente funcionam igual.$t$
WHERE titulo = 'Aprovar os posts orgânicos automáticos (Central de Redes Sociais)'
  AND como_utilizar NOT LIKE '%Atualização de 09/11/2026%';

UPDATE public.ajuda_conteudos
SET como_utilizar = como_utilizar || E'\n\n' || $t$Atualização de 09/11/2026: os posts de criativo estático enviados pelo botão "Enviar para aprovação" do cadastro do veículo (3 por veículo: feed Facebook, feed Instagram e Stories Instagram) também caem na aba "Aprovações" como Rascunho, mas fora da esteira: não ficam na fila e você aprova cada um pelo botão do próprio cartão. Veja o artigo "Gerar criativos do veículo (Modelo Padrão) e enviar para aprovação". A esteira automática de criativos estáticos (2 veículos por dia) ainda não foi construída.$t$
WHERE titulo = 'Esteira de postagens: aprovar um veículo por vez (Central de Redes Sociais)'
  AND como_utilizar NOT LIKE '%Atualização de 09/11/2026%';

UPDATE public.ajuda_conteudos
SET como_utilizar = como_utilizar || E'\n\n' || $t$Atualização de 09/11/2026: existe uma segunda ferramenta, sem IA, na aba "Fotos & Mídia" do mesmo cadastro: "Imagens para criativo de anúncios". Ela monta 3 formatos (4:5, 9:16 e 1:1) no Modelo Padrão a partir de 4 fotos originais e permite enviar os posts para aprovação. Veja o artigo "Gerar criativos do veículo (Modelo Padrão) e enviar para aprovação". Esta aba Marketing IA continua gerando o criativo quadrado com tratamento de IA na foto.$t$
WHERE titulo = 'Gerar criativo de anúncio do veículo (Meta Ads e Google Ads)'
  AND como_utilizar NOT LIKE '%Atualização de 09/11/2026%';
