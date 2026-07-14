-- Seed brand_config in site_configuracoes (Source of Truth for all contacts)
INSERT INTO public.site_configuracoes (chave, valor)
VALUES ('brand_config', '{
  "whatsapp": "5534997384177",
  "whatsappDisplay": "(34) 99738-4177",
  "phone": "553433159400",
  "phoneDisplay": "(34) 3315-9400",
  "email": "contato@carroeciamotors.com.br",
  "instagram": "@carroecia_uberaba",
  "instagramUrl": "https://instagram.com/carroecia_uberaba",
  "facebookUrl": "https://www.facebook.com/carroeciaosmelhoresveiculos",
  "team": [
    {"name": "Luiz Fernando", "role": "CEO & Fundador", "whatsapp": "5534984080000", "whatsappDisplay": "(34) 98408-0000", "email": "luiz@carroeciamotors.com.br"},
    {"name": "Adriana Araujo", "role": "Seguros, Consorcios e Financiamentos", "whatsapp": "5534984080220", "whatsappDisplay": "(34) 98408-0220", "email": "adriana@carroeciamotors.com.br"},
    {"name": "Gabriel Araujo", "role": "Seguro Auto", "whatsapp": "5534992000300", "whatsappDisplay": "(34) 99200-0300", "email": "gabrielaraujo@kmzero.com.br"},
    {"name": "Jessica Germano", "role": "Documentacao e Financeiro", "whatsapp": "5534984029617", "whatsappDisplay": "(34) 98402-9617", "email": "jessica@carroeciamotors.com.br"},
    {"name": "Roberto Junior", "role": "Vendas", "whatsapp": "5534992893615", "whatsappDisplay": "(34) 99289-3615", "email": "roberto@carroeciamotors.com.br"}
  ]
}'::jsonb)
ON CONFLICT (chave) DO NOTHING;

-- Ensure RLS: anon can SELECT, authenticated can do ALL
ALTER TABLE public.site_configuracoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_config_select_v3" ON public.site_configuracoes;
CREATE POLICY "allow_all_config_select_v3" ON public.site_configuracoes
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "allow_auth_config_all_v3" ON public.site_configuracoes;
CREATE POLICY "allow_auth_config_all_v3" ON public.site_configuracoes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
