-- Fase 0 (segurança) + Fase 1 (setores) + Fase 2 (manual por setor) do plano
-- de manual de processos/POPs (17/08/2026).
--
-- Achado de segurança corrigido aqui: a policy "allow_auth_all_usuarios"
-- dava ALL (select/insert/update/delete) pra QUALQUER usuário autenticado
-- na tabela usuarios, sem checar nível — qualquer funcionário logado podia
-- se promover a admin_master direto pela API. Substituída por policies que
-- checam nível de verdade via função security definer.

-- Helper: checa se o usuário logado tem um dos níveis informados. Security
-- definer pra evitar recursão de RLS (a policy de usuarios não pode
-- consultar a própria tabela usuarios sob RLS sem isso).
create or replace function public.usuario_tem_nivel(niveis text[])
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1 from public.usuarios
    where id = auth.uid() and nivel = any(niveis)
  );
$$;

-- usuarios: fecha a brecha. Leitura continua liberada pro time (diretório
-- interno); escrita passa a exigir admin_master. Criação de usuário já
-- passa pela function criar-usuario-admin (service role, checagem própria)
-- desde ontem — não precisa de policy de INSERT aqui.
drop policy if exists allow_auth_all_usuarios on public.usuarios;

create policy authenticated_select_usuarios
  on public.usuarios for select
  to authenticated
  using (true);

create policy admin_update_usuarios
  on public.usuarios for update
  to authenticated
  using (public.usuario_tem_nivel(array['admin_master']))
  with check (public.usuario_tem_nivel(array['admin_master']));

create policy admin_delete_usuarios
  on public.usuarios for delete
  to authenticated
  using (public.usuario_tem_nivel(array['admin_master']));

-- setores: tabela nova, gerenciável pelo admin direto no painel (sem
-- precisar de deploy pra adicionar um setor novo).
create table public.setores (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.setores enable row level security;

create policy authenticated_select_setores
  on public.setores for select
  to authenticated
  using (true);

create policy admin_manage_setores
  on public.setores for all
  to authenticated
  using (public.usuario_tem_nivel(array['admin_master']))
  with check (public.usuario_tem_nivel(array['admin_master']));

insert into public.setores (nome) values
  ('Vendas'),
  ('Consignação'),
  ('Consórcio'),
  ('Seguros'),
  ('Financiamentos'),
  ('Financeiro/Administrativo'),
  ('Estoque/Portais'),
  ('Marketing'),
  ('Desenvolvedor e TI'),
  ('Treinamentos'),
  ('Institucional');

-- usuario_setores: vínculo N:N (uma pessoa pode cobrir mais de um setor).
-- Só admin gerencia o vínculo, mesma regra de cadastrar usuário.
create table public.usuario_setores (
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  setor_id uuid not null references public.setores(id) on delete cascade,
  primary key (usuario_id, setor_id)
);

alter table public.usuario_setores enable row level security;

create policy authenticated_select_usuario_setores
  on public.usuario_setores for select
  to authenticated
  using (true);

create policy admin_manage_usuario_setores
  on public.usuario_setores for all
  to authenticated
  using (public.usuario_tem_nivel(array['admin_master']))
  with check (public.usuario_tem_nivel(array['admin_master']));

-- ajuda_conteudos: adiciona setor + permite escrita pra admin_master e
-- gerente (confirmado com a Adriana em 17/08/2026 — gerente também pode
-- manter o material do próprio setor em dia). Hoje só existia policy de
-- SELECT; sem policy de escrita, INSERT/UPDATE/DELETE eram negados por
-- padrão pra qualquer client-side call.
alter table public.ajuda_conteudos
  add column setor_id uuid references public.setores(id);

create policy gerente_admin_manage_ajuda
  on public.ajuda_conteudos for all
  to authenticated
  using (public.usuario_tem_nivel(array['admin_master', 'gerente']))
  with check (public.usuario_tem_nivel(array['admin_master', 'gerente']));
