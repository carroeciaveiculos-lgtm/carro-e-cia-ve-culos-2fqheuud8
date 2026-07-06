-- Add tipo_comando column to agente_interacoes to differentiate admin commands from regular interactions
ALTER TABLE public.agente_interacoes ADD COLUMN IF NOT EXISTS tipo_comando TEXT DEFAULT 'conteudo';

-- Add index for faster lookups on admin command interactions
CREATE INDEX IF NOT EXISTS idx_agente_interacoes_tipo_comando ON public.agente_interacoes(tipo_comando);
CREATE INDEX IF NOT EXISTS idx_agente_interacoes_telefone ON public.agente_interacoes(usuario_telefone);
