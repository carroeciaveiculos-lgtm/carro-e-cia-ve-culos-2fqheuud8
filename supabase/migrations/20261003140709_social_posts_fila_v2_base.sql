-- Fase 1 do sistema de postagem automática (03/10/2026): base da fila em social_posts.
-- 100% aditivo: nenhuma coluna existente muda; posts manuais/antigos continuam funcionando
-- exatamente como antes (as colunas novas ficam vazias/padrão). publicar-social e a tela
-- Central Social NÃO são alterados nesta fase.

ALTER TABLE public.social_posts
  ADD COLUMN IF NOT EXISTS midias jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS formato text,
  ADD COLUMN IF NOT EXISTS rede text,
  ADD COLUMN IF NOT EXISTS origem text,
  ADD COLUMN IF NOT EXISTS ciclo integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS tentativas integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS post_externo_ids jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.social_posts.midias IS 'Lista de URLs de mídia do post (fotos do carrossel ou o vídeo). Vazia = usar a coluna imagem (posts antigos/manuais).';
COMMENT ON COLUMN public.social_posts.formato IS 'feed_carrossel | feed_foto | feed_video | story_foto | story_video. NULL = post manual/antigo (usa content_type).';
COMMENT ON COLUMN public.social_posts.rede IS 'Rede do post AUTOMÁTICO (uma linha por rede): facebook | instagram. NULL = post manual/antigo (usa a coluna redes).';
COMMENT ON COLUMN public.social_posts.origem IS 'manual | organico_diario | auto_novo (veículo novo) | auto_rodizio (estoque ativo).';
COMMENT ON COLUMN public.social_posts.ciclo IS 'Quantas vezes o veículo já entrou no rodízio nesse formato/rede (1 = primeira). Permite repetir meses depois sem violar a trava de duplicidade.';
COMMENT ON COLUMN public.social_posts.tentativas IS 'Tentativas de publicação já feitas (limita as repetições automáticas em caso de erro).';
COMMENT ON COLUMN public.social_posts.post_externo_ids IS 'IDs devolvidos pela Meta, por rede: {"facebook":"...","instagram":"..."}.';

-- Valores permitidos (NULL continua valendo para posts antigos/manuais).
ALTER TABLE public.social_posts
  ADD CONSTRAINT social_posts_formato_chk
    CHECK (formato IS NULL OR formato IN ('feed_carrossel','feed_foto','feed_video','story_foto','story_video')),
  ADD CONSTRAINT social_posts_rede_chk
    CHECK (rede IS NULL OR rede IN ('facebook','instagram')),
  ADD CONSTRAINT social_posts_origem_chk
    CHECK (origem IS NULL OR origem IN ('manual','organico_diario','auto_novo','auto_rodizio'));

-- Trava contra repetição: o mesmo veículo nunca ganha dois posts AUTOMÁTICOS iguais
-- (mesmo formato, mesma rede, mesmo ciclo). Posts manuais não entram na trava.
CREATE UNIQUE INDEX IF NOT EXISTS social_posts_auto_unico
  ON public.social_posts (veiculo_id, formato, rede, ciclo)
  WHERE origem IN ('auto_novo','auto_rodizio');

-- Índice da fila (o publicador e o orquestrador filtram por status e horário).
CREATE INDEX IF NOT EXISTS social_posts_fila_idx
  ON public.social_posts (status, data_agendamento);

-- Marca a origem dos posts que já existem (não mexe em mais nada).
UPDATE public.social_posts SET origem = 'organico_diario' WHERE content_type = 'post_organico_diario' AND origem IS NULL;
UPDATE public.social_posts SET origem = 'manual' WHERE origem IS NULL;
