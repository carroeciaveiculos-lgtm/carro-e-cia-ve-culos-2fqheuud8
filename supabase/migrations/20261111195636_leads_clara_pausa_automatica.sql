-- Retomada automática da Clara (pedido da Adriana, 11/11/2026).
--
-- Regra: atendente respondendo por TEXTO no painel PAUSA a Clara (como já era, desde 17/09/2026),
-- e agora grava a hora em ai_desligada_auto_em. Se o cliente escrever e ficar 2 h sem resposta,
-- a função clara-retomada-cron religa a Clara e ela responde. Desligar pelo BOTÃO continua
-- definitivo (coluna nula), assim como "pedir humano" e "encaminhar a parceiro" do ai-sdr.
--
-- Rollback:
--   drop trigger if exists trg_leads_limpa_pausa_auto_clara on public.leads;
--   drop function if exists public.leads_limpa_pausa_auto_clara();
--   alter table public.leads drop column if exists ai_desligada_auto_em;

alter table public.leads
  add column if not exists ai_desligada_auto_em timestamptz;

comment on column public.leads.ai_desligada_auto_em is
  'Hora em que a Clara foi PAUSADA automaticamente porque um atendente respondeu por texto. '
  'Nulo = desligamento manual/definitivo (ou Clara ligada). Usado por clara-retomada-cron.';

-- Qualquer mudança de ai_enabled que NÃO mexa explicitamente nesta coluna limpa a marca:
-- botão do painel (liga ou desliga), "pedir humano", "encaminhar a parceiro" e qualquer caminho
-- futuro. Só quem grava a marca junto (send-whatsapp) ou a limpa junto (o cron) fica como pediu.
-- Assim nenhuma tela precisa lembrar de apagar a marca.
create or replace function public.leads_limpa_pausa_auto_clara()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.ai_enabled is distinct from old.ai_enabled
     and new.ai_desligada_auto_em is not distinct from old.ai_desligada_auto_em then
    new.ai_desligada_auto_em := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_leads_limpa_pausa_auto_clara on public.leads;
create trigger trg_leads_limpa_pausa_auto_clara
  before update of ai_enabled on public.leads
  for each row
  execute function public.leads_limpa_pausa_auto_clara();

-- Busca do cron: só leads pausados automaticamente (poucos), sem varrer a tabela.
create index if not exists idx_leads_ai_desligada_auto_em
  on public.leads (ai_desligada_auto_em)
  where ai_desligada_auto_em is not null;
