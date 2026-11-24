-- 24/11/2026: Central de Ajuda acompanha o PR #34 (ícone do painel no iPhone e
-- filtro de data do Relatório de Estoque). Autorização permanente de 09/11/2026.

-- 1) Novo: Usar o painel no celular
INSERT INTO public.ajuda_conteudos
  (titulo, categoria, grupo, setor_id, caminho, o_que_e, para_que_serve, quando_utilizar, como_utilizar, dependencias)
VALUES (
  'Usar o painel no celular (ícone na tela de início)',
  'Geral',
  'operacional',
  '308efc6e-5db3-4cc9-83e3-e39ecdccd5e1', -- Todos
  'Tela de login do painel (/admin/login) ou qualquer tela do painel (/admin), aberta no navegador do celular',
  'Um atalho do painel na tela de início do celular, com o ícone da bandeira quadriculada e o nome "Carro e Cia CRM". Ele abre o painel em tela cheia, como um aplicativo.',
  'Entrar no painel com um toque, sem digitar o endereço nem procurar a aba no navegador.',
  'Uma vez por celular, de preferência no primeiro acesso. Refaça se o ícone tiver sido adicionado antes de 24/11/2026: naquela época o iPhone mostrava uma foto da página em vez da bandeira.',
  'iPhone (Safari):
1. Abra o Safari e entre em www.carroeciamotors.com.br/admin/login (pode ser antes de fazer login).
2. Toque no botão Compartilhar (o quadrado com a seta para cima).
3. Role a lista e toque em "Adicionar à Tela de Início".
4. Confira o nome "Carro e Cia CRM" e o ícone da bandeira quadriculada e toque em "Adicionar".
5. O ícone aparece na tela de início. Toque nele para abrir o painel em tela cheia.

Android (Chrome):
1. Abra o Chrome e entre em www.carroeciamotors.com.br/admin/login.
2. Toque nos três pontinhos no canto de cima.
3. Toque em "Instalar app" ou "Adicionar à tela inicial" (o nome muda conforme o celular).
4. Confirme. O ícone aparece na tela inicial.

Já tinha o atalho antigo (com a foto da página)? Apague o ícone (segure o dedo sobre ele e escolha remover) e faça os passos de novo.
Observação: o site público (estoque, blog) não oferece instalar app; só as telas do painel.',
  'Acesso ao painel (usuário e senha). iPhone: precisa ser pelo Safari. Android: Chrome atualizado.'
);

-- 2) Relatório de Estoque: filtro por data de entrada ou de venda
UPDATE public.ajuda_conteudos
SET como_utilizar = replace(
  como_utilizar,
  '4. Se quiser, use também os filtros Marca e Tempo parado (até 15 dias, 16 a 30, 31 a 60, mais de 60).',
  '4. Se quiser, use também os filtros Marca e Tempo parado (até 15 dias, 16 a 30, 31 a 60, mais de 60).
4b. Filtro de data: troque "Qualquer data" por "Data de entrada" (dia em que o veículo foi cadastrado) ou "Data de venda" e preencha "De" e "Até" (pode deixar um deles em branco). Ao escolher "Data de venda", o relatório passa a mostrar só os Vendidos, porque só carro vendido tem data de venda. Vendas registradas antes de 28/09/2026 não têm data gravada e ficam fora desse filtro; a tela avisa quantas são. O período escolhido aparece no topo da folha impressa.'
)
WHERE id = 'eee821f9-1e71-4fe4-8698-5b7023e14468';
