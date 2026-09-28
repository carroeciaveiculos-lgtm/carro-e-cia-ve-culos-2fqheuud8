-- Gerador de criativos de anuncio (Meta Ads / Google Ads) por veiculo,
-- pedido pela Adriana em 28/09/2026. Plano completo salvo na sessao --
-- motor hibrido: preco/km/logo/texto sempre desenhados por codigo a
-- partir do cadastro real, IA entra so no tratamento da foto.

create table public.veiculo_criativos (
  id uuid primary key default gen_random_uuid(),
  veiculo_id uuid not null references public.veiculos(id) on delete cascade,
  template_slug text not null,
  foto_origem_url text not null,
  imagem_url text not null,
  criado_por uuid references auth.users(id),
  criado_em timestamptz not null default now()
);

create index idx_veiculo_criativos_veiculo_id on public.veiculo_criativos(veiculo_id);

alter table public.veiculo_criativos enable row level security;

-- Mesmo padrao de veiculos/documentos/ml_listings: qualquer usuario
-- autenticado do painel administra (setor eh filtrado na navegacao da
-- tela, nao linha a linha no banco -- ver src/lib/setor-acesso.ts).
create policy "allow_auth_all_veiculo_criativos" on public.veiculo_criativos
  for all to authenticated using (true) with check (true);

-- 4 modelos padrao de criativo. O prompt controla SO o tratamento da
-- foto (realce/iluminacao) -- preco, km, ano e texto nunca vem da IA,
-- sao desenhados por codigo direto do cadastro real do veiculo.
insert into public.ai_prompts_config (slug, name, prompt_text, description, onde_fica, api_provider, formato_resposta)
values
  (
    'criativo_preco_destaque',
    'Criativo de Anúncio — Preço em Destaque',
    'Realce fotorrealista da foto do veículo: iluminação de estúdio, cores fiéis ao carro real, fundo levemente desfocado/neutro. Não altere a cor, o modelo ou qualquer característica real do veículo — só trate iluminação e nitidez.',
    'Tratamento de foto para o modelo "Preço em Destaque" do gerador de criativos de anúncio. Preço, km e texto são desenhados por código, não pela IA.',
    'Estoque -> editar veículo -> aba "Marketing IA" -> Gerador de Criativos',
    'openai',
    'Retorna só a imagem tratada (sem texto, sem número) — o restante da composição (preço, km, logo) é aplicado depois, por código, em cima dessa foto.'
  ),
  (
    'criativo_ficha_tecnica',
    'Criativo de Anúncio — Ficha Técnica',
    'Realce fotorrealista da foto do veículo, ângulo levantado/institucional se possível, fundo neutro que não compita visualmente com um card de especificações que será sobreposto ao lado. Não altere a cor, o modelo ou qualquer característica real do veículo.',
    'Tratamento de foto para o modelo "Ficha Técnica" do gerador de criativos de anúncio. Ano, km, câmbio e combustível são desenhados por código, não pela IA.',
    'Estoque -> editar veículo -> aba "Marketing IA" -> Gerador de Criativos',
    'openai',
    'Retorna só a imagem tratada (sem texto, sem número) — o restante da composição é aplicado depois, por código, em cima dessa foto.'
  ),
  (
    'criativo_oportunidade',
    'Criativo de Anúncio — Oportunidade',
    'Realce fotorrealista da foto do veículo, com um leve efeito de destaque/brilho que sugira uma boa oportunidade, sem exagerar a ponto de parecer artificial. Não altere a cor, o modelo ou qualquer característica real do veículo.',
    'Tratamento de foto para o modelo "Oportunidade" do gerador de criativos de anúncio (usa os preços "De"/"Por" do cadastro quando disponíveis). O selo e os valores são desenhados por código, não pela IA.',
    'Estoque -> editar veículo -> aba "Marketing IA" -> Gerador de Criativos',
    'openai',
    'Retorna só a imagem tratada (sem texto, sem número) — o restante da composição é aplicado depois, por código, em cima dessa foto.'
  ),
  (
    'criativo_convite_cta',
    'Criativo de Anúncio — Convite/CTA',
    'Realce fotorrealista da foto do veículo, composição mais aberta/convidativa (espaço vazio numa lateral para o texto de chamada), tom caloroso. Não altere a cor, o modelo ou qualquer característica real do veículo.',
    'Tratamento de foto para o modelo "Convite/CTA" do gerador de criativos de anúncio, focado em gerar contato (WhatsApp) em vez de specs. Texto e botão são desenhados por código, não pela IA.',
    'Estoque -> editar veículo -> aba "Marketing IA" -> Gerador de Criativos',
    'openai',
    'Retorna só a imagem tratada (sem texto, sem número) — o restante da composição é aplicado depois, por código, em cima dessa foto.'
  );
