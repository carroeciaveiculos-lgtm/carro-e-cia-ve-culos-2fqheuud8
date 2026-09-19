-- Rastro de quem alterou o veículo e quando (pedido da Adriana, 19/09/2026,
-- caso real: T-Cross marcado como vendido sem nenhum registro de quem fez
-- a alteração). Gatilho no banco, não código de tela — existem 13 lugares
-- diferentes no projeto que fazem UPDATE em veiculos, um gatilho garante
-- que TODOS gravam o autor, inclusive telas futuras que ainda não existem.

alter table veiculos add column if not exists alterado_por uuid references usuarios(id);
alter table veiculos add column if not exists alterado_em timestamptz;

create or replace function public.registrar_alteracao_veiculo()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.alterado_por := auth.uid();
  new.alterado_em := now();
  return new;
end;
$$;

drop trigger if exists trigger_registrar_alteracao_veiculo on veiculos;
create trigger trigger_registrar_alteracao_veiculo
  before update on veiculos
  for each row
  execute function public.registrar_alteracao_veiculo();

comment on column veiculos.alterado_por is 'Preenchido automaticamente pelo gatilho trigger_registrar_alteracao_veiculo (auth.uid() de quem fez o UPDATE). Nulo = alteração feita por automação/service role, não por pessoa logada.';
comment on column veiculos.alterado_em is 'Preenchido automaticamente pelo gatilho trigger_registrar_alteracao_veiculo.';
