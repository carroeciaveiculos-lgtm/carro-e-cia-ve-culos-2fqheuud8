// Cor padrão do estoque — SEMPRE no masculino ("Preto", "Branco"), nunca
// "Preta"/"Branca" (regra da Adriana, 01/10/2026).
// ESPELHO de src/lib/cor-veiculo.ts (o front não é importável daqui): se mudar
// a lista de grafias lá, mude aqui também.
const GRAFIAS: Record<string, string> = {
  branco: 'Branco',
  branca: 'Branco',
  preto: 'Preto',
  preta: 'Preto',
  prata: 'Prata',
  prateado: 'Prata',
  prateada: 'Prata',
  cinza: 'Cinza',
  grafite: 'Cinza',
  chumbo: 'Cinza',
  vermelho: 'Vermelho',
  vermelha: 'Vermelho',
  azul: 'Azul',
  verde: 'Verde',
  amarelo: 'Amarelo',
  amarela: 'Amarelo',
  laranja: 'Laranja',
  marrom: 'Marrom',
  bege: 'Bege',
  dourado: 'Dourado',
  dourada: 'Dourado',
  vinho: 'Vinho',
  bronze: 'Bronze',
  rosa: 'Rosa',
  roxo: 'Roxo',
  roxa: 'Roxo',
}

// Devolve a cor padrão, ou null se não reconhecer.
export function normalizarCor(valor: string | null | undefined): string | null {
  if (!valor) return null
  const chave = valor
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase()
  return GRAFIAS[chave] ?? null
}
