-- Limpeza de avisos do Security/Performance Advisor sem efeito colateral:
-- 1) Fixa search_path das funções (mitiga search_path hijacking; mesma
--    resolução de schema que já valia por padrão, só deixa de depender da
--    sessão de quem chama).
-- 2) Remove índices literalmente duplicados (mesmas colunas, um dos pares).
-- Itens que exigiam revisão caso a caso (RLS sem policy, extensões no
-- schema public, funções SECURITY DEFINER executáveis por anon/authenticated,
-- índices não usados, políticas RLS múltiplas) ficaram de fora de propósito.

alter function public.update_timestamp_column() set search_path = public, pg_temp;
alter function public.update_agenda_updated_at() set search_path = public, pg_temp;
alter function public.update_autonomia_timestamp() set search_path = public, pg_temp;
alter function public.update_directive_timestamp() set search_path = public, pg_temp;
alter function public.update_ml_credentials_updated_at() set search_path = public, pg_temp;
alter function public.increment_page_view(p_slug text) set search_path = public, pg_temp;
alter function public.update_veiculo_status_on_nf() set search_path = public, pg_temp;
alter function public.slugify(input_text text) set search_path = public, pg_temp;
alter function public.generate_vehicle_slug() set search_path = public, pg_temp;
alter function public.notify_vehicle_sold_capi() set search_path = public, pg_temp;
alter function public.trigger_pages_version_insert() set search_path = public, pg_temp;
alter function public.trigger_articles_version_insert() set search_path = public, pg_temp;
alter function public.update_napista_credentials_updated_at() set search_path = public, pg_temp;
alter function public.notify_new_vehicle_trigger() set search_path = public, pg_temp;
alter function public.update_napista_mapeamento_updated_at() set search_path = public, pg_temp;
alter function public.match_napista_marca(texto_busca text) set search_path = public, pg_temp;
alter function public.match_napista_modelo(texto_busca text, p_marca_id text) set search_path = public, pg_temp;
alter function public.update_media_assets_updated_at() set search_path = public, pg_temp;
alter function public.update_conversa_ultima_msg_em() set search_path = public, pg_temp;
alter function public.handle_internal_note_notification() set search_path = public, pg_temp;
alter function public.auto_retry_stuck_ml_listings() set search_path = public, pg_temp;
alter function public.handle_lead_status_notification() set search_path = public, pg_temp;
alter function public.match_wm_marca(texto_busca text) set search_path = public, pg_temp;
alter function public.match_wm_modelo(texto_busca text, p_codigo_marca_wm text) set search_path = public, pg_temp;
alter function public.validar_limite_fotos_veiculo() set search_path = public, pg_temp;
alter function public.update_updated_at_column() set search_path = public, pg_temp;
alter function public.get_or_create_conversa(p_meta_account_id uuid, p_platform text, p_cliente_telefone text, p_cliente_nome text, p_cliente_id_externo text) set search_path = public, pg_temp;
alter function public.update_ai_prompts_config_updated_at() set search_path = public, pg_temp;
alter function public.trigger_ml_sync_on_veiculo_change() set search_path = public, pg_temp;
alter function public.clear_fotos_on_status_change() set search_path = public, pg_temp;
alter function public.get_wm_dashboard(p_loja_id uuid) set search_path = public, pg_temp;
alter function public.update_listing_preferences_updated_at() set search_path = public, pg_temp;
alter function public.replace_storage_url(p_bucket text, p_file_path text) set search_path = public, pg_temp;
alter function public.trigger_wm_sync_on_veiculo_change() set search_path = public, pg_temp;
alter function public.trigger_napista_sync_on_veiculo_change() set search_path = public, pg_temp;
alter function public.get_platform_sync_dashboard(p_platform text) set search_path = public, pg_temp;

drop index if exists public.idx_crm_conversa_status;
drop index if exists public.idx_crm_msg_conversa;
drop index if exists public.idx_estoque_veiculo;
