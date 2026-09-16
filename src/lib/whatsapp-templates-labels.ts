// Rótulo amigável pra cada variável {{N}} de um template aprovado na Meta
// (15/09/2026). A Graph API não devolve o que cada variável significa, só
// a posição — esse mapeamento é manual, por nome de template, e feito à
// mão pros 3 templates de negócio que existem hoje. Quebra silenciosamente
// se um template for editado e reenviado com outra ordem de variável (a
// Meta trata isso como versão nova) — se um rótulo aparecer errado,
// conferir o corpo real em `whatsapp_templates.corpo` antes de usar.
export const ROTULOS_VARIAVEIS_TEMPLATE: Record<string, Record<number, string>> = {
  lembrete_agendamento: { 1: 'Nome do cliente', 2: 'Horário da visita' },
  simulacao_financiamento_recebida: { 1: 'Nome do cliente' },
  veiculo_similar_disponivel: { 1: 'Nome do cliente', 2: 'Veículo' },
}

export function rotuloVariavel(templateNome: string, indice: number): string {
  return ROTULOS_VARIAVEIS_TEMPLATE[templateNome]?.[indice] || `Variável ${indice}`
}
