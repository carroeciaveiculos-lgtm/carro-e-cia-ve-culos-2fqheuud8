-- Motivos de Perda Personalizados (pedido da Adriana, 15/09/2026): além dos
-- 8 motivos padrão (fixos no frontend, nao editaveis), permite cadastrar
-- motivos proprios do negocio. Usado ao mover um lead pra coluna "Perdido"
-- no Kanban e na edicao manual do lead.

CREATE TABLE public.motivos_perda_personalizados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.motivos_perda_personalizados ENABLE ROW LEVEL SECURITY;

-- Mesmo padrao ja usado em `leads` (allow_auth_all_leads).
CREATE POLICY "allow_auth_all_motivos_perda"
  ON public.motivos_perda_personalizados
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

INSERT INTO public.motivos_perda_personalizados (nome) VALUES
  ('Veículo Vendido'),
  ('Veículo Devolvido'),
  ('Troca Inviável'),
  ('Parcela Alta'),
  ('Baixa Avaliação'),
  ('Localização'),
  ('CPF sem aprovação'),
  ('Cliente não retorna e não atende ligações');

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS motivo_perda text;
