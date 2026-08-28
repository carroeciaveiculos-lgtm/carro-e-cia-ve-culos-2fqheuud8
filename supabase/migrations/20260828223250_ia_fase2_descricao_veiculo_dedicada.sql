-- Fase 2 da unificação de regras de IA: separa a regra da "Descrição de
-- Veículos" do texto institucional fixo (que agora entra por código,
-- sempre literal, sem depender da IA reproduzir palavra por palavra).
ALTER TABLE ai_prompts_config ADD COLUMN IF NOT EXISTS rodape_fixo text;

UPDATE ai_prompts_config
SET
  prompt_text = 'Foque no estilo, apelo visual, diferenciais exclusivos e desempenho do veículo. NÃO mencione serviços da concessionária, garantias, financiamento, informações de contato ou frases como "nossa loja" ou "entre em contato".',
  rodape_fixo = 'Há mais de 25 anos no mercado, a Carro & Cia Veículos trabalha com 0 km e seminovos com laudo cautelar aprovado, qualidade e procedência garantidas. Atendimento personalizado, preço justo, pronta entrega, melhor avaliação na troca, financiamento em até 60 vezes com aprovação imediata, seguro auto e consórcios. Consulte nossos vendedores sobre versões, modelos, pintura e frete. Reservamo-nos o direito de corrigir eventuais erros de digitação; valores sujeitos a alteração sem aviso prévio.',
  onde_fica = 'Botão "Gerar com IA" na aba Geral & Valores do cadastro/edição de veículo (campo Observações/Descrição)'
WHERE slug = 'vehicle_description';
