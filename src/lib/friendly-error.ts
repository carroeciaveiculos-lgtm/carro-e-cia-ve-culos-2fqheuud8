// Regra da Adriana (22/09/2026): nenhuma mensagem de erro do sistema pode
// aparecer em inglês pro usuário. O Supabase/PostgREST sempre devolve erro
// cru em inglês (ex.: "Could not find the 'x' column...") -- esta função
// traduz os padrões mais comuns e cai num texto genérico em vez de vazar a
// mensagem original. Usar em todo catch de chamada ao Supabase que mostra
// erro pro usuário (toast, alerta, etc.).
export function mensagemErroAmigavel(err: any): string {
  const original = String(err?.message || err || '')

  if (/column .* (of|in) .* schema cache/i.test(original) || /could not find the .* column/i.test(original)) {
    return 'Erro interno ao salvar (campo inesperado enviado ao banco). Tente novamente; se persistir, avise o suporte técnico.'
  }
  if (/duplicate key value violates unique constraint/i.test(original)) {
    return 'Já existe um registro com esse valor (ex.: placa, e-mail ou código duplicado).'
  }
  if (/violates foreign key constraint/i.test(original)) {
    return 'Esse registro está vinculado a outro que não existe mais. Recarregue a página e tente de novo.'
  }
  if (/violates not-null constraint/i.test(original)) {
    return 'Falta preencher um campo obrigatório.'
  }
  if (/violates check constraint/i.test(original)) {
    return 'Um dos valores informados não é válido pra esse campo.'
  }
  if (/JWT|not authenticated|invalid claim/i.test(original)) {
    return 'Sua sessão expirou. Atualize a página e faça login de novo.'
  }
  if (/permission denied|RLS|row-level security/i.test(original)) {
    return 'Seu usuário não tem permissão pra essa ação.'
  }
  if (/Failed to fetch|NetworkError|network request failed/i.test(original)) {
    return 'Falha de conexão. Verifique sua internet e tente de novo.'
  }

  return 'Não foi possível salvar. Tente novamente; se persistir, avise o suporte técnico.'
}
