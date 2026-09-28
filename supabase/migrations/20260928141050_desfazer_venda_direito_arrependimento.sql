-- Botão "Desfazer Venda" (pedido da Adriana, 27-28/09/2026): cliente pode
-- desistir da compra em até 7 dias úteis (direito de arrependimento do CDC).
--
-- data_venda é preenchida/limpa automaticamente por gatilho -- não pelo
-- código da tela -- seguindo o mesmo padrão já usado pra alterado_por/
-- alterado_em (20260919125435_veiculos_rastro_alteracao.sql): existe mais de
-- um caminho que marca um veículo como vendido (botão do painel e o comando
-- "VENDIDO" do WhatsApp administrativo, handleVendido em
-- _shared/whatsapp-estoque.ts), um gatilho garante que os dois preenchem
-- igual, inclusive caminhos futuros que ainda não existem.
--
-- Veículos já vendidos ANTES desta migration ficam com data_venda = NULL --
-- não existia esse campo antes, não dá pra inventar a data real da venda.
-- NULL é tratado no código da tela como "prazo desconhecido, permite
-- desfazer sem checar prazo" (não como "prazo sempre expirado").

alter table public.veiculos add column if not exists data_venda timestamptz;
comment on column public.veiculos.data_venda is 'Preenchida automaticamente (gatilho trigger_registrar_data_venda) quando o status muda para vendido; limpa quando sai de vendido. Usada para calcular o prazo de 7 dias úteis de desistência (CDC). NULL = venda registrada antes deste campo existir, ou veículo nunca foi vendido.';

create or replace function public.registrar_data_venda()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'vendido' and (old.status is distinct from 'vendido') then
    new.data_venda := now();
  elsif new.status is distinct from 'vendido' and old.status = 'vendido' then
    new.data_venda := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trigger_registrar_data_venda on public.veiculos;
create trigger trigger_registrar_data_venda
  before update of status on public.veiculos
  for each row execute function public.registrar_data_venda();

-- Uma linha por desistência de venda -- histórico separado, porque
-- veiculos.alterado_por/alterado_em (rastro genérico) é sobrescrito a cada
-- UPDATE seguinte e não preservaria quem desfez a venda nem o motivo.
create table if not exists public.desistencias_venda (
  id uuid primary key default gen_random_uuid(),
  veiculo_id uuid not null references public.veiculos(id) on delete cascade,
  motivo text not null,
  criado_por uuid references public.usuarios(id),
  criado_em timestamptz not null default now()
);
comment on table public.desistencias_venda is 'Registro de toda vez que uma venda é desfeita dentro do prazo legal de 7 dias úteis (botão "Desfazer Venda", aba Vendidos). Uma linha por desistência.';

alter table public.desistencias_venda enable row level security;

drop policy if exists "allow_auth_all_desistencias_venda" on public.desistencias_venda;
create policy "allow_auth_all_desistencias_venda" on public.desistencias_venda
  for all to authenticated using (true) with check (true);
