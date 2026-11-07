-- Criativos estáticos no cadastro do veículo (07/11/2026).
-- veiculos: 4 fotos escolhidas, quando foram geradas e uma cópia dos dados gravados na imagem
-- (preço, km, ano, status), usada para travar a publicação se o anúncio ficar desatualizado.
alter table public.veiculos add column if not exists fotos_criativo jsonb;
alter table public.veiculos add column if not exists criativo_gerado_em timestamptz;
alter table public.veiculos add column if not exists criativo_dados jsonb;

-- veiculo_criativos: formato de cada imagem e de onde ela veio (linhas antigas ficam null).
alter table public.veiculo_criativos add column if not exists formato text;
alter table public.veiculo_criativos add column if not exists origem text;
alter table public.veiculo_criativos drop constraint if exists veiculo_criativos_formato_check;
alter table public.veiculo_criativos add constraint veiculo_criativos_formato_check
  check (formato is null or formato in ('1:1', '4:5', '9:16', '1.91:1'));
