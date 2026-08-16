-- Achado em 14/08/2026: estoque_publicacoes.platform tinha CHECK restrito a
-- ('facebook', 'instagram', 'webmotors') — NÃO era genérica pra qualquer
-- plataforma como o docs/integracao-napista.md tinha suposto sem checar.
-- Amplia pra permitir 'napista' também, reaproveitando a mesma tabela/fila
-- (post_id, status, payload) em vez de criar uma nova.
ALTER TABLE public.estoque_publicacoes DROP CONSTRAINT estoque_publicacoes_platform_check;
ALTER TABLE public.estoque_publicacoes
  ADD CONSTRAINT estoque_publicacoes_platform_check
  CHECK (platform = ANY (ARRAY['facebook'::text, 'instagram'::text, 'webmotors'::text, 'napista'::text]));
