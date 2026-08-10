-- Corrige o laço de republicação da Webmotors.
--
-- Problema observado ao vivo em 10/08/2026: o wm-sync, ao publicar com sucesso,
-- marca veiculos.publicado_webmotors = true. Esse UPDATE dispara este trigger,
-- que enfileirava um 'pending_create' — ou seja, toda publicação bem-sucedida se
-- reenfileirava, e a execução seguinte chamaria IncluirCarro de novo, criando
-- anúncio DUPLICADO na Webmotors.
-- Cronologia real: publicação às 21:04:37, pending_create às 21:04:38.
--
-- Correção: o primeiro ramo só enfileira 'pending_create' quando ainda não
-- existe publicação anterior (existing_post_id IS NULL). A variável já era
-- carregada logo acima; só não era usada nessa condição. Se já existe post_id,
-- o caso correto é 'pending_update', tratado no ramo seguinte.
--
-- O resto da função fica idêntico ao que estava em produção.

create or replace function public.trigger_wm_sync_on_veiculo_change()
returns trigger
language plpgsql
as $function$
DECLARE
  existing_post_id text;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    SELECT post_id INTO existing_post_id
    FROM public.estoque_publicacoes
    WHERE veiculo_id = NEW.id AND platform = 'webmotors'
    ORDER BY created_at DESC LIMIT 1;

    -- Veículo passou a ser publicado agora (false/null -> true) E ainda não tem
    -- anúncio criado. A checagem de existing_post_id é o que impede o laço.
    IF (OLD.publicado_webmotors IS DISTINCT FROM true AND NEW.publicado_webmotors = true
        AND existing_post_id IS NULL) THEN
      INSERT INTO public.estoque_publicacoes (veiculo_id, platform, status)
      VALUES (NEW.id, 'webmotors', 'pending_create');

    -- Já estava publicado e algo relevante mudou -> atualizar
    ELSIF NEW.publicado_webmotors = true AND existing_post_id IS NOT NULL AND (
      OLD.preco_venda IS DISTINCT FROM NEW.preco_venda OR
      OLD.quilometragem IS DISTINCT FROM NEW.quilometragem OR
      OLD.descricao IS DISTINCT FROM NEW.descricao
    ) THEN
      INSERT INTO public.estoque_publicacoes (veiculo_id, platform, status, post_id)
      VALUES (NEW.id, 'webmotors', 'pending_update', existing_post_id);

    -- Deixou de ser publicado -> fechar anúncio
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

-- Mitigação do que o laço já produziu: cancela os 'pending_create' órfãos de
-- veículos que já têm publicação concluída. Sem isto, a próxima execução do
-- wm-sync duplicaria o anúncio 26117966 (VW up! move).
update estoque_publicacoes p
   set status = 'cancelado'
 where p.platform = 'webmotors'
   and p.status = 'pending_create'
   and exists (
     select 1 from estoque_publicacoes q
      where q.veiculo_id = p.veiculo_id
        and q.platform = p.platform
        and q.status = 'publicado'
   );
