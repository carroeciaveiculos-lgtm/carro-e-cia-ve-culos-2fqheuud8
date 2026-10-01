-- Resultado da publicação gravado no próprio post (30/09/2026): antes o motivo
-- do erro só ia pra logs_integracao e o post sumia da tela de aprovação sem
-- aviso. erro_msg = frase em português do motivo; publicado_em = quando saiu.
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS erro_msg text;
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS publicado_em timestamptz;
COMMENT ON COLUMN public.social_posts.erro_msg IS
  'Motivo da falha da última tentativa de publicar, em português (preenchido pela function publicar-social).';
COMMENT ON COLUMN public.social_posts.publicado_em IS
  'Quando o post foi publicado com sucesso em todas as redes pedidas.';
