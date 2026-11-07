-- Central de Redes Sociais: guardar de onde veio a conversa e qual post foi comentado.
-- Colunas opcionais (nulas nas linhas antigas); nada existente é alterado.
alter table public.social_conversas add column if not exists origem_contato text;
alter table public.social_conversas add column if not exists contato_usuario text;
alter table public.social_comments add column if not exists post_link text;
alter table public.social_comments add column if not exists post_resumo text;
