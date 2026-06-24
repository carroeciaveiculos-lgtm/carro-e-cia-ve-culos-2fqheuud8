DO $$
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'adriana.araujo@kmzero.com.br') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'adriana.araujo@kmzero.com.br',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Adriana Araujo"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );

    INSERT INTO public.usuarios (id, email, nome, role, modulos, nivel)
    VALUES (new_user_id, 'adriana.araujo@kmzero.com.br', 'Adriana Araujo', 'admin', ARRAY['estoque', 'crm', 'avaliacao', 'site', 'financiamento', 'administrativo', 'marketing', 'configuracoes'], 'gerente')
    ON CONFLICT (email) DO NOTHING;
  END IF;
  
  -- Seed Ajuda Conteúdos
  IF NOT EXISTS (SELECT 1 FROM public.ajuda_conteudos WHERE titulo = 'Gerenciador de Leads') THEN
    INSERT INTO public.ajuda_conteudos (categoria, titulo, o_que_e, dependencias, para_que_serve, caminho, quando_utilizar, como_utilizar, is_faq)
    VALUES 
    ('CRM', 'Gerenciador de Leads', 'Módulo de CRM onde todos os contatos e conversas são centralizados.', 'Integrações com Facebook, WhatsApp, Formulários do Site.', 'Gerenciar a jornada de compra do lead, desde o primeiro contato até o fechamento.', '/admin/crm', 'Diariamente, para responder clientes e atualizar status das negociações.', '1. Acesse o CRM.\n2. Clique em um lead para abrir a conversa.\n3. Envie mensagens ou mova o card no Kanban.\n4. Atualize o status para "fechado" quando vender.', false),
    ('Estoque', 'Estoque e Integrador', 'Listagem de todos os veículos disponíveis, vendidos e arquivados.', 'Avaliação (veículos podem vir de lá).', 'Controlar os carros na loja e integrá-los com portais como Webmotors.', '/admin/estoque', 'Ao receber um novo veículo na loja ou ao vender um.', '1. Vá em Estoque.\n2. Clique em "Novo Veículo" ou edite um existente.\n3. Preencha placa, chassi, fotos e preço.\n4. Marque a caixa dos portais desejados para integrar.', false),
    ('Marketing', 'Agendador de Redes Sociais', 'Ferramenta para criar e agendar postagens no Instagram e Facebook.', 'Integração com contas Meta.', 'Manter as redes sociais ativas de forma automatizada.', '/admin/marketing', 'Semanalmente para programar o conteúdo de vendas e engajamento.', '1. Acesse Marketing.\n2. Vá na aba Redes Sociais.\n3. Selecione as plataformas.\n4. Digite o texto ou use IA.\n5. Defina a data e agende.', false),
    ('FAQ', 'Como alterar a senha?', 'Instruções para redefinir a senha de acesso ao sistema.', NULL, 'Recuperar acesso caso esqueça a senha.', 'Login', 'Quando um usuário esquecer a senha.', 'Na tela de login, clique em "Esqueci minha senha" e siga as instruções enviadas para seu e-mail.', true),
    ('FAQ de dúvidas frequentes dos clientes', 'Onde fica a loja?', 'Dúvida comum de clientes sobre a localização.', NULL, 'Treinar a IA para responder clientes sobre o endereço.', 'CRM', 'Quando o cliente perguntar o endereço.', 'Nossa loja fica localizada na Avenida Principal, 1000 - Centro, Uberaba/MG.', true);
  END IF;
END $$;
