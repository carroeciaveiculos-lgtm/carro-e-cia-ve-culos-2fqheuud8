-- 26/11/2026 (plano docs/cadastro-busca-fipe.md, Parte 2, passo 1; autorizado pela Adriana em 26/11/2026).
-- Número de lugares do veículo: guia a escolha da versão Webmotors de 5 ou 7 lugares (caso das SW4).
-- Vazio = não informado. Só acrescenta a coluna: nenhum dado existente muda.
-- Desfazer: alter table public.veiculos drop column lugares;
alter table public.veiculos
  add column if not exists lugares smallint null
  constraint veiculos_lugares_faixa check (lugares between 2 and 9);

comment on column public.veiculos.lugares is
  'Número de lugares (2 a 9). NULL = não informado. Usado pelo wm-mapear-veiculo para escolher versão de 5 ou 7 lugares.';
