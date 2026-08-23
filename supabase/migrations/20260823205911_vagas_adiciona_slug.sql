alter table public.vagas add column if not exists slug text;
create unique index if not exists vagas_slug_key on public.vagas (slug) where slug is not null;
