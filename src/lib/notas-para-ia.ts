// "Notas / Destaques (para IA)" grava em veiculos.notas_internas, campo que o
// sistema também usa pra anotar avisos automáticos (ex.: o ml-performance
// acrescenta "ML Performance Score: 45/100 — requires optimization"). Essas
// linhas são do sistema, não destaque do carro, e não podem virar texto de
// anúncio.
const LINHA_DO_SISTEMA = /^ML Performance Score\b/i

export function notasParaIA(notas?: string | null): string {
  return (notas || '')
    .split('\n')
    .map((linha) => linha.trim())
    .filter((linha) => linha && !LINHA_DO_SISTEMA.test(linha))
    .join(' | ')
}
