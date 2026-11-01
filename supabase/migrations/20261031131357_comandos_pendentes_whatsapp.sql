create table public.comandos_pendentes_whatsapp (
  id uuid primary key default gen_random_uuid(),
  telefone text not null,
  tipo text not null check (tipo in ('confirmacao', 'lista')),
  comando text,
  alvo jsonb not null default '{}'::jsonb,
  resumo text,
  status text not null default 'pendente'
    check (status in ('pendente', 'usado', 'cancelado', 'expirado')),
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null default now() + interval '10 minutes'
);

alter table public.comandos_pendentes_whatsapp enable row level security;
-- Sem policy de proposito: so o servidor (service_role) acessa.

create index idx_comandos_pendentes_telefone
  on public.comandos_pendentes_whatsapp (telefone, status, expira_em);
