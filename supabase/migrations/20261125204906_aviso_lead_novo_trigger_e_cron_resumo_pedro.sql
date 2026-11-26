-- 25/11/2026 (Bloco B do Pedro, autorizado pela Adriana).
-- Pré-requisito conferido: templates aviso_novo_lead e resumo_diario_leads APROVADOS (UTILITY) na
-- conta CRM_IA; funções aviso-lead-novo e resumo-leads-cron no ar (PR #41), verify_jwt=false,
-- ensaio (dry_run) com 200 e chamada sem segredo com 401.
--
-- 1) Todo lead novo chama a Edge Function aviso-lead-novo (template aviso_novo_lead ao Pedro).
--    A chamada é assíncrona (pg_net): não atrasa nem impede a criação do lead; qualquer erro
--    vira só um WARNING. Timeout de 30 s porque a 1ª chamada de função fria passou de 5 s.
create or replace function public.notificar_aviso_lead_novo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/aviso-lead-novo',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', coalesce(public.get_internal_service_secret(), '')),
    body := jsonb_build_object('lead_id', new.id),
    timeout_milliseconds := 30000
  );
  return new;
exception when others then
  raise warning 'notificar_aviso_lead_novo: %', sqlerrm;
  return new;
end;
$$;

revoke all on function public.notificar_aviso_lead_novo() from public, anon, authenticated;

drop trigger if exists trg_aviso_lead_novo on public.leads;
create trigger trg_aviso_lead_novo
  after insert on public.leads
  for each row execute function public.notificar_aviso_lead_novo();

-- 2) Resumo de leads às 8h de Brasília (11:00 UTC) para o Pedro.
select cron.schedule(
  'resumo-leads-pedro',
  '0 11 * * *',
  $cron$
  select net.http_post(
    url := 'https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/resumo-leads-cron',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', coalesce(public.get_internal_service_secret(), '')),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $cron$
);

-- Para desfazer:
--   drop trigger if exists trg_aviso_lead_novo on public.leads;
--   drop function if exists public.notificar_aviso_lead_novo();
--   select cron.unschedule('resumo-leads-pedro');
