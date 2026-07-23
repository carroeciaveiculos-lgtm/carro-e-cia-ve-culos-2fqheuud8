const ERROR_MAP: Record<string, string> = {
  pictures_does_not_comply_requirements:
    'As fotos não atendem aos requisitos do ML. Verifique formato, tamanho e conteúdo.',
  title_too_long: 'Título do anúncio muito longo. Máximo 60 caracteres.',
  missing_location: 'Localização não informada. Preencha o endereço do proprietário.',
  exceeded_quota: 'Cota de anúncios do ML excedida. Feche anúncios antigos ou contrate mais quota.',
  invalid_attributes: 'Atributos inválidos. Verifique os dados técnicos do veículo.',
  image_not_found: 'Imagem não encontrada. Verifique as URLs das fotos.',
  token_expired: 'Token de acesso expirado. Reautentique a integração.',
  unauthorized: 'Não autorizado no ML. Reconecte sua conta.',
  rate_limit: 'Limite de requisições excedido. Aguarde alguns minutos.',
  duplicate: 'Já existe um anúncio duplicado para este veículo.',
  not_found: 'Recurso não encontrado no portal.',
  validation_error: 'Dados inválidos enviados ao portal. Revise os campos obrigatórios.',
  quota_exceeded: 'Cota de anúncios do ML excedida.',
  contact_info_forbidden: 'Informações de contato não permitidas pelo ML.',
  body_invalid: 'Dados do veículo inválidos para o ML.',
  forbidden: 'Acesso negado no ML. Verifique permissões da conta.',
  item_not_found: 'Anúncio não encontrado no ML. Pode ter sido removido.',
  invalid_grant: 'Conexão expirada. Clique em Reconectar no painel.',
  body_parse_error: 'Erro ao processar dados enviados ao ML.',
  ltp_picture_required: 'Fotos obrigatórias ausentes. Adicione pelo menos 1 foto.',
  ltp_item_title_length: 'Título muito longo. Máximo 60 caracteres.',
  ltp_category_required: 'Categoria obrigatória não informada.',
  ltp_price_required: 'Preço obrigatório não informado.',
  ltp_picture_qty: 'Quantidade insuficiente de fotos.',
  ltp_listing_type: 'Tipo de anúncio inválido.',
  ltp_attribute_required: 'Atributo obrigatório ausente no ML.',
  ltp_description_field: 'Conteúdo não permitido na descrição.',
  server_error: 'Erro interno do ML. Tente novamente mais tarde.',
  timeout: 'Tempo limite excedido. Tente novamente.',
  missing_attributes: 'Atributos obrigatórios ausentes. Complete a ficha técnica.',
  invalid_format: 'Formato de imagem inválido. Apenas JPEG ou PNG.',
  resolution_too_low: 'Resolução da imagem muito baixa. Mínimo 800x800px.',
  image_too_large: 'Imagem muito grande. Máximo 10MB por arquivo.',
}

export function translateError(code: string): string {
  const key = Object.keys(ERROR_MAP).find((k) => code.toLowerCase().includes(k.toLowerCase()))
  return key ? ERROR_MAP[key] : code || 'Erro desconhecido na sincronização.'
}
