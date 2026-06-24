CREATE TABLE IF NOT EXISTS public.ajuda_conteudos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria TEXT NOT NULL,
  titulo TEXT NOT NULL,
  o_que_e TEXT,
  dependencias TEXT,
  para_que_serve TEXT,
  caminho TEXT,
  quando_utilizar TEXT,
  como_utilizar TEXT,
  is_faq BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ajuda_conteudos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_ajuda" ON public.ajuda_conteudos;
CREATE POLICY "authenticated_select_ajuda" ON public.ajuda_conteudos
  FOR SELECT TO authenticated USING (true);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.ajuda_conteudos LIMIT 1) THEN
    INSERT INTO public.ajuda_conteudos (categoria, titulo, o_que_e, dependencias, para_que_serve, caminho, quando_utilizar, como_utilizar, is_faq)
    VALUES
    ('Geral', 'Dashboard', 'Painel de controle principal do sistema.', 'Nenhuma', 'Visão geral dos indicadores de negócio.', '/admin', 'Sempre que acessar o sistema para obter um resumo.', 'Acesse o menu Dashboard e visualize os cards.', false),
    ('Negócios', 'Estoque', 'Gerenciador de veículos disponíveis para venda.', 'Marcas e Modelos (FIPE), Portais de Anúncio', 'Cadastrar, editar, precificar e arquivar veículos.', '/admin/estoque', 'Quando um novo veículo entrar na loja ou for vendido.', '1. Clique em "Novo Veículo". 2. Preencha os dados e anexe fotos. 3. Salve.', false),
    ('Marketing', 'Agendador de Postagens', 'Ferramenta para criação e envio de posts.', 'Integração com Redes Sociais', 'Automatizar a presença digital da loja.', '/admin/marketing', 'Para planejar campanhas semanais.', '1. Vá em Marketing > Redes Sociais. 2. Escreva o post. 3. Escolha data e hora. 4. Agende.', false),
    ('FAQ', 'Como o cliente agenda uma visita?', 'Pergunta frequente sobre agendamento de clientes.', '', 'Orientar a equipe sobre a resposta padrão.', '', 'Quando o cliente perguntar no WhatsApp.', 'Responda com o link da página de contato ou formulário de agendamento.', true);
  END IF;
END $$;
