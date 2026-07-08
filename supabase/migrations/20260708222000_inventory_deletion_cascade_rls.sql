-- Ensure RLS DELETE policy on veiculos for authenticated users
DROP POLICY IF EXISTS "allow_auth_delete_veiculos" ON public.veiculos;
CREATE POLICY "allow_auth_delete_veiculos" ON public.veiculos
  FOR DELETE TO authenticated USING (true);

-- Add ON DELETE CASCADE to vehicle-related foreign keys
-- social_posts
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'social_posts_veiculo_id_fkey'
    AND table_name = 'social_posts'
  ) THEN
    ALTER TABLE public.social_posts DROP CONSTRAINT social_posts_veiculo_id_fkey;
    ALTER TABLE public.social_posts ADD CONSTRAINT social_posts_veiculo_id_fkey
      FOREIGN KEY (veiculo_id) REFERENCES public.veiculos(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ml_listings
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'ml_listings_veiculo_id_fkey'
    AND table_name = 'ml_listings'
  ) THEN
    ALTER TABLE public.ml_listings DROP CONSTRAINT ml_listings_veiculo_id_fkey;
    ALTER TABLE public.ml_listings ADD CONSTRAINT ml_listings_veiculo_id_fkey
      FOREIGN KEY (veiculo_id) REFERENCES public.veiculos(id) ON DELETE CASCADE;
  END IF;
END $$;

-- documentos
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'documentos_veiculo_id_fkey'
    AND table_name = 'documentos'
  ) THEN
    ALTER TABLE public.documentos DROP CONSTRAINT documentos_veiculo_id_fkey;
    ALTER TABLE public.documentos ADD CONSTRAINT documentos_veiculo_id_fkey
      FOREIGN KEY (veiculo_id) REFERENCES public.veiculos(id) ON DELETE CASCADE;
  END IF;
END $$;

-- despesas
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'despesas_veiculo_id_fkey'
    AND table_name = 'despesas'
  ) THEN
    ALTER TABLE public.despesas DROP CONSTRAINT despesas_veiculo_id_fkey;
    ALTER TABLE public.despesas ADD CONSTRAINT despesas_veiculo_id_fkey
      FOREIGN KEY (veiculo_id) REFERENCES public.veiculos(id) ON DELETE CASCADE;
  END IF;
END $$;

-- simulacoes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'simulacoes_veiculo_id_fkey'
    AND table_name = 'simulacoes'
  ) THEN
    ALTER TABLE public.simulacoes DROP CONSTRAINT simulacoes_veiculo_id_fkey;
    ALTER TABLE public.simulacoes ADD CONSTRAINT simulacoes_veiculo_id_fkey
      FOREIGN KEY (veiculo_id) REFERENCES public.veiculos(id) ON DELETE CASCADE;
  END IF;
END $$;

-- consignacoes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'consignacoes_veiculo_id_fkey'
    AND table_name = 'consignacoes'
  ) THEN
    ALTER TABLE public.consignacoes DROP CONSTRAINT consignacoes_veiculo_id_fkey;
    ALTER TABLE public.consignacoes ADD CONSTRAINT consignacoes_veiculo_id_fkey
      FOREIGN KEY (veiculo_id) REFERENCES public.veiculos(id) ON DELETE CASCADE;
  END IF;
END $$;

-- contratos_consignacao
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'contratos_consignacao_veiculo_id_fkey'
    AND table_name = 'contratos_consignacao'
  ) THEN
    ALTER TABLE public.contratos_consignacao DROP CONSTRAINT contratos_consignacao_veiculo_id_fkey;
    ALTER TABLE public.contratos_consignacao ADD CONSTRAINT contratos_consignacao_veiculo_id_fkey
      FOREIGN KEY (veiculo_id) REFERENCES public.veiculos(id) ON DELETE CASCADE;
  END IF;
END $$;

-- leads - SET NULL to preserve lead history
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'leads_veiculo_id_fkey'
    AND table_name = 'leads'
  ) THEN
    ALTER TABLE public.leads DROP CONSTRAINT leads_veiculo_id_fkey;
    ALTER TABLE public.leads ADD CONSTRAINT leads_veiculo_id_fkey
      FOREIGN KEY (veiculo_id) REFERENCES public.veiculos(id) ON DELETE SET NULL;
  END IF;
END $$;

-- notas_fiscais - SET NULL to preserve financial records
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'notas_fiscais_veiculo_id_fkey'
    AND table_name = 'notas_fiscais'
  ) THEN
    ALTER TABLE public.notas_fiscais DROP CONSTRAINT notas_fiscais_veiculo_id_fkey;
    ALTER TABLE public.notas_fiscais ADD CONSTRAINT notas_fiscais_veiculo_id_fkey
      FOREIGN KEY (veiculo_id) REFERENCES public.veiculos(id) ON DELETE SET NULL;
  END IF;
END $$;

-- estoque_publicacoes - add FK with CASCADE if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'estoque_publicacoes_veiculo_id_fkey'
    AND table_name = 'estoque_publicacoes'
  ) THEN
    BEGIN
      ALTER TABLE public.estoque_publicacoes
        ADD CONSTRAINT estoque_publicacoes_veiculo_id_fkey
        FOREIGN KEY (veiculo_id) REFERENCES public.veiculos(id) ON DELETE CASCADE;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
END $$;

-- Ensure seed user exists (idempotent)
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
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.usuarios (id, email, nome, role, nivel, ativo)
    VALUES (new_user_id, 'adriana.araujo@kmzero.com.br', 'Adriana Araujo', 'admin', 'gestor', true)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
