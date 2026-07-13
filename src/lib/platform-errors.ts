const ERROR_MAP: Record<string, { message: string; action: string }> = {
  LTP_PICTURE_REQUIRED: {
    message: 'Fotos obrigatórias ausentes. Adicione pelo menos 1 foto ao cadastro.',
    action: 'Adicione fotos ao veículo',
  },
  invalid_grant: {
    message: 'Conexão expirada. Clique em "Reconectar" no painel.',
    action: 'Reconectar plataforma',
  },
  429: {
    message: 'Muitas requisições. Aguarde 5 minutos e tente novamente.',
    action: 'Aguarde e tente novamente',
  },
}

export function translateError(errorCode: string): { message: string; action: string } {
  const key = Object.keys(ERROR_MAP).find((k) => errorCode.includes(k))
  return key ? ERROR_MAP[key] : { message: errorCode, action: 'Verificar logs' }
}
