-- Fase 2 da postagem automática (03/10/2026): marca de "em publicação" na fila.
-- publicar-social passa a travar o post (status 'Publicando' + este horário) antes de falar com a Meta,
-- para o cron de 15 min nunca publicar duas vezes o mesmo carrossel. Post travado há mais de 30 min
-- (function caiu no meio) volta pra 'Agendado' sozinho. Aditivo: nada existente muda.
ALTER TABLE public.social_posts
  ADD COLUMN IF NOT EXISTS publicando_em timestamptz;

COMMENT ON COLUMN public.social_posts.publicando_em IS 'Quando o publicador travou o post (status Publicando). Usado para destravar posts que ficaram presos.';
