const ERROR_MAP: Record<string, { message: string; action: string }> = {
  LTP_PICTURE_REQUIRED: {
    message: 'Fotos obrigatórias ausentes. Adicione pelo menos 1 foto ao cadastro.',
    action: 'Adicione fotos ao veículo',
  },
  LTP_ITEM_TITLE_LENGTH: {
    message: 'Título do anúncio muito longo. Máximo 60 caracteres.',
    action: 'Encurte o título do veículo',
  },
  LTP_CATEGORY_REQUIRED: {
    message: 'Categoria obrigatória não informada.',
    action: 'Verifique a categoria do veículo',
  },
  LTP_PRICE_REQUIRED: {
    message: 'Preço obrigatório não informado.',
    action: 'Defina o preço de venda',
  },
  invalid_grant: {
    message: 'Conexão expirada. Clique em "Reconectar" no painel.',
    action: 'Reconectar plataforma',
  },
  429: {
    message: 'Muitas requisições. Aguarde 5 minutos e tente novamente.',
    action: 'Aguarde e tente novamente',
  },
  ITEM_NOT_FOUND: {
    message: 'Anúncio não encontrado na plataforma. Pode ter sido removido.',
    action: 'Recriar anúncio',
  },
  VALIDATION_ERROR: {
    message: 'Erro de validação. Verifique os dados do veículo.',
    action: 'Revisar dados do veículo',
  },
  unauthorized: {
    message: 'Não autorizado. Verifique as credenciais da plataforma.',
    action: 'Reconectar plataforma',
  },
  not_found: {
    message: 'Recurso não encontrado na plataforma.',
    action: 'Verificar configuração',
  },
  server_error: {
    message: 'Erro interno da plataforma. Tente novamente mais tarde.',
    action: 'Aguarde e tente novamente',
  },
  timeout: {
    message: 'Tempo limite excedido. Tente novamente.',
    action: 'Tente novamente',
  },
  duplicate: {
    message: 'Anúncio duplicado. Este veículo já está publicado nesta plataforma.',
    action: 'Verificar anúncios existentes',
  },
  missing_attributes: {
    message: 'Atributos obrigatórios ausentes. Verifique os dados técnicos do veículo.',
    action: 'Completar ficha técnica',
  },
  INVALID_FORMAT: {
    message: 'Formato de imagem inválido. Apenas JPEG ou PNG são aceitos.',
    action: 'Converter imagens para JPEG ou PNG',
  },
  RESOLUTION_TOO_LOW: {
    message: 'Resolução da imagem muito baixa. Mínimo 800x800px.',
    action: 'Adicionar imagens com resolução maior',
  },
  IMAGE_TOO_LARGE: {
    message: 'Imagem muito grande. Máximo 10MB por arquivo.',
    action: 'Comprimir ou redimensionar a imagem',
  },
  IMAGE_UNREACHABLE: {
    message: 'Imagem inacessível. A URL não retorna HTTP 200.',
    action: 'Verificar a URL da imagem',
  },
  image_validation: {
    message: 'Falha na validação de imagens. Verifique resolução, formato e acessibilidade.',
    action: 'Revisar imagens do veículo',
  },
}

export function translateError(errorCode: string): { message: string; action: string } {
  const key = Object.keys(ERROR_MAP).find((k) => errorCode.toLowerCase().includes(k.toLowerCase()))
  return key ? ERROR_MAP[key] : { message: errorCode, action: 'Verificar logs' }
}
