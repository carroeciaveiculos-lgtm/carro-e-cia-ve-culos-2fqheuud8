-- 11/11/2026 — Leitura pública de `usuarios` restrita às colunas das páginas públicas.
--
-- Achado (verificado em 11/11/2026): um visitante sem login, usando só a chave pública do site,
-- conseguia listar nome, e-mail, nível, role, módulos e último acesso de todos os usuários
-- ativos (inclusive e-mails pessoais). Além disso o papel `anon` tinha TODAS as permissões de
-- tabela (select, insert, update, delete, truncate...), seguradas apenas pelas políticas de RLS.
--
-- O que as páginas públicas realmente leem:
--   Sobre.tsx       -> id, nome, role (filtra ativo = true)
--   AuthorBio.tsx   -> nome, bio, foto_url, especialidade, role
-- Políticas RLS não mudam (allow_anon_select_usuarios continua: ativo = true); o que muda é o que
-- o papel `anon` pode enxergar dentro das linhas liberadas. Usuário logado (`authenticated`) não
-- é afetado. Funções do servidor usam a chave de serviço e também não são afetadas.
--
-- Rollback:
--   grant select, insert, update, delete, truncate, references, trigger
--     on table public.usuarios to anon;
revoke all on table public.usuarios from anon;
grant select (id, nome, role, bio, foto_url, especialidade, ativo) on table public.usuarios to anon;
