-- Página "Trabalhe Conosco" (15/08/2026, pedido da Adriana): vagas cadastradas
-- pelo admin, candidaturas recebidas pelo formulário público do site.

create table public.vagas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  imagem_url text,
  ativa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.candidaturas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text not null,
  email text not null,
  informacoes_adicionais text,
  curriculo_url text not null,
  curriculo_nome_arquivo text,
  status text not null default 'novo',
  created_at timestamptz not null default now()
);

create index idx_vagas_ativa on public.vagas (ativa);
create index idx_candidaturas_created_at on public.candidaturas (created_at desc);

alter table public.vagas enable row level security;
alter table public.candidaturas enable row level security;

-- vagas: qualquer visitante vê só as ativas (card "Temos vaga" na home pública)
create policy "vagas_select_public_ativas" on public.vagas
  for select to anon using (ativa = true);

-- vagas: equipe logada no admin gerencia tudo
create policy "vagas_admin_all" on public.vagas
  for all to authenticated using (true) with check (true);

-- candidaturas: o formulário público só insere (não lê, não edita) —
-- o insert de verdade acontece server-side, dentro da function
-- enviar-candidatura (service role), então essa policy é rede de segurança.
create policy "candidaturas_insert_public" on public.candidaturas
  for insert to anon with check (true);

-- candidaturas: só a equipe logada vê e atualiza status (aba "Candidaturas
-- Recebidas" do admin)
create policy "candidaturas_admin_select" on public.candidaturas
  for select to authenticated using (true);

create policy "candidaturas_admin_update" on public.candidaturas
  for update to authenticated using (true) with check (true);
