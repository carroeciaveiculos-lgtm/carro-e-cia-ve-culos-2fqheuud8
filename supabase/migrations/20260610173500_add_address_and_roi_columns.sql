-- Adicionar campos de endereço à tabela de clientes
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS logradouro TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS complemento TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS estado TEXT;

-- Adicionar campos de endereço do proprietário à tabela de veículos
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS proprietario_cep TEXT;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS proprietario_logradouro TEXT;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS proprietario_numero TEXT;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS proprietario_complemento TEXT;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS proprietario_bairro TEXT;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS proprietario_cidade TEXT;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS proprietario_estado TEXT;
