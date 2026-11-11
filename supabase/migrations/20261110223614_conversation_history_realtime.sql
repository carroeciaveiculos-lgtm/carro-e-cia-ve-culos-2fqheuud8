-- 10/11/2026 — Conversador: mensagens novas não apareciam sozinhas no painel.
-- Causa: conversation_history não estava na publicação supabase_realtime (só leads).
-- ConversationPanel.tsx e Conversas.tsx assinam INSERT dessa tabela e nunca recebiam nada.
-- Idempotente. A RLS existente continua valendo (só usuário autenticado recebe).
-- Rollback: alter publication supabase_realtime drop table public.conversation_history;
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversation_history'
  ) then
    alter publication supabase_realtime add table public.conversation_history;
  end if;
end $$;
