const ERROR_MAP: Record<string, string> = {
  pictures_does_not_comply_requirements:
    'As fotos não atendem aos requisitos do Mercado Livre. Verifique formato, tamanho e conteúdo.',
  title_too_long: 'Título do anúncio muito longo. Máximo 60 caracteres.',
  missing_location: 'Localização não informada. Preencha o endereço do proprietário.',
  exceeded_quota:
    'Cota de anúncios do Mercado Livre excedida. Feche anúncios antigos ou contrate mais quota.',
  invalid_attributes: 'Atributos inválidos. Verifique os dados técnicos do veículo.',
  image_not_found: 'Imagem não encontrada. Verifique as URLs das fotos.',
  token_expired: 'Token de acesso expirado. Reautentique a integração.',
  unauthorized: 'Não autorizado no Mercado Livre. Reconecte sua conta.',
  rate_limit: 'Limite de requisições excedido. Aguarde alguns minutos.',
  duplicate: 'Já existe um anúncio duplicado para este veículo.',
  not_found: 'Recurso não encontrado no portal.',
  validation_error: 'Dados inválidos enviados ao portal. Revise os campos obrigatórios.',
  quota_exceeded: 'Cota de anúncios do Mercado Livre excedida.',
  contact_info_forbidden: 'Informações de contato não são permitidas pelo Mercado Livre.',
  body_invalid: 'Dados do veículo inválidos para o Mercado Livre.',
  forbidden: 'Acesso negado no Mercado Livre. Verifique permissões da conta.',
}

export function translateError(code: string): string {
  const key = Object.keys(ERROR_MAP).find((k) => code.toLowerCase().includes(k.toLowerCase()))
  return key ? ERROR_MAP[key] : code || 'Erro desconhecido na sincronização.'
}
