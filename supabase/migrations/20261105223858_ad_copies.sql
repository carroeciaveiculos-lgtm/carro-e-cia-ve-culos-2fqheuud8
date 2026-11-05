-- Anúncios gerados na aba "Criador de Anúncios" (Gestão de Anúncios IA), Fase 1.
-- Cada linha guarda UMA variação de texto gerada pela IA para um canal (Meta, Google
-- ou Orgânico) e um tipo de anúncio de veículo (estático, carrossel ou vídeo), com o
-- status de aprovação. Nada aqui publica anúncio: o texto é copiado e subido à mão.

create table public.ad_copies (
  id uuid primary key default gen_random_uuid(),
  veiculo_id uuid references public.veiculos(id) on delete cascade,
  -- 'veiculo' quando o texto é de um carro do estoque; nas Fases 2+ recebe
  -- 'consignacao', 'financiamento', 'consorcio', 'seguro', 'troca'.
  produto text not null default 'veiculo',
  canal text not null check (canal in ('meta', 'google', 'organico')),
  -- Só faz sentido para veículo em Meta/Orgânico; Google (pesquisa) é só texto.
  tipo_anuncio text check (tipo_anuncio in ('estatico', 'carrossel', 'video')),
  tom text,
  publico text,
  -- A variação escolhida, no formato do canal (texto_principal/titulo/descricao/cta,
  -- cartoes[], titulos[]/descricoes[], legenda/hashtags, observacoes).
  conteudo jsonb not null,
  -- Carrossel: URLs das fotos escolhidas, na ordem dos cartões. Vídeo: URL escolhida.
  fotos_selecionadas jsonb not null default '[]'::jsonb,
  video_url text,
  status text not null default 'rascunho'
    check (status in ('rascunho', 'aprovado', 'descartado')),
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index idx_ad_copies_veiculo_id on public.ad_copies(veiculo_id);
create index idx_ad_copies_status on public.ad_copies(status);

alter table public.ad_copies enable row level security;

-- Mesmo padrão de veiculo_criativos: qualquer usuário autenticado do painel administra
-- (o setor é filtrado na navegação da tela, não linha a linha no banco -- ver
-- src/lib/setor-acesso.ts). Sem policy para anon: o site público não lê esta tabela.
create policy "allow_auth_all_ad_copies" on public.ad_copies
  for all to authenticated using (true) with check (true);
