import { Component, type ErrorInfo, type ReactNode } from 'react'

// 11/11/2026: antes não existia nenhuma proteção — qualquer erro ao montar uma tela desmontava o
// aplicativo inteiro e deixava a tela branca (achado no painel aberto pelo iPhone). Agora o erro
// fica contido aqui: mensagem em português, botões de recarregar/voltar e o detalhe técnico em
// letra pequena, para quem estiver no celular conseguir mandar um print do erro real.
// Fica FORA do roteador e do login (App.tsx), por isso usa só <a>/location, sem hooks.

type Props = { children: ReactNode }
type State = { erro: Error | null; ondeAconteceu: string }

// Erro de "peça do sistema não carregou" (arquivo de código velho/ausente depois de um deploy).
// Cada navegador escreve de um jeito; o Safari usa "Importing a module script failed".
const ERRO_DE_CARREGAMENTO =
  /dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError|Loading chunk/i

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { erro: null, ondeAconteceu: '' }

  static getDerivedStateFromError(erro: Error): Partial<State> {
    return { erro }
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    console.error('[Carro e Cia] Erro capturado pela proteção de telas:', erro, info.componentStack)
    // Só as primeiras linhas: o suficiente para localizar o componente, sem poluir a tela.
    const linhas = (info.componentStack || '').trim().split('\n').slice(0, 4)
    this.setState({ ondeAconteceu: linhas.map((l) => l.trim()).join(' ← ') })
  }

  render() {
    const { erro, ondeAconteceu } = this.state
    if (!erro) return this.props.children

    const ehCarregamento = ERRO_DE_CARREGAMENTO.test(`${erro.name} ${erro.message}`)

    return (
      <div
        role="alert"
        style={{
          fontFamily: 'system-ui, sans-serif',
          maxWidth: 440,
          margin: '12vh auto',
          padding: 24,
          textAlign: 'center',
          color: '#1a1a1a',
        }}
      >
        <h1 style={{ fontSize: 20, margin: '0 0 12px' }}>Algo deu errado nesta tela</h1>
        <p style={{ margin: '0 0 20px', lineHeight: 1.5 }}>
          {ehCarregamento
            ? 'Uma parte do sistema não carregou (geralmente acontece logo depois de uma atualização). Recarregar costuma resolver.'
            : 'Tente recarregar. Se continuar, tire um print desta tela e envie para o suporte.'}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              background: '#c40000',
              color: '#fff',
              border: 0,
              borderRadius: 6,
              padding: '10px 18px',
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            Recarregar a página
          </button>
          <a
            href={window.location.pathname.startsWith('/admin') ? '/admin' : '/'}
            style={{
              border: '1px solid #c40000',
              color: '#c40000',
              borderRadius: 6,
              padding: '10px 18px',
              fontSize: 15,
              textDecoration: 'none',
            }}
          >
            Voltar ao início
          </a>
        </div>
        <p
          style={{
            margin: '28px 0 0',
            fontSize: 11,
            color: '#777',
            wordBreak: 'break-word',
            textAlign: 'left',
          }}
        >
          Detalhe técnico: {erro.name}: {erro.message}
          {ondeAconteceu ? ` — em ${ondeAconteceu}` : ''}
        </p>
      </div>
    )
  }
}
