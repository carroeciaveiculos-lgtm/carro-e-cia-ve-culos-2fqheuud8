-- Avaliação de veículo formal (17/08/2026) — tela antiga era fachada,
-- removida em 17/08. Plano fechado com a Adriana: nasce de agendamento
-- (tipo='avaliacao') ou avulsa; sem tabela FIPE (valor 100% critério do
-- vendedor); fotos opcionais; termina em proposta PDF, consignação ou
-- compra pro estoque.
create table if not exists avaliacoes_veiculo (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  agendamento_id uuid references agendamentos_visita(id) on delete set null,
  avaliador_id uuid references usuarios(id) on delete set null,

  -- dados do carro do cliente
  marca text not null,
  modelo text not null,
  ano_fabricacao integer,
  ano_modelo integer,
  placa text,
  quilometragem integer,
  cor text,
  cambio text,
  combustivel text,

  estado_conservacao text,
  itens_opcionais text[],
  tem_debito_multa_sinistro boolean not null default false,
  observacao_debito text,

  fotos text[],

  valor_proposto numeric,
  observacoes text,

  destino text not null default 'pendente'
    check (destino in ('pendente', 'proposta_enviada', 'consignacao', 'compra_estoque', 'recusado')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_avaliacoes_veiculo_lead on avaliacoes_veiculo(lead_id);
create index if not exists idx_avaliacoes_veiculo_destino on avaliacoes_veiculo(destino);

alter table avaliacoes_veiculo enable row level security;

-- Mesmo padrão permissivo já usado em estoque_publicacoes/wm_mapeamento_veiculos
-- nesse projeto — proteção real é o gate de setor na rota /admin/avaliacao,
-- não RLS fino por linha.
create policy "auth_all_avaliacoes_veiculo"
  on avaliacoes_veiculo
  for all
  to authenticated
  using (true)
  with check (true);
