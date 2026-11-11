-- 11/11/2026 — Central de Ajuda: artigo "Criar Usuário no Painel" passa a cobrir WhatsApp/endereço
-- do colaborador e os botões Desativar / Reativar. Só atualiza texto (um artigo, por id).
-- Rollback: restaurar os campos o_que_e, como_utilizar e dependencias do histórico do artigo.
update public.ajuda_conteudos
set
  titulo = 'Criar e Gerenciar Usuários no Painel',
  o_que_e = 'Tela onde o Admin Master cria contas de login para colaboradores, define nível de acesso, setores, WhatsApp e endereço, e pode desativar ou reativar quem saiu ou voltou para a equipe.',
  como_utilizar = $ajuda$1. Entre em /admin/usuarios (só aparece para quem é Admin Master).
2. Clique em "Criar Usuário".
3. Preencha nome, e-mail e uma senha (combine com a pessoa antes — ela consegue trocar depois em "Esqueci minha senha" na tela de login).
4. Escolha o Nível de Acesso: Admin Master (acesso total), Gerente (edita manuais/POPs também), Operador (uso normal) ou Bloqueado (impede o uso do painel).
5. Se quiser, preencha WhatsApp (DDD + número, ex.: (34) 99999-9999) e endereço. Esses dois dados ficam guardados à parte e só o Admin Master e a própria pessoa enxergam.
6. Marque os Setores da pessoa — isso decide o que ela vê no menu lateral e quais páginas consegue acessar.
7. Clique em "Criar Usuário". Pronto, a pessoa já consegue entrar.

Para editar depois (nível, setores, WhatsApp ou endereço): em /admin/usuarios, clique em "Editar" ao lado do nome.

Para DESATIVAR um colaborador que saiu da empresa: em /admin/usuarios, clique em "Desativar" na linha da pessoa (ou no botão "Desativar colaborador" dentro de Editar) e confirme. A pessoa perde o acesso ao painel (nível vira Bloqueado), some das listas de responsável por lead e aparece com o selo "Inativo". Nada é apagado: leads, veículos e histórico dela continuam.

Para REATIVAR: clique em "Reativar" na linha da pessoa, escolha o nível de acesso e confirme.

Proteções: você não consegue desativar o seu próprio acesso, nem o último Admin Master ativo.$ajuda$,
  dependencias = $ajuda$Só Admin Master vê essa tela e consegue criar, editar, desativar ou reativar usuário — reforçado tanto na tela quanto no banco (RLS), não é só visual. O acesso real de cada pessoa depende dos Setores marcados: sem nenhum setor (e sem ser Admin Master), ela só enxerga o Dashboard e a Central de Ajuda. O mapa de "qual página pertence a qual setor" fica no código (src/lib/setor-acesso.ts) — se um setor novo precisar acessar uma página específica, é preciso pedir o ajuste, não é automático. "Desativar" não exclui a conta: excluir de verdade só é possível para quem não tem nenhum histórico (leads, veículos, tarefas, interações), por isso ainda não existe botão de excluir.$ajuda$
where id = 'de8d9bd0-6e31-487d-b7d0-33b0cc93f8ed';
