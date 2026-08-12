// Auditoria de vazamento de dado (12/08/2026, pedido da Adriana). A tabela
// `veiculos` guarda, nas colunas `proprietario_*`, dado pessoal de terceiro —
// CPF, RG, telefone, e-mail, endereço completo, data de nascimento, nome da
// mãe, estado civil de quem CONSIGNOU o carro. Achados reais nessa auditoria:
//   1. `ai-sdr`/`ai-agents` mandavam isso pro Gemini via `select('*')` — podia
//      vazar pra QUALQUER cliente perguntando sobre aquele carro.
//   2. `_shared/ml-client.ts` publicava o endereço residencial como local do
//      anúncio PÚBLICO no Mercado Livre — dado de verdade, já no ar.
//
// Regra: `select('*')` em `veiculos` só é aceitável quando o resultado NÃO
// sai da função (uso interno) ou quando é pra gerar contrato/documento legal
// (onde o dado do proprietário É necessário de verdade — ver
// gerar-pdf-contrato, enviar-para-assinatura, webhook-autentique). Qualquer
// função que manda dado de veículo pra um LLM, pra uma API de portal público,
// ou pra uma resposta HTTP que sai do domínio da loja deve usar
// COLUNAS_VEICULO_SEGURAS (ou uma lista equivalente, deliberadamente sem
// proprietario_*) em vez de '*'.
export const COLUNAS_VEICULO_SEGURAS =
  'id, marca, modelo, versao, ano_fabricacao, ano_modelo, cor, quilometragem, cambio, combustivel, portas, preco_venda, valor_fipe, descricao, diferenciais, fotos, videos, categoria, slug'
