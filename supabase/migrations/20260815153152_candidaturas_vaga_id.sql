-- Liga cada candidatura à vaga específica que o candidato escolheu no
-- formulário (15/08/2026, pedido da Adriana) — antes não dava pra saber pra
-- qual vaga a pessoa se candidatou, só o texto livre. Nulo = candidatura
-- espontânea (sem vaga específica no momento do envio).

alter table public.candidaturas
  add column vaga_id uuid references public.vagas (id) on delete set null;

create index idx_candidaturas_vaga_id on public.candidaturas (vaga_id);
