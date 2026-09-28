-- Achado real (28/09/2026): dois cadastros com a mesma placa (SGI9C15) —
-- um rascunho órfão vazio e o veículo de verdade — quebravam a sincronização
-- do Google Drive (a busca por placa espera encontrar 1 só resultado).
-- Nada no banco impedia isso. Índice único normalizado (maiúsculo, sem
-- hífen/espaço) barra qualquer duplicata futura, de qualquer origem —
-- não só pelo caminho que causou esta vez. Placa NULL continua permitida
-- (rascunho sem placa ainda) e não conta pra unicidade.
create unique index if not exists veiculos_placa_normalizada_unica
  on public.veiculos (upper(regexp_replace(placa, '[^A-Za-z0-9]', '', 'g')))
  where placa is not null;

comment on index public.veiculos_placa_normalizada_unica is 'Impede dois veículos com a mesma placa (comparando maiúscula/minúscula e com/sem hífen). Achado real 28/09/2026: duplicata em SGI9C15 quebrava sync do Google Drive.';
