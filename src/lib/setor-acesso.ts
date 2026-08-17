// Mapa de rota do painel -> setor(es) que podem acessar. Uma rota com mais
// de um setor listado é liberada pra quem tiver PELO MENOS UM deles.
// Rotas fora deste mapa (ex: /admin, /admin/ajuda) ficam liberadas pra
// qualquer pessoa logada — são páginas de uso geral, não exclusivas de setor.
// admin_master sempre vê tudo, independente deste mapa.
//
// Mapeamento é decisão de negócio, não técnica — revisar com a Adriana se
// alguém reclamar de acesso faltando ou sobrando (17/08/2026).
export const ROTA_SETORES: Record<string, string[]> = {
  '/admin/estoque': ['Estoque/Portais'],
  '/admin/crm': ['Vendas'],
  '/admin/conversas': ['Vendas'],
  '/admin/agendamentos': ['Vendas'],
  '/admin/relatorios': ['Institucional'],
  '/admin/avaliacao': ['Vendas', 'Consignação'],
  '/admin/financiamento': ['Financiamentos'],
  '/admin/administrativo': ['Financeiro/Administrativo'],
  '/admin/modelos-documentos': ['Financeiro/Administrativo'],
  '/admin/portais': ['Estoque/Portais'],
  '/admin/vagas': ['Institucional'],
  '/admin/marketing': ['Marketing'],
  '/admin/anuncios': ['Marketing'],
  '/admin/central-social': ['Marketing'],
  '/admin/conteudo': ['Marketing'],
  '/admin/design': ['Marketing'],
  '/admin/configuracoes': ['Desenvolvedor e TI'],
  '/admin/autonomia': ['Desenvolvedor e TI'],
  '/admin/prompts-ia': ['Desenvolvedor e TI'],
  '/admin/usuarios': ['Desenvolvedor e TI'],
  '/admin/auditoria': ['Desenvolvedor e TI'],
  '/admin/logs': ['Desenvolvedor e TI'],
}

export function rotaLiberada(
  pathname: string,
  nivel: string | null,
  setorNomes: string[],
): boolean {
  if (nivel === 'admin_master') return true
  const entry = Object.entries(ROTA_SETORES).find(([path]) => pathname.startsWith(path))
  if (!entry) return true
  const setoresNecessarios = entry[1]
  return setoresNecessarios.some((s) => setorNomes.includes(s))
}
