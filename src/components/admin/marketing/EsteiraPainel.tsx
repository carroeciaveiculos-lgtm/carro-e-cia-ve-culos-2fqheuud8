import { useCallback, useEffect, useState } from 'react'
import { Check, Facebook, Instagram, Loader2, Pause, Play, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { useToast } from '@/hooks/use-toast'
import { formatarHorario, interpretarHorarios } from '@/lib/horario-livre'
import {
  type PainelEsteira,
  aprovarItem,
  chamarEsteira,
  definirAtiva,
  nomeDoItem,
  obterPainel,
  rotuloTipo,
} from '@/services/esteira'

// Painel da esteira de postagens (05/10/2026), no topo da aba Aprovações. Mostra UM item por vez
// (veículo + tipo, com Instagram e Facebook juntos): a equipe aprova os dois de uma vez ou pula o
// veículo, e o próximo aparece sozinho. Nada é aprovado sem o clique. A esteira nasce pausada.

const ATUALIZA_MS = 20_000

export function EsteiraPainel({ aoMudar }: { aoMudar?: () => void }) {
  const { toast } = useToast()
  const [painel, setPainel] = useState<PainelEsteira | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [confirmarPular, setConfirmarPular] = useState(false)

  const carregar = useCallback(async () => {
    const { data, erro: e } = await obterPainel()
    setPainel(data)
    setErro(e)
  }, [])

  useEffect(() => {
    carregar()
    const t = setInterval(carregar, ATUALIZA_MS)
    return () => clearInterval(t)
  }, [carregar])

  const depoisDeAcao = async () => {
    await carregar()
    aoMudar?.()
  }

  // Pede o próximo item e mostra o resultado em português
  const gerarProximo = async (silencioso = false) => {
    const { erro: e, resposta } = await chamarEsteira('proximo')
    if (e) {
      toast({
        title: 'A esteira não conseguiu gerar o próximo',
        description: e,
        variant: 'destructive',
      })
      return
    }
    if (!silencioso) {
      const msg: Record<string, string> = {
        criado: 'Próximo item criado. Confira abaixo e aprove.',
        fila_vazia: 'A fila acabou: todos os veículos foram tratados.',
        aguardando_aprovacao: 'Ainda há um item aguardando a sua decisão.',
        pausada: 'A esteira está pausada.',
        ocupada: 'A esteira já está trabalhando. Tente de novo em instantes.',
        varios_bloqueados:
          'Vários veículos seguidos estão sem fotos limpas suficientes. Veja a aba Fotos.',
        erro: `Erro ao montar o item: ${resposta?.erro ?? 'tente de novo'}`,
      }
      toast({ title: msg[resposta?.acao ?? ''] ?? 'Esteira atualizada' })
    }
  }

  const alternar = async () => {
    if (!painel) return
    setOcupado(true)
    const ligar = !painel.config.ativa
    const { erro: e } = await definirAtiva(ligar)
    if (e) {
      setOcupado(false)
      toast({ title: 'Não foi possível alterar a esteira', description: e, variant: 'destructive' })
      return
    }
    if (ligar) await gerarProximo(true)
    else toast({ title: 'Esteira pausada. Nada novo será criado até você ligar de novo.' })
    setOcupado(false)
    await depoisDeAcao()
  }

  const aprovar = async () => {
    if (!painel?.atual) return
    setOcupado(true)
    const r = await aprovarItem(painel.atual.posts)
    if (r.erro) {
      setOcupado(false)
      toast({ title: 'Não foi possível aprovar', description: r.erro, variant: 'destructive' })
      return
    }
    toast({
      title: `Aprovado! Instagram e Facebook saem em ${r.horario ? formatarHorario(r.horario) : 'breve'} (próximo horário livre).`,
    })
    await gerarProximo(true) // o próximo item já aparece
    setOcupado(false)
    await depoisDeAcao()
  }

  const pular = async () => {
    if (!painel?.atual) return
    setConfirmarPular(false)
    setOcupado(true)
    const { erro: e } = await chamarEsteira('pular', painel.atual.id)
    setOcupado(false)
    if (e) {
      toast({ title: 'Não foi possível pular', description: e, variant: 'destructive' })
      return
    }
    toast({ title: 'Veículo pulado. Os rascunhos foram apagados e o próximo já foi preparado.' })
    await depoisDeAcao()
  }

  if (erro && !painel) {
    return (
      <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        Não foi possível carregar a esteira: {erro}
      </div>
    )
  }
  if (!painel) return null

  const { config, contagem, atual, proximos, bloqueados } = painel
  const horarios = interpretarHorarios(config.horarios).join(' e ') || '10:00 e 18:00'
  const totalItens =
    contagem.fila +
    contagem.em_aprovacao +
    contagem.concluido +
    contagem.pulado +
    contagem.bloqueado
  const rascunhos = atual?.posts.filter((p) => p.status === 'Rascunho') ?? []

  return (
    <div className="mb-6 rounded-xl border bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b p-4">
        <div>
          <h3 className="font-bold text-slate-900">Esteira de postagens</h3>
          <p className="text-xs text-slate-500">
            Um veículo por vez, Instagram e Facebook juntos. Nada sai sem a sua aprovação.
          </p>
        </div>
        <Badge
          variant="outline"
          className={
            config.ativa
              ? 'border-green-400 bg-green-50 text-green-700'
              : 'border-slate-300 text-slate-600'
          }
        >
          {config.ativa ? 'Ativa' : 'Pausada'}
        </Badge>
        <div className="ml-auto flex gap-2">
          {config.ativa && !atual && contagem.fila > 0 && (
            <Button
              size="sm"
              variant="outline"
              disabled={ocupado}
              onClick={() => gerarProximo().then(depoisDeAcao)}
            >
              Gerar o próximo agora
            </Button>
          )}
          <Button
            size="sm"
            variant={config.ativa ? 'outline' : 'default'}
            disabled={ocupado}
            onClick={alternar}
          >
            {ocupado ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : config.ativa ? (
              <Pause className="w-3 h-3 mr-1" />
            ) : (
              <Play className="w-3 h-3 mr-1" />
            )}
            {config.ativa ? 'Pausar esteira' : 'Ligar esteira'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-b p-3 text-center text-xs sm:grid-cols-4">
        <div>
          <b className="block text-lg text-slate-900">{contagem.concluido}</b> concluídos
        </div>
        <div>
          <b className="block text-lg text-slate-900">{contagem.fila}</b> na fila
        </div>
        <div>
          <b className="block text-lg text-slate-900">{contagem.pulado}</b> pulados
        </div>
        <div>
          <b className="block text-lg text-amber-700">{contagem.bloqueado}</b> precisam de fotos
        </div>
      </div>

      {atual ? (
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Item {contagem.concluido + contagem.pulado + contagem.bloqueado + 1} de {totalItens}
            </span>
            <span className="font-bold text-slate-900">{nomeDoItem(atual)}</span>
            {atual.veiculos?.placa && (
              <span className="text-xs text-slate-500">{atual.veiculos.placa}</span>
            )}
            <Badge variant="outline">{rotuloTipo(atual.tipo)}</Badge>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {atual.posts.map((p) => (
              <Badge key={p.id} variant="outline" className="gap-1">
                {p.rede === 'instagram' ? (
                  <Instagram className="w-3 h-3" />
                ) : (
                  <Facebook className="w-3 h-3" />
                )}
                {p.rede === 'instagram' ? 'Instagram' : 'Facebook'} · {p.status}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            Confira os rascunhos logo abaixo (fotos, legenda). Para mudar a legenda ou as fotos, use
            "Editar" no cartão antes de aprovar.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              className="bg-green-600 hover:bg-green-700"
              disabled={ocupado || rascunhos.length === 0}
              onClick={aprovar}
            >
              <Check className="w-4 h-4 mr-1" /> Aprovar os dois
            </Button>
            <Button variant="outline" disabled={ocupado} onClick={() => setConfirmarPular(true)}>
              <SkipForward className="w-4 h-4 mr-1" /> Pular veículo
            </Button>
          </div>
        </div>
      ) : (
        <p className="p-4 text-sm text-slate-600">
          {config.ativa
            ? contagem.fila > 0
              ? 'Preparando o próximo item. Se demorar, use "Gerar o próximo agora".'
              : 'A fila acabou: todos os veículos foram tratados.'
            : 'A esteira está pausada. Ao ligar, o primeiro item aparece aqui para você aprovar.'}
        </p>
      )}

      {(proximos.length > 0 || bloqueados.length > 0) && (
        <details className="border-t p-4 text-sm">
          <summary className="cursor-pointer font-medium text-slate-700">
            Ver a fila e os bloqueados
          </summary>
          {proximos.length > 0 && (
            <>
              <p className="mt-3 text-xs font-semibold uppercase text-slate-500">
                Próximos (mais recentes primeiro)
              </p>
              <ol className="mt-1 list-decimal pl-5 text-slate-700">
                {proximos.map((i) => (
                  <li key={i.id}>
                    {nomeDoItem(i)}{' '}
                    <span className="text-xs text-slate-400">· {rotuloTipo(i.tipo)}</span>
                  </li>
                ))}
              </ol>
            </>
          )}
          {bloqueados.length > 0 && (
            <>
              <p className="mt-3 text-xs font-semibold uppercase text-amber-700">
                Precisam de fotos novas (aba Fotos)
              </p>
              <ul className="mt-1 space-y-1 text-slate-700">
                {bloqueados.map((i) => (
                  <li key={i.id}>
                    {nomeDoItem(i)} <span className="text-xs text-slate-500">· {i.motivo}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </details>
      )}

      <p className="border-t px-4 py-2 text-[11px] text-slate-400">
        Aprovado, o post sai no próximo horário livre ({horarios}, horário de Brasília,{' '}
        {config.posts_por_dia} por dia por rede). Só fotos sem marca de IA entram no carrossel.
        Vídeos entram na esteira numa próxima etapa.
      </p>

      <AlertDialog open={confirmarPular} onOpenChange={setConfirmarPular}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pular este veículo?</AlertDialogTitle>
            <AlertDialogDescription>
              Os rascunhos de Instagram e Facebook deste item serão apagados e o veículo não volta
              para a fila. O próximo é preparado em seguida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={pular}>Pular veículo</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
