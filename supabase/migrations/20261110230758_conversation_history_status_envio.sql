-- 10/11/2026 — Status de entrega das mensagens no Conversador.
-- A Meta avisa por webhook (statuses) quando uma mensagem foi entregue, lida ou falhou, e quando
-- o cliente reage (reaction). Até hoje esses avisos ficavam só em meta_webhook_logs. Estas colunas
-- ligam o aviso à mensagem pelo wamid (id da mensagem no WhatsApp).
-- Só ADICIONA colunas anuláveis: nenhum dado existente muda. A RLS atual (ALL para authenticated) já cobre.
-- Rollback:
--   drop index if exists public.conversation_history_wamid_idx;
--   alter table public.conversation_history drop constraint if exists conversation_history_status_envio_check;
--   alter table public.conversation_history drop column if exists wamid, drop column if exists status_envio,
--     drop column if exists status_em, drop column if exists erro_codigo, drop column if exists erro_texto,
--     drop column if exists reacao;
alter table public.conversation_history
  add column if not exists wamid text,
  add column if not exists status_envio text,
  add column if not exists status_em timestamptz,
  add column if not exists erro_codigo text,
  add column if not exists erro_texto text,
  add column if not exists reacao text;

alter table public.conversation_history
  drop constraint if exists conversation_history_status_envio_check;
alter table public.conversation_history
  add constraint conversation_history_status_envio_check
  check (status_envio is null or status_envio in ('enviado', 'entregue', 'lido', 'falhou'));

create index if not exists conversation_history_wamid_idx
  on public.conversation_history (wamid)
  where wamid is not null;
