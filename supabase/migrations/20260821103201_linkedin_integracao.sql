-- Fluxo de conexao OAuth do LinkedIn (21/08/2026, pedido da Adriana). Guarda
-- o token gerado quando ela autorizar o app como admin da pagina da empresa
-- -- so aqui, nunca em Supabase secret (functions nao conseguem escrever
-- secret em runtime). Tabela de linha unica (uma pagina do LinkedIn so).
create table public.linkedin_integracao (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'desconectado',
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  organization_urn text,
  organization_nome text,
  oauth_state text,
  ultimo_erro text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.linkedin_integracao (status) values ('desconectado');

alter table public.linkedin_integracao enable row level security;

-- Contém token de acesso real da pagina do LinkedIn -- leitura restrita ao
-- mesmo nivel de confianca ja usado pra outras credenciais de plataforma.
-- Sem policy de insert/update/delete pra usuario autenticado: só as Edge
-- Functions (service role, que ignora RLS) escrevem aqui.
create policy "admin_master e gerente veem a conexao linkedin"
  on public.linkedin_integracao for select
  using (public.usuario_tem_nivel(array['admin_master', 'gerente']));
