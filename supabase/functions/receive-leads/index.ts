// Lógica para o Skip IA integrar no tratamento da resposta do Gemini em 'receive-leads'

try {
  const rawText = aiRes.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const jsonStr = rawText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)?.[1] || rawText
  const parsed = JSON.parse(jsonStr)

  if (parsed.reply) responseText = parsed.reply
  if (parsed.temperature) temp = parsed.temperature
  if (parsed.trade_in_car) tradeIn = parsed.trade_in_car
  if (parsed.payment_method) payMethod = parsed.payment_method

  // NOVA ATUALIZAÇÃO: Se o Gemini capturar dados cadastrais, atualiza o Lead no Supabase
  if (parsed.extracted_data) {
    const dataUpdate: any = {}
    if (parsed.extracted_data.nome_completo) dataUpdate.nome = parsed.extracted_data.nome_completo
    if (parsed.extracted_data.cpf) dataUpdate.cpf = parsed.extracted_data.cpf
    if (parsed.extracted_data.email) dataUpdate.email = parsed.extracted_data.email
    if (parsed.extracted_data.cep) dataUpdate.observacoes = `CEP: ${parsed.extracted_data.cep}` // ou coluna específica de endereço
    if (parsed.extracted_data.valor_entrada)
      dataUpdate.faixa_preco = `Entrada de R$ ${parsed.extracted_data.valor_entrada}`

    if (Object.keys(dataUpdate).length > 0) {
      console.log('Atualizando dados cadastrais capturados pela IA:', JSON.stringify(dataUpdate))
      await supabase.from('leads').update(dataUpdate).eq('id', lead.id)
    }
  }
} catch (e) {
  console.error('Failed to parse Gemini JSON')
}
