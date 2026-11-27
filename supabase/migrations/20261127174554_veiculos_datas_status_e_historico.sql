-- 27/11/2026 (autorizado pela Adriana em 27/11/2026). Regras dela:
--   * nunca apagar a data de venda nem a de devolução (registro permanente);
--   * carro vendido/devolvido que volta ao estoque recomeça a contagem de dias DO ZERO;
--   * vender/devolver não pode apagar as fotos (a limpeza do R2 tira as extras após 30 dias e mantém a capa).
--
-- 1) Remove o gatilho trg_clear_fotos_on_status_change: apagava veiculos.fotos ao virar vendido/devolvido
--    (criado direto no banco, sem migration; 28/30 vendidos e 14/14 devolvidos estavam sem fotos em 27/11/2026).
--    BACKUP da função (mantida no banco, só o gatilho sai):
--      CREATE OR REPLACE FUNCTION public.clear_fotos_on_status_change() RETURNS trigger LANGUAGE plpgsql
--      SET search_path TO 'public', 'pg_temp' AS $f$ BEGIN
--        IF NEW.status IN ('vendido','devolvido') AND (OLD.status IS DISTINCT FROM NEW.status) THEN NEW.fotos = NULL; END IF;
--        RETURN NEW; END; $f$;
--      CREATE TRIGGER trg_clear_fotos_on_status_change BEFORE UPDATE OF status ON public.veiculos FOR EACH ROW
--        WHEN ((new.status = ANY (ARRAY['vendido'::text, 'devolvido'::text]))) EXECUTE FUNCTION clear_fotos_on_status_change();
drop trigger if exists trg_clear_fotos_on_status_change on public.veiculos;

-- 2) Colunas novas
alter table public.veiculos add column if not exists data_devolucao timestamptz;
alter table public.veiculos add column if not exists entrada_estoque_em timestamptz;
comment on column public.veiculos.data_devolucao is
  'Última devolução. Gravada sozinha quando o status vira devolvido; nunca é apagada (27/11/2026).';
comment on column public.veiculos.entrada_estoque_em is
  'Início da contagem de dias. = cadastro; recomeça (now) quando o carro volta ao estoque depois de vendido/devolvido (27/11/2026).';
comment on column public.veiculos.data_venda is
  'Última venda. Gravada sozinha quando o status vira vendido; desde 27/11/2026 NUNCA é apagada (antes era limpa ao sair de vendido). NULL = venda anterior a 28/09/2026.';

-- created_at é timestamp sem fuso gravado em UTC
update public.veiculos set entrada_estoque_em = created_at at time zone 'UTC' where entrada_estoque_em is null;
alter table public.veiculos alter column entrada_estoque_em set default now();

-- 3) Uma regra só para as datas (substitui registrar_data_venda, que apagava a data de venda).
--    BACKUP da versão antiga: if new.status='vendido' and old.status is distinct from 'vendido' then
--    new.data_venda := now(); elsif new.status is distinct from 'vendido' and old.status='vendido' then
--    new.data_venda := null; end if;
create or replace function public.registrar_datas_status()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.status is distinct from new.status then
    if new.status = 'vendido' then
      new.data_venda := now();
    elsif new.status = 'devolvido' then
      new.data_devolucao := now();
    end if;
    -- Voltou ao estoque depois de vendido/devolvido: contagem recomeça do zero.
    if old.status in ('vendido', 'devolvido') and new.status not in ('vendido', 'devolvido') then
      new.entrada_estoque_em := now();
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trigger_registrar_data_venda on public.veiculos;
drop trigger if exists trigger_registrar_datas_status on public.veiculos;
create trigger trigger_registrar_datas_status
  before update of status on public.veiculos
  for each row execute function public.registrar_datas_status();

-- 4) Histórico permanente de status (um carro pode ser vendido e voltar várias vezes)
create table if not exists public.veiculos_status_historico (
  id uuid primary key default gen_random_uuid(),
  veiculo_id uuid not null, -- sem FK de propósito: o histórico fica mesmo se o veículo for excluído
  placa text,
  status_anterior text,
  status_novo text not null,
  em timestamptz not null default now(),
  alterado_por uuid default auth.uid()
);
create index if not exists veiculos_status_historico_veiculo on public.veiculos_status_historico (veiculo_id, em);

alter table public.veiculos_status_historico enable row level security;
drop policy if exists veiculos_status_historico_leitura on public.veiculos_status_historico;
create policy veiculos_status_historico_leitura on public.veiculos_status_historico
  for select to authenticated using (true);

create or replace function public.registrar_historico_status()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.veiculos_status_historico (veiculo_id, placa, status_anterior, status_novo)
    values (new.id, new.placa, null, new.status);
  elsif old.status is distinct from new.status then
    insert into public.veiculos_status_historico (veiculo_id, placa, status_anterior, status_novo)
    values (new.id, new.placa, old.status, new.status);
  end if;
  return new;
exception when others then
  raise warning 'registrar_historico_status: %', sqlerrm;
  return new;
end;
$$;
revoke all on function public.registrar_historico_status() from public, anon, authenticated;

drop trigger if exists trigger_historico_status_veiculo on public.veiculos;
create trigger trigger_historico_status_veiculo
  after insert or update of status on public.veiculos
  for each row execute function public.registrar_historico_status();

-- Ponto de partida do histórico: as vendas com data conhecida (desde 28/09/2026).
insert into public.veiculos_status_historico (veiculo_id, placa, status_anterior, status_novo, em, alterado_por)
select v.id, v.placa, null, 'vendido', v.data_venda, null
  from public.veiculos v
 where v.data_venda is not null
   and not exists (select 1 from public.veiculos_status_historico h where h.veiculo_id = v.id);

-- Para desfazer:
--   drop trigger if exists trigger_historico_status_veiculo on public.veiculos;
--   drop function if exists public.registrar_historico_status();
--   drop table if exists public.veiculos_status_historico;
--   drop trigger if exists trigger_registrar_datas_status on public.veiculos;
--   recriar registrar_data_venda/trigger_registrar_data_venda (backup no item 3) e, se desejado, o gatilho de fotos (item 1);
--   alter table public.veiculos drop column data_devolucao, drop column entrada_estoque_em;
