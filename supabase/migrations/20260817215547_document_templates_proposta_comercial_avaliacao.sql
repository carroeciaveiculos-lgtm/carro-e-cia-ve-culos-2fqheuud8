-- 2 tipos de documento novos (17/08/2026):
-- - proposta_comercial: substitui o "gerar-pdf-proposta" que era 100% fake
--   (PDF fixo com texto "Mocked PDF", nunca usado de verdade — confirmado
--   vazio em storage.objects antes dessa migration).
-- - proposta_avaliacao: nova, parte da feature de Avaliação de Veículo.
insert into document_templates (document_type, name, content, is_default)
values
  (
    'proposta_comercial',
    'Proposta Comercial',
    E'PROPOSTA COMERCIAL — CARRO E CIA VEÍCULOS\n\nCliente: {{proprietario_nome}}\nTelefone: {{proprietario_telefone}}\n\nVEÍCULO:\n{{marca}} {{veiculo_modelo}} {{versao}}\nAno: {{ano_fabricacao}}/{{ano_modelo}}\nPlaca: {{placa}}\nCor: {{cor}}\nCâmbio: {{cambio}}\nCombustível: {{combustivel}}\nQuilometragem: {{quilometragem}} km\n\nVALOR: {{preco_venda}}\n\nProposta válida por 5 dias. Sujeita a disponibilidade do veículo no momento da confirmação.\n\nCARRO E CIA VEÍCULOS\nTRANSLUGA ADMINISTRACAO DE VEICULOS LTDA — CNPJ 10.196.974/0001-46',
    true
  ),
  (
    'proposta_avaliacao',
    'Proposta de Avaliação',
    E'PROPOSTA DE AVALIAÇÃO — CARRO E CIA VEÍCULOS\n\nCliente: {{proprietario_nome}}\nTelefone: {{proprietario_telefone}}\n\nVEÍCULO AVALIADO:\n{{marca}} {{veiculo_modelo}}\nAno: {{ano_fabricacao}}/{{ano_modelo}}\nPlaca: {{placa}}\nCor: {{cor}}\nCâmbio: {{cambio}}\nCombustível: {{combustivel}}\nQuilometragem: {{quilometragem}} km\n\nEstado de conservação: {{estado_conservacao}}\nItens/opcionais: {{itens_opcionais}}\n\nVALOR PROPOSTO: {{valor_proposto}}\n\nEsta proposta é uma estimativa inicial, sujeita a confirmação após vistoria presencial completa. Válida por 5 dias.\n\nCARRO E CIA VEÍCULOS\nTRANSLUGA ADMINISTRACAO DE VEICULOS LTDA — CNPJ 10.196.974/0001-46',
    true
  )
on conflict (document_type) do nothing;
