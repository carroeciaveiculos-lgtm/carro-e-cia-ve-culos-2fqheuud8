export interface TranslatedError {
  message: string;
  action: string;
}

interface ErrorPattern {
  match: RegExp;
  message: string;
  action: string;
}

const errorPatterns: ErrorPattern[] = [
  {
    match: /token|unauthor/i,
    message: 'Token de acesso expirado ou inválido. Reautentique a integração.',
    action: 'Reautenticar integração nas configurações do portal.',
  },
  {
    match: /rate.?limit|429|too many/i,
    message: 'Limite de requisições excedido no portal.',
    action: 'Aguarde alguns minutos e tente novamente.',
  },
  {
    match: /timeout|timed out/i,
    message: 'Tempo limite excedido ao contatar o portal.',
    action: 'Verifique a conectividade e tente novamente.',
  },
  {
    match: /duplicate|already exist|conflict|409/i,
    message: 'Já existe um anúncio duplicado para este veículo no portal.',
    action: 'Remova o anúncio duplicado no portal ou use o ID existente.',
  },
  {
    match: /not found|404/i,
    message: 'Recurso não encontrado no portal.',
    action: 'Verifique se o anúncio ainda existe no portal.',
  },
  {
    match: /validation|invalid|400|bad request/i,
    message: 'Dados inválidos enviados ao portal.',
    action: 'Revise os campos obrigatórios do veículo e tente novamente.',
  },
  {
    match: /quota|limit exceed/i,
    message: 'Cota do portal excedida.',
    action: 'Verifique o plano contratado no portal.',
  },
  {
    match: /network|ECONNREFUSED|ENOTFOUND/i,
    message: 'Erro de rede ao contatar o portal.',
    action: 'Verifique a conectividade com a internet.',
  },
];

export function translateError(rawError: string): TranslatedError {
  for (const pattern of errorPatterns) {
    if (pattern.match.test(rawError)) {
      return { message: pattern.message, action: pattern.action };
    }
  }
  return {
    message: rawError || 'Erro desconhecido na sincronização com o portal.',
    action: 'Consulte os logs detalhados para mais informações.',
  };
}
