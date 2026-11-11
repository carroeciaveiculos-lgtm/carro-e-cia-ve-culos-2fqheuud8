-- 11/11/2026 — WhatsApp e endereço do funcionário, numa tabela à parte e fechada.
--
-- Por que tabela separada e não colunas em `usuarios`: qualquer usuário logado lê toda a tabela
-- `usuarios` (política authenticated_select_usuarios = true). Em tabela própria, só o
-- admin_master e a própria pessoa enxergam. O papel `anon` não tem acesso nenhum.
-- Quem grava no cadastro (criar-usuario-admin) usa a chave de serviço e ignora a RLS.
--
-- Rollback: drop table public.usuarios_dados_pessoais;
create table if not exists public.usuarios_dados_pessoais (
  usuario_id uuid primary key references public.usuarios(id) on delete cascade,
  whatsapp text check (whatsapp is null or whatsapp ~ '^[0-9]{10,15}$'),
  endereco text,
  updated_at timestamptz not null default now()
);

alter table public.usuarios_dados_pessoais enable row level security;

drop policy if exists dados_pessoais_select on public.usuarios_dados_pessoais;
create policy dados_pessoais_select on public.usuarios_dados_pessoais
  for select to authenticated
  using (usuario_id = auth.uid() or public.usuario_tem_nivel(array['admin_master']));

drop policy if exists dados_pessoais_insert on public.usuarios_dados_pessoais;
create policy dados_pessoais_insert on public.usuarios_dados_pessoais
  for insert to authenticated
  with check (usuario_id = auth.uid() or public.usuario_tem_nivel(array['admin_master']));

drop policy if exists dados_pessoais_update on public.usuarios_dados_pessoais;
create policy dados_pessoais_update on public.usuarios_dados_pessoais
  for update to authenticated
  using (usuario_id = auth.uid() or public.usuario_tem_nivel(array['admin_master']))
  with check (usuario_id = auth.uid() or public.usuario_tem_nivel(array['admin_master']));

drop policy if exists dados_pessoais_delete on public.usuarios_dados_pessoais;
create policy dados_pessoais_delete on public.usuarios_dados_pessoais
  for delete to authenticated
  using (public.usuario_tem_nivel(array['admin_master']));

revoke all on table public.usuarios_dados_pessoais from anon;
grant select, insert, update, delete on table public.usuarios_dados_pessoais to authenticated;
