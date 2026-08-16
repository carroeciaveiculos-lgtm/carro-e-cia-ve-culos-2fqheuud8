-- Automação do NaPista (pedido da Adriana, 15/08/2026) — etapas 7-8 de
-- docs/integracao-napista.md: enfileiramento automático quando o veículo
-- muda + cron de sincronização periódica, mesmo padrão do Mercado Livre.
--
-- NaPista usa a mesma tabela da Webmotors (estoque_publicacoes, log
-- append-only por evento), não uma tabela própria como o ml_listings do
-- Mercado Livre. Esse desenho já causou anúncio duplicado na Webmotors em
-- 10/08/2026 (ver 20260810214500_corrige_laco_republicacao_webmotors.sql):
-- o UPDATE de sucesso (publicado_webmotors = true) reenfileirava
-- pending_create de novo, criando um segundo anúncio.
--
-- Este gatilho já nasce com a trava que faltou na Webmotors na época:
-- só enfileira 'pending_create' se ainda não existe post_id (nenhuma
-- publicação anterior pra esse veículo+plataforma). napista-sync (já
-- testada e em produção) não foi alterada.
CREATE OR REPLACE FUNCTION public.trigger_napista_sync_on_veiculo_change()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  existing_post_id text;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    SELECT post_id INTO existing_post_id
    FROM public.estoque_publicacoes
    WHERE veiculo_id = NEW.id AND platform = 'napista'
    ORDER BY created_at DESC LIMIT 1;

    -- Veículo passou a ser publicado agora (false/null -> true) E ainda não
    -- tem anúncio criado. A checagem de existing_post_id é o que impede o
    -- laço que aconteceu na Webmotors.
    IF (OLD.publicado_napista IS DISTINCT FROM true AND NEW.publicado_napista = true
        AND existing_post_id IS NULL) THEN
      INSERT INTO public.estoque_publicacoes (veiculo_id, platform, status)
      VALUES (NEW.id, 'napista', 'pending_create');

    -- Já estava publicado e algo relevante mudou -> atualizar
    ELSIF NEW.publicado_napista = true AND existing_post_id IS NOT NULL AND (
      OLD.preco_venda IS DISTINCT FROM NEW.preco_venda OR
      OLD.quilometragem IS DISTINCT FROM NEW.quilometragem OR
      OLD.descricao IS DISTINCT FROM NEW.descricao
    ) THEN
      INSERT INTO public.estoque_publicacoes (veiculo_id, platform, status, post_id)
      VALUES (NEW.id, 'napista', 'pending_update', existing_post_id);

    -- Deixou de ser publicado -> fechar anúncio
    ELSIF (OLD.publicado_napista = true AND NEW.publicado_napista IS DISTINCT FROM true) THEN
      IF existing_post_id IS NOT NULL THEN
        INSERT INTO public.estoque_publicacoes (veiculo_id, platform, status, post_id)
        VALUES (NEW.id, 'napista', 'pending_close', existing_post_id);
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_napista_sync_veiculos ON public.veiculos;
CREATE TRIGGER trigger_napista_sync_veiculos
  AFTER UPDATE OF publicado_napista, preco_venda, quilometragem, descricao
  ON public.veiculos
  FOR EACH ROW EXECUTE FUNCTION public.trigger_napista_sync_on_veiculo_change();

-- Cron a cada 30min chamando napista-sync, mesmo intervalo do ml-sync-cron-job.
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  BEGIN
    PERFORM cron.unschedule('napista-sync-cron-job');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

SELECT cron.schedule(
  'napista-sync-cron-job',
  '*/30 * * * *',
  $cron$
    SELECT net.http_post(
      url := 'https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/napista-sync',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    );
  $cron$
);
