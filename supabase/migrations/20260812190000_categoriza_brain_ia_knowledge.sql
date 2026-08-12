-- Categoriza a base de conhecimento da IA (12/08/2026, pedido da Adriana).
-- Achado da auditoria de leads: a Clara (SDR) carregava as 10 entradas mais
-- recentes de brain_ia_knowledge inteira, sem filtro — inclusive regras de
-- SEO de blog, sem nada a ver com atendimento de vendas, competindo por
-- espaço no prompt dela. Categorias: 'sdr' (vai pro prompt da Clara),
-- 'seo_blog' (regras de conteúdo/blog), 'geral' (default, também injetado
-- na Clara como contexto amplo).
alter table public.brain_ia_knowledge add column if not exists categoria text not null default 'geral';

update public.brain_ia_knowledge set categoria = 'sdr'
where titulo = 'Regras de atendimento SDR';

update public.brain_ia_knowledge set categoria = 'seo_blog'
where titulo in (
  'Regras para IA criadora de conteúdos para o blog',
  'Regras SEO padrão para criação de artigos',
  'Padrão SEO Carro e Cia Motors — Versão 2.0'
);
