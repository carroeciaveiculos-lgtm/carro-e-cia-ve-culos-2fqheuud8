-- CRITICO: ao marcar publicado_webmotors=false pro HR-V (migracao anterior,
-- reverte_falso_positivo_hrv_wm_sync_ad_fantasma), o trigger
-- trigger_wm_sync_on_veiculo_change criou uma linha 'pending_close' pro
-- anuncio REAL (73668233, 20 fotos reais confirmadas via ObterFotosCarro).
-- Se um wm-sync rodasse antes dessa correcao, chamaria ExcluirCarro nesse
-- anuncio de verdade -- acao sem volta (confirmado nesta sessao: Webmotors
-- nao tem reativar, so criar anuncio novo). Removida antes que qualquer
-- sync (manual ou cron) processasse. O anuncio 73668233 continua travado
-- (43|36) mas intacto.
DELETE FROM public.estoque_publicacoes WHERE id = '2ae9e315-4134-43d1-b6e7-e286f155e278';
