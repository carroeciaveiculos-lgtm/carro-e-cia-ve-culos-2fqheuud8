CREATE TABLE IF NOT EXISTS public.document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_document_templates" ON public.document_templates;
CREATE POLICY "auth_select_document_templates" ON public.document_templates
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_document_templates" ON public.document_templates;
CREATE POLICY "auth_insert_document_templates" ON public.document_templates
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_document_templates" ON public.document_templates;
CREATE POLICY "auth_update_document_templates" ON public.document_templates
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_document_templates" ON public.document_templates;
CREATE POLICY "auth_delete_document_templates" ON public.document_templates
  FOR DELETE TO authenticated USING (true);

INSERT INTO public.document_templates (document_type, name, content, is_default) VALUES
('consignacao', 'Contrato de Consignação', 'CONTRATO DE CONSIGNAÇÃO DE VEÍCULO

CONSIGNANTE (Proprietário): {{proprietario_nome}}
CPF: {{proprietario_cpf}}
Telefone: {{proprietario_telefone}}

CONSIGNATÁRIO: TRANSLUGA ADMINISTRACAO DE VEICULOS LTDA
CNPJ: 10.196.974/0001-46

DADOS DO VEÍCULO:
Marca/Modelo: {{marca}} {{veiculo_modelo}}
Versão: {{versao}}
Ano Fabricação/Modelo: {{ano_fabricacao}} / {{ano_modelo}}
Placa: {{placa}}
Chassi: {{chassi}}
RENAVAM: {{renavam}}
Cor: {{cor}}
Combustível: {{combustivel}}
Câmbio: {{cambio}}
Quilometragem: {{quilometragem}} km

VALORES E CONDIÇÕES:
Valor de Anúncio: {{preco_venda}}

Pelo presente instrumento, o CONSIGNANTE confia ao CONSIGNATÁRIO o veículo acima descrito para fins de venda por consignação.', true),
('compra', 'Contrato de Compra', 'CONTRATO DE COMPRA E VENDA DE VEÍCULO

COMPRADOR: {{proprietario_nome}}
CPF: {{proprietario_cpf}}

VENDEDOR: TRANSLUGA ADMINISTRACAO DE VEICULOS LTDA
CNPJ: 10.196.974/0001-46

DADOS DO VEÍCULO:
Marca/Modelo: {{marca}} {{veiculo_modelo}}
Ano: {{ano_fabricacao}}/{{ano_modelo}}
Placa: {{placa}}
Cor: {{cor}}
Combustível: {{combustivel}}
Quilometragem: {{quilometragem}} km

VALOR DA COMPRA: {{preco_venda}}

O COMPRADOR declara estar ciente do estado de conservação do veículo descrito acima.', true),
('venda', 'Contrato de Venda', 'CONTRATO DE VENDA DE VEÍCULO

VENDEDOR: {{proprietario_nome}}
CPF: {{proprietario_cpf}}

COMPRADOR: TRANSLUGA ADMINISTRACAO DE VEICULOS LTDA
CNPJ: 10.196.974/0001-46

VEÍCULO:
Marca/Modelo: {{marca}} {{veiculo_modelo}}
Ano: {{ano_fabricacao}}/{{ano_modelo}}
Placa: {{placa}}
Chassi: {{chassi}}
Cor: {{cor}}
Combustível: {{combustivel}}
KM: {{quilometragem}}

VALOR DE VENDA: {{preco_venda}}

O VENDEDOR declara ser o legítimo proprietário do veículo, livre e desembaraçado de quaisquer ônus.', true),
('termo_entrega', 'Termo de Entrega', 'TERMO DE ENTREGA DE VEÍCULO

RECEBEDOR: {{proprietario_nome}}
CPF: {{proprietario_cpf}}

ENTREGADOR: TRANSLUGA ADMINISTRACAO DE VEICULOS LTDA
CNPJ: 10.196.974/0001-46

VEÍCULO ENTREGUE:
Marca/Modelo: {{marca}} {{veiculo_modelo}}
Ano: {{ano_fabricacao}}/{{ano_modelo}}
Placa: {{placa}}
Cor: {{cor}}
Quilometragem: {{quilometragem}} km

O RECEBEDOR declara ter recebido o veículo acima descrito em perfeito estado de conservação, acompanhado de todos os documentos e chaves.

Data de entrega: {{data_entrega}}', true)
ON CONFLICT (document_type) DO NOTHING;
