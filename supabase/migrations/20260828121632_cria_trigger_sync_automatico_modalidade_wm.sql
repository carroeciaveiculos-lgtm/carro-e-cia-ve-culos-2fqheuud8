-- Pedido da Adriana 28/08/2026: trocar a modalidade pelo seletor da tela
-- (updateModalidadeWebmotors, so grava codigo_modalidade_wm aqui em
-- wm_mapeamento_veiculos) nunca disparava nada -- o gatilho existente
-- (trigger_wm_sync_on_veiculo_change) so olha a tabela veiculos, nao esta.
-- Sem isso, a troca ficava "guardada" no banco sem efeito real ate alguem
-- clicar em "Publicar/Sincronizar Agora". Este gatilho novo enfileira
-- 'pending_modalidade' quando a modalidade muda pra um veiculo ja publicado
-- com anuncio real -- o cron de wm-sync (ja roda a cada 30min, jobid 11)
-- pega sozinho na proxima rodada e chama TrocarModalidadeCarro (implementado
-- hoje em wm-soap.ts/wm-sync).
CREATE OR REPLACE FUNCTION public.trigger_wm_sync_on_modalidade_change()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  veiculo_publicado boolean;
  existing_post_id text;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.codigo_modalidade_wm IS DISTINCT FROM NEW.codigo_modalidade_wm
     AND NEW.codigo_modalidade_wm IS NOT NULL THEN
    SELECT publicado_webmotors INTO veiculo_publicado
    FROM public.veiculos WHERE id = NEW.veiculo_id;

    IF veiculo_publicado = true THEN
      SELECT post_id INTO existing_post_id
      FROM public.estoque_publicacoes
      WHERE veiculo_id = NEW.veiculo_id AND platform = 'webmotors' AND post_id IS NOT NULL
      ORDER BY created_at DESC LIMIT 1;

      IF existing_post_id IS NOT NULL THEN
        INSERT INTO public.estoque_publicacoes (veiculo_id, platform, status, post_id)
        VALUES (NEW.veiculo_id, 'webmotors', 'pending_modalidade', existing_post_id);
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS wm_sync_on_modalidade_change ON public.wm_mapeamento_veiculos;
CREATE TRIGGER wm_sync_on_modalidade_change
AFTER UPDATE ON public.wm_mapeamento_veiculos
FOR EACH ROW
EXECUTE FUNCTION public.trigger_wm_sync_on_modalidade_change();
