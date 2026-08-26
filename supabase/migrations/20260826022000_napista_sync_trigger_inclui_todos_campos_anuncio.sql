-- Mesmo padrao de bug do ML/Webmotors corrigido antes: o gatilho do NaPista
-- so observava publicado_napista/preco_venda/quilometragem/descricao -- Ano,
-- Placa e Portas (campos que buildOfferPayload realmente manda pra API do
-- NaPista) nunca disparavam reenvio. Corrigido -- pedido da Adriana
-- 26/08/2026.
CREATE OR REPLACE FUNCTION public.trigger_napista_sync_on_veiculo_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  existing_post_id text;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    SELECT post_id INTO existing_post_id
    FROM public.estoque_publicacoes
    WHERE veiculo_id = NEW.id AND platform = 'napista'
    ORDER BY created_at DESC LIMIT 1;

    IF (OLD.publicado_napista IS DISTINCT FROM true AND NEW.publicado_napista = true
        AND existing_post_id IS NULL) THEN
      INSERT INTO public.estoque_publicacoes (veiculo_id, platform, status)
      VALUES (NEW.id, 'napista', 'pending_create');

    ELSIF NEW.publicado_napista = true AND existing_post_id IS NOT NULL AND (
      OLD.preco_venda IS DISTINCT FROM NEW.preco_venda OR
      OLD.quilometragem IS DISTINCT FROM NEW.quilometragem OR
      OLD.descricao IS DISTINCT FROM NEW.descricao OR
      OLD.ano_modelo IS DISTINCT FROM NEW.ano_modelo OR
      OLD.ano_fabricacao IS DISTINCT FROM NEW.ano_fabricacao OR
      OLD.placa IS DISTINCT FROM NEW.placa OR
      OLD.portas IS DISTINCT FROM NEW.portas
    ) THEN
      INSERT INTO public.estoque_publicacoes (veiculo_id, platform, status, post_id)
      VALUES (NEW.id, 'napista', 'pending_update', existing_post_id);

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
  AFTER UPDATE OF publicado_napista, preco_venda, quilometragem, descricao,
    ano_modelo, ano_fabricacao, placa, portas
  ON public.veiculos
  FOR EACH ROW EXECUTE FUNCTION public.trigger_napista_sync_on_veiculo_change();
