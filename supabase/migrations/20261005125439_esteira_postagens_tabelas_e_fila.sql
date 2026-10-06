-- Esteira de postagens (05/10/2026): cria UM item por vez (veículo + tipo) na aba Aprovações, Instagram + Facebook juntos, só com fotos limpas (sem marca de IA).
-- Ordem decidida pela Adriana: veículos mais recentes no estoque primeiro; para cada veículo, o carrossel e depois o vídeo.
-- A esteira nasce PAUSADA (ativa = false). Nunca aprova nada sozinha.

-- Configuração (uma linha). Fica fora de social_configuracoes porque aquela tabela guarda os tokens do Instagram/Facebook.
CREATE TABLE IF NOT EXISTS public.esteira_config (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  ativa boolean NOT NULL DEFAULT false,
  posts_por_dia integer NOT NULL DEFAULT 2 CHECK (posts_por_dia BETWEEN 1 AND 6),
  horarios text NOT NULL DEFAULT '10:00,18:00',          -- horários de Brasília dos posts aprovados
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.esteira_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.social_esteira (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id uuid NOT NULL REFERENCES public.veiculos(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('carrossel', 'video')),
  ciclo integer NOT NULL DEFAULT 1,
  ordem integer NOT NULL,                                 -- menor = vem antes
  estado text NOT NULL DEFAULT 'fila' CHECK (estado IN ('fila', 'em_aprovacao', 'concluido', 'pulado', 'bloqueado')),
  motivo text,                                            -- por que foi pulado/bloqueado
  post_ids uuid[] NOT NULL DEFAULT '{}',                  -- posts (Instagram/Facebook) gerados para este item
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (veiculo_id, tipo, ciclo)
);
CREATE INDEX IF NOT EXISTS social_esteira_fila_idx ON public.social_esteira (estado, ordem);

ALTER TABLE public.esteira_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_esteira ENABLE ROW LEVEL SECURITY;
-- Equipe logada no painel (mesmo padrão das tabelas sociais). As functions usam a chave de serviço.
CREATE POLICY allow_all_esteira_config ON public.esteira_config FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_all_social_esteira ON public.social_esteira FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Carga inicial da fila (repetível): veículos disponíveis, mais recentes primeiro.
-- ordem: carrossel = posição*10; vídeo = posição*10+1 (logo depois do carrossel do mesmo carro).
-- Quem já tinha post do mesmo formato antes da esteira (ex.: Nissan Frontier) entra como 'concluido'.
WITH base AS (
  SELECT v.id,
         row_number() OVER (ORDER BY v.created_at DESC, v.id) AS posicao,
         jsonb_array_length(COALESCE(v.videos, '[]'::jsonb)) > 0 AS tem_video
  FROM public.veiculos v
  WHERE v.status = 'disponivel'
)
INSERT INTO public.social_esteira (veiculo_id, tipo, ciclo, ordem, estado, motivo)
SELECT b.id, 'carrossel', 1, b.posicao * 10,
       CASE WHEN EXISTS (SELECT 1 FROM public.social_posts p WHERE p.veiculo_id = b.id AND p.formato = 'feed_carrossel') THEN 'concluido' ELSE 'fila' END,
       CASE WHEN EXISTS (SELECT 1 FROM public.social_posts p WHERE p.veiculo_id = b.id AND p.formato = 'feed_carrossel') THEN 'já tinha post antes da esteira' END
FROM base b
ON CONFLICT (veiculo_id, tipo, ciclo) DO NOTHING;

WITH base AS (
  SELECT v.id,
         row_number() OVER (ORDER BY v.created_at DESC, v.id) AS posicao
  FROM public.veiculos v
  WHERE v.status = 'disponivel' AND jsonb_array_length(COALESCE(v.videos, '[]'::jsonb)) > 0
)
INSERT INTO public.social_esteira (veiculo_id, tipo, ciclo, ordem, estado, motivo)
SELECT b.id, 'video', 1,
       (SELECT s.ordem FROM public.social_esteira s WHERE s.veiculo_id = b.id AND s.tipo = 'carrossel' AND s.ciclo = 1) + 1,
       CASE WHEN EXISTS (SELECT 1 FROM public.social_posts p WHERE p.veiculo_id = b.id AND p.formato = 'feed_video') THEN 'concluido' ELSE 'fila' END,
       CASE WHEN EXISTS (SELECT 1 FROM public.social_posts p WHERE p.veiculo_id = b.id AND p.formato = 'feed_video') THEN 'já tinha post antes da esteira' END
FROM base b
WHERE EXISTS (SELECT 1 FROM public.social_esteira s WHERE s.veiculo_id = b.id AND s.tipo = 'carrossel' AND s.ciclo = 1)
ON CONFLICT (veiculo_id, tipo, ciclo) DO NOTHING;
