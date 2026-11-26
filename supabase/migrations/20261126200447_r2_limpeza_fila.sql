-- 26/11/2026: limpeza de fotos do R2 de veículos vendidos/devolvidos/excluídos (autorizado pela Adriana em 26/11/2026).
-- Plano e decisões: MEMORY_WORK.MD, bloco de 26/11/2026. Resumo das decisões:
--   * 30 dias corridos depois de virar vendido OU devolvido (desfazer venda vale até 7 dias úteis);
--   * mantém a 1ª foto (capa) do vendido/devolvido; o resto vai para lixeira/ no R2 (expira em 30 dias);
--   * excluído: todas as fotos/vídeos, também 30 dias depois (a linha some, por isso as URLs são guardadas antes).
-- Esta migration só ANOTA o que limpar. Quem mexe no R2 é a Edge Function r2-limpeza, que começa em modo de
-- ensaio (não apaga nada) e reconfere tudo no dia. Vender/excluir veículo nunca falha por causa daqui
-- (erros viram só WARNING).

-- 1) Fila
create table if not exists public.r2_limpeza_fila (
  id uuid primary key default gen_random_uuid(),
  veiculo_id uuid not null, -- sem FK de propósito: o veículo pode ter sido excluído
  placa text,
  motivo text not null check (motivo in ('vendido', 'devolvido', 'excluido')),
  urls jsonb not null default '[]'::jsonb, -- foto/vídeo do veículo no momento da anotação
  manter_capa boolean not null default true,
  status text not null default 'pendente' check (status in ('pendente', 'cancelado', 'concluido', 'erro')),
  agendado_para timestamptz not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  executado_em timestamptz,
  resultado jsonb -- último ensaio ou execução: o que apagaria/apagou, o que ficou protegido e por quê
);

create unique index if not exists r2_limpeza_fila_um_pendente_por_veiculo
  on public.r2_limpeza_fila (veiculo_id) where status = 'pendente';
create index if not exists r2_limpeza_fila_vencidos
  on public.r2_limpeza_fila (agendado_para) where status = 'pendente';

-- 2) Registro de cada execução (ensaio, real, inventário)
create table if not exists public.r2_limpeza_execucoes (
  id uuid primary key default gen_random_uuid(),
  executado_em timestamptz not null default now(),
  modo text not null check (modo in ('ensaio', 'real', 'inventario')),
  resumo jsonb,
  erro text
);

alter table public.r2_limpeza_fila enable row level security;
alter table public.r2_limpeza_execucoes enable row level security;

-- Leitura só para admin master e gerente; escrita só pelo banco (regra abaixo) e pela function (service role).
drop policy if exists r2_limpeza_fila_leitura_admin on public.r2_limpeza_fila;
create policy r2_limpeza_fila_leitura_admin on public.r2_limpeza_fila
  for select to authenticated using (public.usuario_tem_nivel(array['admin_master', 'gerente']));
drop policy if exists r2_limpeza_execucoes_leitura_admin on public.r2_limpeza_execucoes;
create policy r2_limpeza_execucoes_leitura_admin on public.r2_limpeza_execucoes
  for select to authenticated using (public.usuario_tem_nivel(array['admin_master', 'gerente']));

-- 3) URLs de mídia de um veículo (fotos, vídeos, vídeo avulso, fotos do criativo)
create or replace function public.r2_urls_do_veiculo(v public.veiculos)
returns jsonb
language sql
immutable
set search_path = public
as $$
  select coalesce(jsonb_agg(distinct u), '[]'::jsonb)
  from (
    select jsonb_array_elements_text(case when jsonb_typeof(v.fotos) = 'array' then v.fotos else '[]'::jsonb end) u
    union all
    select jsonb_array_elements_text(case when jsonb_typeof(v.videos) = 'array' then v.videos else '[]'::jsonb end)
    union all
    select jsonb_array_elements_text(case when jsonb_typeof(v.fotos_criativo) = 'array' then v.fotos_criativo else '[]'::jsonb end)
    union all
    select v.video_url where v.video_url is not null and v.video_url <> ''
  ) x
  where u like 'https://imagens.carroeciamotors.com.br/%';
$$;

-- 4) Regra no banco: anota / cancela a limpeza conforme o status muda, e guarda as URLs antes de excluir
create or replace function public.r2_limpeza_agendar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    update public.r2_limpeza_fila
       set motivo = 'excluido', urls = public.r2_urls_do_veiculo(old), manter_capa = false,
           agendado_para = now() + interval '30 days', atualizado_em = now()
     where veiculo_id = old.id and status = 'pendente';
    if not found then
      insert into public.r2_limpeza_fila (veiculo_id, placa, motivo, urls, manter_capa, agendado_para)
      values (old.id, old.placa, 'excluido', public.r2_urls_do_veiculo(old), false, now() + interval '30 days');
    end if;
    return old;
  end if;

  -- UPDATE de status
  if new.status in ('vendido', 'devolvido') and old.status is distinct from new.status then
    update public.r2_limpeza_fila
       set motivo = new.status, urls = public.r2_urls_do_veiculo(new), manter_capa = true,
           agendado_para = now() + interval '30 days', atualizado_em = now()
     where veiculo_id = new.id and status = 'pendente';
    if not found then
      insert into public.r2_limpeza_fila (veiculo_id, placa, motivo, urls, manter_capa, agendado_para)
      values (new.id, new.placa, new.status, public.r2_urls_do_veiculo(new), true, now() + interval '30 days');
    end if;
  elsif old.status in ('vendido', 'devolvido') and new.status not in ('vendido', 'devolvido') then
    -- Venda desfeita / carro voltou: nada a limpar.
    update public.r2_limpeza_fila
       set status = 'cancelado', atualizado_em = now(),
           resultado = jsonb_build_object('cancelado_porque', 'voltou para ' || new.status)
     where veiculo_id = new.id and status = 'pendente';
  end if;
  return new;
exception when others then
  raise warning 'r2_limpeza_agendar: %', sqlerrm;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function public.r2_limpeza_agendar() from public, anon, authenticated;

drop trigger if exists trg_r2_limpeza_status on public.veiculos;
create trigger trg_r2_limpeza_status
  after update of status on public.veiculos
  for each row execute function public.r2_limpeza_agendar();

drop trigger if exists trg_r2_limpeza_exclusao on public.veiculos;
create trigger trg_r2_limpeza_exclusao
  before delete on public.veiculos
  for each row execute function public.r2_limpeza_agendar();

-- 5) Onde cada URL do R2 aparece no banco (para nunca apagar foto que outro lugar usa, e para o inventário).
-- Varre todas as colunas de texto/JSON das tabelas do schema public. Devolve a tabela, a coluna e, quando a
-- tabela tem, o veiculo_id e o status da linha. Só a service role (Edge Function) executa.
create or replace function public.r2_referencias_urls()
returns table (url text, tabela text, coluna text, veiculo_id uuid, status_linha text)
language plpgsql
security definer
set search_path = public
as $$
declare
  c record;
  tem_veiculo boolean;
  tem_status boolean;
begin
  for c in
    select col.table_name, col.column_name
      from information_schema.columns col
      join information_schema.tables t
        on t.table_schema = col.table_schema and t.table_name = col.table_name and t.table_type = 'BASE TABLE'
     where col.table_schema = 'public'
       and col.data_type in ('text', 'character varying', 'jsonb', 'json', 'ARRAY')
       and col.table_name not in ('r2_limpeza_fila', 'r2_limpeza_execucoes')
  loop
    tem_veiculo := exists (select 1 from information_schema.columns
                            where table_schema = 'public' and table_name = c.table_name and column_name = 'veiculo_id');
    tem_status := exists (select 1 from information_schema.columns
                           where table_schema = 'public' and table_name = c.table_name and column_name = 'status');
    return query execute format(
      'select distinct m[1], %L::text, %L::text, %s, %s
         from public.%I, regexp_matches(%I::text, %L, %L) m
        where %I::text like %L',
      c.table_name, c.column_name,
      case when c.table_name = 'veiculos' then 'id' when tem_veiculo then 'veiculo_id' else 'null::uuid' end,
      case when tem_status then 'status::text' else 'null::text' end,
      c.table_name, c.column_name,
      'https://imagens\.carroeciamotors\.com\.br/[^"''\s\\,)\]<>]+', 'g',
      c.column_name, '%imagens.carroeciamotors.com.br%'
    );
  end loop;
end;
$$;

revoke all on function public.r2_referencias_urls() from public, anon, authenticated;
grant execute on function public.r2_referencias_urls() to service_role;

-- Mesma lista num JSON único: a API do Supabase corta respostas em linhas em 1000, e lista cortada
-- faria uma foto em uso parecer livre. JSON numa linha só não tem esse corte.
create or replace function public.r2_referencias_urls_json()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(to_jsonb(r)), '[]'::jsonb) from public.r2_referencias_urls() r;
$$;

revoke all on function public.r2_referencias_urls_json() from public, anon, authenticated;
grant execute on function public.r2_referencias_urls_json() to service_role;

-- 6) Carros que JÁ estão vendidos/devolvidos e ainda têm mais de 1 foto: entram na fila com a data da venda + 30
-- (ou hoje, se já passou). A rotina começa em ensaio, então isso só gera relatório.
insert into public.r2_limpeza_fila (veiculo_id, placa, motivo, urls, manter_capa, agendado_para)
select v.id, v.placa, v.status, public.r2_urls_do_veiculo(v), true,
       greatest(coalesce(v.data_venda, v.updated_at::timestamptz, now()) + interval '30 days', now())
  from public.veiculos v
 where v.status in ('vendido', 'devolvido')
   and jsonb_array_length(public.r2_urls_do_veiculo(v)) > 1
   and not exists (select 1 from public.r2_limpeza_fila f where f.veiculo_id = v.id and f.status = 'pendente');

-- Para desfazer:
--   drop trigger if exists trg_r2_limpeza_status on public.veiculos;
--   drop trigger if exists trg_r2_limpeza_exclusao on public.veiculos;
--   drop function if exists public.r2_limpeza_agendar();
--   drop function if exists public.r2_referencias_urls();
--   drop function if exists public.r2_urls_do_veiculo(public.veiculos);
--   drop table if exists public.r2_limpeza_fila, public.r2_limpeza_execucoes;
