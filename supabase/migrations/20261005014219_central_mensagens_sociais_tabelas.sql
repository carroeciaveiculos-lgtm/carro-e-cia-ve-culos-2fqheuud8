-- Central de Mensagens (04/10/2026): direct do Instagram e Messenger do Facebook ficam na Central de Redes Sociais, SEPARADOS do CRM de leads da Clara (que é só WhatsApp).
CREATE TABLE IF NOT EXISTS public.social_conversas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plataforma text NOT NULL CHECK (plataforma IN ('instagram', 'facebook')),
  contato_id text NOT NULL,                       -- IGSID (Instagram) ou PSID (Messenger)
  contato_nome text,
  ultima_mensagem text,
  ultima_mensagem_em timestamptz NOT NULL DEFAULT now(),
  ultima_do_cliente_em timestamptz,               -- base da janela de 24 h para responder
  nao_lidas integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'resolvida')),
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plataforma, contato_id)
);

CREATE TABLE IF NOT EXISTS public.social_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id uuid NOT NULL REFERENCES public.social_conversas(id) ON DELETE CASCADE,
  direcao text NOT NULL CHECK (direcao IN ('entrada', 'saida')),
  origem text NOT NULL DEFAULT 'cliente' CHECK (origem IN ('cliente', 'equipe_app', 'painel')),
  texto text NOT NULL DEFAULT '',
  mid text,                                       -- id da mensagem na Meta (evita duplicar reenvios e o eco das respostas do painel)
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS social_mensagens_mid_uniq ON public.social_mensagens (mid) WHERE mid IS NOT NULL;
CREATE INDEX IF NOT EXISTS social_mensagens_conversa_idx ON public.social_mensagens (conversa_id, criado_em);
CREATE INDEX IF NOT EXISTS social_conversas_recentes_idx ON public.social_conversas (ultima_mensagem_em DESC);

ALTER TABLE public.social_conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_mensagens ENABLE ROW LEVEL SECURITY;
-- Mesmo padrão de social_comments (equipe logada no painel). A function do webhook usa a chave de serviço e ignora RLS.
CREATE POLICY allow_all_social_conversas ON public.social_conversas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_all_social_mensagens ON public.social_mensagens FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Comentário que demonstra interesse de compra (selo na aba Comentários)
ALTER TABLE public.social_comments ADD COLUMN IF NOT EXISTS demonstra_interesse boolean NOT NULL DEFAULT false;

-- Resultado da conferência da assinatura da Meta em cada evento recebido (permite provar, em tráfego real, que os eventos verdadeiros passam antes de passar a bloquear)
ALTER TABLE public.meta_webhook_logs ADD COLUMN IF NOT EXISTS assinatura_ok boolean;
ALTER TABLE public.meta_webhook_logs ADD COLUMN IF NOT EXISTS assinatura_motivo text;
