-- Corrige categoria='carro' (valor invalido pro Mercado Livre, nao existe no
-- ML_BODY_TYPE_MAP) em 7 veiculos ja vendidos, escolhendo a categoria real
-- pelo nome do modelo. Corrige tambem cor='BRANC0' (zero no lugar do "O",
-- typo real achado no Hilux 0f038de3-4dac-44e9-848f-d2b828e6c748) -> 'Branco'.
-- Trava nova: nenhum caminho de entrada (form, importacao, feature futura)
-- consegue mais gravar uma categoria que o ML nao reconhece.
UPDATE public.veiculos SET categoria = 'SUV'
WHERE categoria = 'carro' AND (modelo ILIKE '%SW4%' OR modelo ILIKE '%Compass%' OR modelo ILIKE '%Tracker%' OR modelo ILIKE '%Duster%');

UPDATE public.veiculos SET categoria = 'Hatch'
WHERE categoria = 'carro' AND (modelo ILIKE '%Onix%' OR modelo ILIKE '%HB20%' OR modelo ILIKE '%Argo%');

UPDATE public.veiculos SET categoria = 'Sedan'
WHERE categoria = 'carro';

UPDATE public.veiculos SET cor = 'Branco'
WHERE id = '0f038de3-4dac-44e9-848f-d2b828e6c748' AND cor = 'BRANC0';

ALTER TABLE public.veiculos DROP CONSTRAINT IF EXISTS categoria_valida_ml;
ALTER TABLE public.veiculos ADD CONSTRAINT categoria_valida_ml
  CHECK (categoria IS NULL OR lower(categoria) IN ('suv','picape','hatch','sedan','van','esportivo'));
