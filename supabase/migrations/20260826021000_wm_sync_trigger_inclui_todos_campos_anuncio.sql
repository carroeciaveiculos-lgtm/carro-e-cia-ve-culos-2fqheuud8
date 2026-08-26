-- Mesmo padrao de bug do ML corrigido antes: o gatilho da Webmotors dispara
-- em qualquer UPDATE, mas so enfileirava reenvio quando Preco, Quilometragem
-- ou Descricao mudavam -- editar Portas, Ano, Placa, ou qualquer um dos
-- campos S/N (Blindado, Alienado, Unico Dono, etc.) ou os opcionais/
-- diferenciais nunca reenviava pra Webmotors. Corrigido pra cobrir todo
-- campo que o XML do anuncio (buildAnuncioXML) realmente le direto do
-- veiculo -- pedido da Adriana 26/08/2026.
CREATE OR REPLACE FUNCTION public.trigger_wm_sync_on_veiculo_change()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  existing_post_id text;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    SELECT post_id INTO existing_post_id
    FROM public.estoque_publicacoes
    WHERE veiculo_id = NEW.id AND platform = 'webmotors'
    ORDER BY created_at DESC LIMIT 1;

    IF (OLD.publicado_webmotors IS DISTINCT FROM true AND NEW.publicado_webmotors = true
        AND existing_post_id IS NULL) THEN
      INSERT INTO public.estoque_publicacoes (veiculo_id, platform, status)
      VALUES (NEW.id, 'webmotors', 'pending_create');

    ELSIF NEW.publicado_webmotors = true AND existing_post_id IS NOT NULL AND (
      OLD.preco_venda IS DISTINCT FROM NEW.preco_venda OR
      OLD.preco_revenda IS DISTINCT FROM NEW.preco_revenda OR
      OLD.quilometragem IS DISTINCT FROM NEW.quilometragem OR
      OLD.descricao IS DISTINCT FROM NEW.descricao OR
      OLD.portas IS DISTINCT FROM NEW.portas OR
      OLD.ano_modelo IS DISTINCT FROM NEW.ano_modelo OR
      OLD.ano_fabricacao IS DISTINCT FROM NEW.ano_fabricacao OR
      OLD.placa IS DISTINCT FROM NEW.placa OR
      OLD.adaptado_deficientes IS DISTINCT FROM NEW.adaptado_deficientes OR
      OLD.alienado IS DISTINCT FROM NEW.alienado OR
      OLD.blindado IS DISTINCT FROM NEW.blindado OR
      OLD.garantia_fabrica IS DISTINCT FROM NEW.garantia_fabrica OR
      OLD.ipva_pago IS DISTINCT FROM NEW.ipva_pago OR
      OLD.revisado_oficina IS DISTINCT FROM NEW.revisado_oficina OR
      OLD.revisoes_concessionaria IS DISTINCT FROM NEW.revisoes_concessionaria OR
      OLD.unico_dono IS DISTINCT FROM NEW.unico_dono OR
      OLD.licenciado IS DISTINCT FROM NEW.licenciado OR
      OLD.diferenciais IS DISTINCT FROM NEW.diferenciais
    ) THEN
      INSERT INTO public.estoque_publicacoes (veiculo_id, platform, status, post_id)
      VALUES (NEW.id, 'webmotors', 'pending_update', existing_post_id);

    ELSIF (OLD.publicado_webmotors = true AND NEW.publicado_webmotors IS DISTINCT FROM true) THEN
      IF existing_post_id IS NOT NULL THEN
        INSERT INTO public.estoque_publicacoes (veiculo_id, platform, status, post_id)
        VALUES (NEW.id, 'webmotors', 'pending_close', existing_post_id);
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
