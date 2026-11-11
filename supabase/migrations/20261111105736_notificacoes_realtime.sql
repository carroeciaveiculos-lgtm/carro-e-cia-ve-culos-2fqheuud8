-- 11/11/2026 — Sino de notificações do painel: a tabela `notificacoes` não estava na publicação
-- supabase_realtime, então o aviso novo nunca chegava ao sino sem recarregar a página
-- (mesmo defeito corrigido para conversation_history em 20261110223614).
-- Idempotente. A RLS existente continua valendo (usuario_id nulo = toda a equipe logada vê).
-- Rollback: alter publication supabase_realtime drop table public.notificacoes;
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notificacoes'
  ) then
    alter publication supabase_realtime add table public.notificacoes;
  end if;
end $$;
