-- Generaliza get_wm_dashboard(p_loja_id) pra qualquer plataforma, em vez de
-- só Webmotors. Usada pela tela de log por plataforma em acordeão
-- (src/components/admin/portais/PlatformSyncPanel.tsx). get_wm_dashboard
-- continua existindo, sem uso novo — não removida pra não quebrar nada que
-- ainda dependa dela.
create or replace function public.get_platform_sync_dashboard(p_platform text)
returns jsonb
language plpgsql
security definer
as $function$
declare
  plat_id uuid;
  total_pub integer;
  errors_7d integer;
  pending_syncs integer;
  leads_7d integer;
begin
  select id into plat_id from public.plataformas where slug = p_platform limit 1;

  select count(*) into total_pub
  from public.estoque_publicacoes
  where platform = p_platform and status in ('publicado', 'active', 'agendado');

  select count(*) into errors_7d
  from public.sync_log
  where plataforma_id = plat_id
    and status = 'erro'
    and created_at > now() - interval '7 days';

  select count(*) into pending_syncs
  from public.sync_log
  where plataforma_id = plat_id
    and status = 'pending';

  select count(*) into leads_7d
  from public.leads l
  where l.created_at > now() - interval '7 days'
    and l.veiculo_id in (
      select veiculo_id from public.estoque_publicacoes where platform = p_platform
    );

  return jsonb_build_object(
    'total_published', coalesce(total_pub, 0),
    'sync_errors_7d', coalesce(errors_7d, 0),
    'pending_syncs', coalesce(pending_syncs, 0),
    'leads_7d', coalesce(leads_7d, 0)
  );
end;
$function$;
