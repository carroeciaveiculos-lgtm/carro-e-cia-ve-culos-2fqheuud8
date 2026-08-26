-- Cilindrada era texto livre, sem padrao (aceitava litro "1.5" e cc "1598"
-- misturados, sem nenhuma trava) -- pedido da Adriana 26/08/2026 pra virar
-- campo numerico so em litros, mesmo padrao que ja usamos pra outros campos
-- tecnicos do veiculo.
-- 2 valores reais misturavam cilindrada com potencia (CV) -- extrai so a
-- cilindrada, descarta o CV (nao existe campo de potencia no cadastro hoje).
UPDATE public.veiculos SET cilindrada = '1.0' WHERE cilindrada = '1.0 - 88CV';
UPDATE public.veiculos SET cilindrada = '1.3' WHERE cilindrada = '1.3 - 107CV';

-- Normaliza virgula decimal, espacos e letras soltas (ex: "2.0i" -> "2.0")
-- antes de converter o tipo da coluna.
UPDATE public.veiculos SET cilindrada = trim(replace(cilindrada, ',', '.'))
WHERE cilindrada IS NOT NULL;
UPDATE public.veiculos SET cilindrada = regexp_replace(cilindrada, '[^0-9.]', '', 'g')
WHERE cilindrada IS NOT NULL AND cilindrada ~ '[^0-9.]';
UPDATE public.veiculos SET cilindrada = NULL WHERE cilindrada = '';

ALTER TABLE public.veiculos
  ALTER COLUMN cilindrada TYPE numeric(3,1) USING NULLIF(cilindrada, '')::numeric(3,1);

ALTER TABLE public.veiculos DROP CONSTRAINT IF EXISTS cilindrada_valida;
ALTER TABLE public.veiculos ADD CONSTRAINT cilindrada_valida
  CHECK (cilindrada IS NULL OR (cilindrada > 0 AND cilindrada <= 15));
