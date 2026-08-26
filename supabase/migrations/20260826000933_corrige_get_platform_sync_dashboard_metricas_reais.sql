-- Corrige get_platform_sync_dashboard (achado real, pedido da Adriana 25/08/2026):
-- 1) total_published pro Mercado Livre sempre voltava 0 -- a function só olhava
--    estoque_publicacoes, tabela que o ML nunca usa (ML usa ml_listings).
-- 2) pending_syncs contava sync_log com status='pending' -- um status que
--    nenhuma function atual grava mais (confirmado lendo ml-sync/wm-sync/
--    napista-sync/index.ts). Resultado: 2 linhas orfas de 22-23/07/2026 (GWM
--    Haval H6 e BMW 320iA, ja publicados normalmente ha semanas) contadas como
--    "pendente" pra sempre, sem nenhuma relacao com a fila real. Corrigido pra
--    contar da fila de verdade de cada plataforma: ml_listings pro Mercado
--    Livre, estoque_publicacoes pras demais.
CREATE OR REPLACE FUNCTION public.get_platform_sync_dashboard(p_platform text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  plat_id uuid;
  total_pub integer;
  errors_7d integer;
  pending_syncs integer;
  leads_7d integer;
begin
  select id into plat_id from public.plataformas where slug = p_platform limit 1;

  if p_platform = 'mercadolivre' then
    select count(*) into total_pub
    from public.ml_listings
    where status = 'active';

    select count(*) into pending_syncs
    from public.ml_listings
    where status in ('pending_create', 'pending_update', 'pending_close');
  else
    select count(*) into total_pub
    from public.estoque_publicacoes
    where platform = p_platform and status in ('publicado', 'active', 'agendado');

    select count(*) into pending_syncs
    from public.estoque_publicacoes
    where platform = p_platform
      and status in ('pending_create', 'pending_update', 'pending_close', 'agendado');
  end if;

  select count(*) into errors_7d
  from public.sync_log
  where plataforma_id = plat_id
    and status = 'erro'
    and created_at > now() - interval '7 days';

  select count(*) into leads_7d
  from public.leads l
  where l.created_at > now() - interval '7 days'
    and l.veiculo_id in (
      select veiculo_id from public.estoque_publicacoes where platform = p_platform
      union
      select veiculo_id from public.ml_listings where p_platform = 'mercadolivre'
    );

  return jsonb_build_object(
    'total_published', coalesce(total_pub, 0),
    'sync_errors_7d', coalesce(errors_7d, 0),
    'pending_syncs', coalesce(pending_syncs, 0),
    'leads_7d', coalesce(leads_7d, 0)
  );
end;
$function$;
