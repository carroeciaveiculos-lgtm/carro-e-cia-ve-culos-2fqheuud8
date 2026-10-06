import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Check, Edit2, Loader2, RefreshCw, Repeat, Save, Trash2, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatarHorario } from '@/lib/horario-livre'
import {
  MIN_FOTOS_CARROSSEL,
  agendarPost,
  duplicarPostPublicado,
  excluirPost,
  midiasDoPost,
  paraCampoData,
  salvarEdicaoPost,
  type PostSocial,
} from '@/services/social-posts'

// Botões de ação de UM post da fila de redes sociais, conforme o estado dele (04/10/2026,
// pedido da Adriana: "botões na linha de itens"). Usado na tabela de Publicações, no painel
// lateral de detalhes e no que mais precisar — a lógica mora em services/social-posts.ts.
//
//   Rascunho/Aprovado: Aprovar, Editar, Excluir      Agendado: Editar, Excluir
//   Erro: Publicar novamente, Editar, Excluir        Publicado: Publicar novamente, Excluir
//   Publicando: nenhum (o publicador está trabalhando no post)

type Post = PostSocial

interface Props {
  post: Post
  // chamado depois de qualquer ação que muda a lista (a tela recarrega os posts)
  aoMudar: () => void
  // 'linha' = botões lado a lado, compactos (tabela); 'coluna' = largos, empilhados (painel)
  layout?: 'linha' | 'coluna'
}

export function AcoesPostSocial({ post, aoMudar, layout = 'linha' }: Props) {
  const { toast } = useToast()
  const [ocupado, setOcupado] = useState(false)
  const [confirmacao, setConfirmacao] = useState<'excluir' | 'republicar' | null>(null)
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState('')
  const [dataLocal, setDataLocal] = useState('')
  const [midias, setMidias] = useState<string[]>([])

  const status = post.status ?? ''
  const ehCarrossel = post.formato === 'feed_carrossel'
  const podeEditar = ['Rascunho', 'Agendado', 'Erro', 'Aprovado'].includes(status)
  const podeAprovar = status === 'Rascunho' || status === 'Aprovado'

  const falha = (titulo: string, erro: string) =>
    toast({ title: titulo, description: erro, variant: 'destructive' })

  const executar = async (
    acao: () => Promise<{ erro: string | null; horario?: Date }>,
    sucesso: string,
    falhou: string,
  ) => {
    setOcupado(true)
    const { erro, horario } = await acao()
    setOcupado(false)
    if (erro) {
      falha(falhou, erro)
      return false
    }
    toast({
      title: horario
        ? `${sucesso.split('!')[0]}! Sai em ${formatarHorario(horario)} (próximo horário livre).`
        : sucesso,
    })
    aoMudar()
    return true
  }

  const aprovar = () =>
    executar(
      () => agendarPost(post.id),
      'Post aprovado! Ele entra na fila (até 15 min) e avisamos quando sair.',
      'Não foi possível aprovar o post',
    )

  const tentarDeNovo = () =>
    executar(
      () => agendarPost(post.id, { imediato: true }),
      'Nova tentativa na fila. Ela sai em até 15 minutos.',
      'Não foi possível publicar novamente',
    )

  const confirmar = async () => {
    const tipo = confirmacao
    setConfirmacao(null)
    if (tipo === 'excluir') {
      await executar(
        () => excluirPost(post.id),
        status === 'Publicado'
          ? 'Removido da lista. A publicação continua no Instagram/Facebook.'
          : 'Post excluído',
        'Não foi possível excluir o post',
      )
    } else if (tipo === 'republicar') {
      await executar(
        () => duplicarPostPublicado(post),
        'Nova publicação na fila! Ela sai em até 15 minutos.',
        'Não foi possível publicar novamente',
      )
    }
  }

  const abrirEdicao = () => {
    setTexto(post.texto ?? '')
    setDataLocal(paraCampoData(post.data_agendamento))
    setMidias(midiasDoPost(post))
    setEditando(true)
  }

  const salvar = async () => {
    const ok = await executar(
      () => salvarEdicaoPost(post, { texto, dataLocal, midias }),
      'Alterações salvas',
      'Não foi possível salvar as alterações',
    )
    if (ok) setEditando(false)
  }

  if (status === 'Publicando') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-700">
        <Loader2 className="w-3 h-3 animate-spin" /> Publicando agora...
      </span>
    )
  }

  const larg = layout === 'coluna' ? 'w-full justify-start h-9' : ''

  return (
    // Os cliques aqui não podem "vazar" pra linha da tabela (que abre o painel de detalhes).
    <div
      className={layout === 'coluna' ? 'flex flex-col gap-2' : 'flex flex-wrap justify-end gap-1.5'}
      onClick={(e) => e.stopPropagation()}
    >
      {podeAprovar && (
        <Button
          size="sm"
          className={`bg-green-600 hover:bg-green-700 ${larg}`}
          disabled={ocupado}
          onClick={aprovar}
        >
          <Check className="w-3 h-3 mr-1" /> Aprovar
        </Button>
      )}
      {status === 'Erro' && (
        <Button
          size="sm"
          className={`bg-blue-600 hover:bg-blue-700 ${larg}`}
          disabled={ocupado}
          onClick={tentarDeNovo}
        >
          <RefreshCw className="w-3 h-3 mr-1" /> Publicar novamente
        </Button>
      )}
      {status === 'Publicado' && (
        <Button
          size="sm"
          className={`bg-blue-600 hover:bg-blue-700 ${larg}`}
          disabled={ocupado}
          onClick={() => setConfirmacao('republicar')}
        >
          <Repeat className="w-3 h-3 mr-1" /> Publicar novamente
        </Button>
      )}
      {podeEditar && (
        <Button
          size="sm"
          variant="outline"
          className={`bg-white ${larg}`}
          disabled={ocupado}
          onClick={abrirEdicao}
        >
          <Edit2 className="w-3 h-3 mr-1" /> Editar
        </Button>
      )}
      <Button
        size="sm"
        variant="destructive"
        className={larg}
        disabled={ocupado}
        onClick={() => setConfirmacao('excluir')}
      >
        <Trash2 className="w-3 h-3 mr-1" /> Excluir
      </Button>

      <AlertDialog open={!!confirmacao} onOpenChange={(aberto) => !aberto && setConfirmacao(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmacao === 'excluir' ? 'Excluir este post?' : 'Publicar novamente?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmacao === 'excluir'
                ? status === 'Publicado'
                  ? 'O post será removido desta lista. Ele continua publicado no Instagram e no Facebook — para tirá-lo das redes, apague lá.'
                  : 'O post será apagado da fila e não será publicado.'
                : 'Será criado um post novo, igual a este, que vai para a fila e sai em até 15 minutos. O post original continua como está nas redes — o conteúdo aparecerá duas vezes.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmar}>
              {confirmacao === 'excluir' ? 'Excluir' : 'Publicar novamente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editando} onOpenChange={setEditando}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar post</DialogTitle>
            <DialogDescription>
              Mude a legenda, o horário de publicação e, no carrossel, as fotos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {midias.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {midias.map((url, i) => (
                  <div
                    key={`${url}-${i}`}
                    className="relative shrink-0 w-24 h-24 rounded-md overflow-hidden bg-slate-100"
                  >
                    <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                    {ehCarrossel && midias.length > MIN_FOTOS_CARROSSEL && (
                      <button
                        type="button"
                        title="Tirar esta foto do carrossel"
                        className="absolute top-1 right-1 rounded-full bg-black/70 text-white p-0.5 hover:bg-red-600"
                        onClick={() => setMidias((prev) => prev.filter((_, idx) => idx !== i))}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {ehCarrossel && (
              <p className="text-xs text-slate-500">
                Para tirar uma foto do carrossel, clique no X dela (mínimo {MIN_FOTOS_CARROSSEL}{' '}
                fotos).
              </p>
            )}
            <div className="space-y-1">
              <Label>Legenda</Label>
              <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={12} />
            </div>
            <div className="space-y-1">
              <Label>Data e hora de publicação</Label>
              <Input
                type="datetime-local"
                value={dataLocal}
                onChange={(e) => setDataLocal(e.target.value)}
                className="max-w-xs"
              />
              <p className="text-xs text-slate-500">
                Se a data já passou, o post sai no próximo ciclo (até 15 minutos) depois de
                aprovado.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(false)} disabled={ocupado}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={ocupado}>
              {ocupado ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Save className="w-3 h-3 mr-1" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
