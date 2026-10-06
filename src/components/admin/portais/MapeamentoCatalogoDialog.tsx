import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import {
  confirmarMapeamentoNapista,
  motivoPendenciaNapista,
  remapearVeiculoNapista,
} from '@/services/plataformas'
import { NOME_PLATAFORMA_MAPEAVEL, type PlataformaMapeavel } from '@/lib/mapeamento-catalogo'

interface Candidato {
  id: string
  nome: string
  score: number
  // Anos de modelo que a Webmotors aceita para esta versão (só versões; vazio = não informado)
  anos?: number[] | null
}

type Motivo = 'marca' | 'modelo' | 'versao' | 'catalogo'

interface EstadoPendente {
  motivo: Motivo
  erroMsg: string | null
  candidatosModelo: Candidato[]
  candidatosVersao: Candidato[]
}

// O que o sistema mapeou (ids do catálogo da plataforma + nomes pra mostrar).
interface MapeamentoAtual {
  marcaId: string | null
  modeloId: string | null
  versaoId: string | null
  marcaNome: string | null
  modeloNome: string | null
  versaoNome: string | null
}

interface Troca {
  etapa: 'modelo' | 'versao'
  modeloId: string | null
  itens: Candidato[]
  busca: string
  carregando: boolean
}

type Fase = 'carregando' | 'escolher' | 'confirmar' | 'trocar' | 'erro'

interface Props {
  veiculoId: string | null
  plataforma: PlataformaMapeavel | null
  nomeVeiculo?: string
  // 'resolver' (padrão): abre por causa de um erro de publicação e só some
  // quando o mapeamento fecha. 'confirmar': abre no cadastro do veículo e
  // mostra o que o sistema mapeou sozinho, pra conferir ("Está certo") ou
  // trocar — mapeamento errado e silencioso publica o veículo trocado.
  modo?: 'resolver' | 'confirmar'
  // Obrigatório (cadastro de veículo novo): não dá pra fechar nem pular — só
  // confirmar/trocar, voltar pro cadastro pra corrigir, ou (quando a plataforma
  // realmente não tem o veículo) seguir sem ela.
  obrigatorio?: boolean
  onVoltarCorrigir?: () => void
  onSeguirSemPlataforma?: () => void
  onClose: () => void
  // Chamado quando o mapeamento ficou completo/confirmado. Quem abriu decide o
  // que fazer em seguida (reenviar pra plataforma, avançar a fila...).
  onResolvido: (veiculoId: string, plataforma: PlataformaMapeavel) => void
}

const candidatosWm = (lista: any[] | null): Candidato[] =>
  (lista || []).map((c) => ({
    id: c.codigo_wm,
    nome: c.nome_wm,
    score: c.score || 0,
    anos: c.anos_modelo ?? null,
  }))

const candidatosNapista = (lista: any[] | null): Candidato[] =>
  (lista || []).map((c) => ({ id: c.id, nome: c.nome, score: c.score || 0 }))

// Diálogo único de mapeamento de catálogo (Webmotors e NaPista). Criado em
// 01/10/2026 (caso real: Nissan Frontier) pra resolver o erro na hora da
// publicação e, no modo 'confirmar', pra conferir o veículo certo no cadastro.
// Ao abrir já tenta mapear sozinho (no NaPista, baixando o catálogo da marca se
// estiver vazio/defasado) e só pede ajuda quando precisa de uma escolha.
export function MapeamentoCatalogoDialog({
  veiculoId,
  plataforma,
  nomeVeiculo,
  modo = 'resolver',
  obrigatorio = false,
  onVoltarCorrigir,
  onSeguirSemPlataforma,
  onClose,
  onResolvido,
}: Props) {
  const { toast } = useToast()
  const [fase, setFase] = useState<Fase>('carregando')
  const [pendente, setPendente] = useState<EstadoPendente | null>(null)
  const [atual, setAtual] = useState<MapeamentoAtual | null>(null)
  const [troca, setTroca] = useState<Troca | null>(null)
  const [mensagemErro, setMensagemErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  // Descarta resposta de uma abertura antiga se o diálogo foi trocado/fechado
  // enquanto a chamada ainda estava no ar.
  const tentativa = useRef(0)
  // onResolvido muda a cada render do pai; guardado em ref pra não reexecutar
  // o mapeamento em loop (o efeito de abertura só pode depender do veículo e
  // da plataforma).
  const onResolvidoRef = useRef(onResolvido)
  onResolvidoRef.current = onResolvido

  const nomePlataforma = plataforma ? NOME_PLATAFORMA_MAPEAVEL[plataforma] : ''

  // Nomes legíveis do que está mapeado (catálogo local da plataforma).
  const carregarNomes = useCallback(
    async (
      alvo: PlataformaMapeavel,
      ids: { marcaId: string | null; modeloId: string | null; versaoId: string | null },
    ): Promise<MapeamentoAtual> => {
      const { marcaId, modeloId, versaoId } = ids
      if (alvo === 'napista') {
        const [marca, modelo, versao] = await Promise.all([
          marcaId
            ? supabase.from('napista_marcas').select('nome').eq('id', marcaId).maybeSingle()
            : null,
          modeloId
            ? supabase.from('napista_modelos').select('nome').eq('id', modeloId).maybeSingle()
            : null,
          versaoId
            ? supabase.from('napista_versoes').select('nome').eq('id', versaoId).maybeSingle()
            : null,
        ])
        return {
          ...ids,
          marcaNome: marca?.data?.nome ?? null,
          modeloNome: modelo?.data?.nome ?? null,
          versaoNome: versao?.data?.nome ?? null,
        }
      }
      const [marca, modelo, versao] = await Promise.all([
        marcaId
          ? supabase.from('wm_marcas').select('nome_wm').eq('codigo_wm', marcaId).maybeSingle()
          : null,
        modeloId
          ? supabase
              .from('wm_modelos')
              .select('nome_wm')
              .eq('codigo_wm', modeloId)
              .eq('codigo_marca_wm', marcaId ?? '')
              .maybeSingle()
          : null,
        versaoId
          ? supabase
              .from('wm_versoes')
              .select('nome_wm')
              .eq('codigo_wm', versaoId)
              .eq('codigo_modelo_wm', modeloId ?? '')
              .maybeSingle()
          : null,
      ])
      return {
        ...ids,
        marcaNome: marca?.data?.nome_wm ?? null,
        modeloNome: modelo?.data?.nome_wm ?? null,
        versaoNome: versao?.data?.nome_wm ?? null,
      }
    },
    [],
  )

  // Lê o estado real do mapeamento no banco.
  const lerEstado = useCallback(
    async (id: string, alvo: PlataformaMapeavel, motivoResposta?: string) => {
      let status: string | null = null
      let erroMsg: string | null = null
      let marcaId: string | null = null
      let modeloId: string | null = null
      let versaoId: string | null = null
      let candModelo: Candidato[] = []
      let candVersao: Candidato[] = []

      if (alvo === 'napista') {
        const { data } = await supabase
          .from('napista_mapeamento_veiculos')
          .select(
            'status_sincronizacao, erro_msg, napista_marca_id, napista_modelo_id, napista_version_id, candidatos_modelo, candidatos_versao',
          )
          .eq('veiculo_id', id)
          .maybeSingle()
        if (!data) return null
        status = data.status_sincronizacao
        erroMsg = data.erro_msg
        marcaId = data.napista_marca_id
        modeloId = data.napista_modelo_id
        versaoId = data.napista_version_id
        candModelo = candidatosNapista(data.candidatos_modelo as any[])
        candVersao = candidatosNapista(data.candidatos_versao as any[])
      } else {
        const { data } = await supabase
          .from('wm_mapeamento_veiculos')
          .select(
            'status_sincronizacao, erro_msg, codigo_marca_wm, codigo_modelo_wm, codigo_versao_wm, candidatos_modelo, candidatos_versao',
          )
          .eq('veiculo_id', id)
          .maybeSingle()
        if (!data) return null
        status = data.status_sincronizacao
        erroMsg = data.erro_msg
        marcaId = data.codigo_marca_wm
        modeloId = data.codigo_modelo_wm
        versaoId = data.codigo_versao_wm
        candModelo = candidatosWm(data.candidatos_modelo as any[])
        candVersao = candidatosWm(data.candidatos_versao as any[])
      }

      const mapeado = status === 'mapeado'
      // A function de mapeamento diz em qual etapa parou; sem essa resposta,
      // deduz pelos ids já preenchidos.
      let motivo: Motivo
      if (motivoResposta === 'catalogo_wm' || motivoResposta === 'catalogo_napista')
        motivo = 'catalogo'
      else if (
        motivoResposta === 'marca' ||
        motivoResposta === 'modelo' ||
        motivoResposta === 'versao'
      )
        motivo = motivoResposta
      else if (alvo === 'napista')
        motivo = (
          {
            marca: 'marca',
            modelo: 'modelo',
            versao: 'versao',
            catalogo_napista: 'catalogo',
          } as const
        )[
          motivoPendenciaNapista({
            veiculo_id: id,
            marca: '',
            modelo: '',
            versao: null,
            fotos: null,
            napista_marca_id: marcaId,
            napista_modelo_id: modeloId,
            napista_version_id: versaoId,
            erro_msg: erroMsg,
            candidatos_modelo: [],
            candidatos_versao: [],
          })
        ]
      else if (!marcaId) motivo = 'marca'
      else if (!modeloId) motivo = 'modelo'
      else if (!versaoId) motivo = 'versao'
      else motivo = 'catalogo'

      return {
        mapeado,
        ids: { marcaId, modeloId, versaoId },
        pendente: {
          motivo,
          erroMsg,
          candidatosModelo: candModelo,
          candidatosVersao: candVersao,
        } as EstadoPendente,
      }
    },
    [],
  )

  const concluir = useCallback(
    (id: string, alvo: PlataformaMapeavel) => {
      toast({
        title:
          modo === 'confirmar'
            ? `${NOME_PLATAFORMA_MAPEAVEL[alvo]} confirmado!`
            : `${NOME_PLATAFORMA_MAPEAVEL[alvo]} mapeado! Reenviando o veículo...`,
      })
      onResolvidoRef.current(id, alvo)
    },
    [modo, toast],
  )

  // Depois de qualquer ação: confere o banco. Mapeado -> conclui (ou, no modo
  // 'confirmar' e sem escolha do usuário, mostra o que foi mapeado pra
  // conferir); senão mostra o que ainda falta.
  const avaliar = useCallback(
    async (
      id: string,
      alvo: PlataformaMapeavel,
      minhaTentativa: number,
      opcoes?: { motivoResposta?: string; vindoDeEscolha?: boolean },
    ) => {
      const lido = await lerEstado(id, alvo, opcoes?.motivoResposta)
      if (minhaTentativa !== tentativa.current) return
      if (!lido) {
        setMensagemErro('Não encontrei o mapeamento deste veículo. Tente de novo.')
        setFase('erro')
        return
      }
      if (lido.mapeado) {
        if (modo === 'confirmar' && !opcoes?.vindoDeEscolha) {
          const nomes = await carregarNomes(alvo, lido.ids)
          if (minhaTentativa !== tentativa.current) return
          setAtual(nomes)
          setFase('confirmar')
        } else {
          concluir(id, alvo)
        }
        return
      }
      setAtual(null)
      setPendente(lido.pendente)
      setFase('escolher')
    },
    [carregarNomes, concluir, lerEstado, modo],
  )

  const mapearDeNovo = useCallback(
    async (id: string, alvo: PlataformaMapeavel): Promise<string | undefined> => {
      if (alvo === 'napista') {
        const res = await remapearVeiculoNapista(id, { sincronizarCatalogo: true })
        if (!res.success) throw new Error(res.error || 'Falha ao consultar o catálogo da NaPista')
        return res.motivo
      }
      const { data, error } = await supabase.functions.invoke('wm-mapear-veiculo', {
        body: { veiculo_id: id, force: true },
      })
      if (error) throw error
      return data?.motivo
    },
    [],
  )

  const preparar = useCallback(async () => {
    if (!veiculoId || !plataforma) return
    const minhaTentativa = ++tentativa.current
    setFase('carregando')
    setPendente(null)
    setAtual(null)
    setTroca(null)
    setMensagemErro(null)
    try {
      // Modo confirmar: se já está mapeado, só mostra (não refaz o mapeamento,
      // que poderia trocar uma escolha que a pessoa já fez).
      if (modo === 'confirmar') {
        const lido = await lerEstado(veiculoId, plataforma)
        if (minhaTentativa !== tentativa.current) return
        if (lido?.mapeado) {
          const nomes = await carregarNomes(plataforma, lido.ids)
          if (minhaTentativa !== tentativa.current) return
          setAtual(nomes)
          setFase('confirmar')
          return
        }
      }
      const motivoResposta = await mapearDeNovo(veiculoId, plataforma)
      await avaliar(veiculoId, plataforma, minhaTentativa, { motivoResposta })
    } catch (err: any) {
      if (minhaTentativa !== tentativa.current) return
      setMensagemErro(err?.message || 'Falha ao consultar o catálogo.')
      setFase('erro')
    }
  }, [avaliar, carregarNomes, lerEstado, mapearDeNovo, modo, plataforma, veiculoId])

  const prepararRef = useRef(preparar)
  prepararRef.current = preparar

  // Abre -> já tenta resolver sozinho. Fecha -> invalida respostas pendentes.
  useEffect(() => {
    if (veiculoId && plataforma) {
      prepararRef.current()
    } else {
      tentativa.current++
    }
  }, [veiculoId, plataforma])

  // Grava a confirmação (modelo + versão juntos) e reavalia no banco.
  const confirmarIds = async (modeloId: string | null, versaoId: string | null) => {
    if (!veiculoId || !plataforma) return
    const minhaTentativa = ++tentativa.current
    setOcupado(true)
    try {
      if (plataforma === 'napista') {
        const res = await confirmarMapeamentoNapista(
          veiculoId,
          modeloId ?? undefined,
          versaoId ?? undefined,
        )
        if (!res.success) throw new Error(res.error || 'Erro ao confirmar')
      } else {
        const { error } = await supabase.functions.invoke('wm-confirmar-mapeamento', {
          body: {
            veiculo_id: veiculoId,
            codigo_modelo_wm: modeloId ?? undefined,
            codigo_versao_wm: versaoId ?? undefined,
          },
        })
        if (error) throw error
      }
      await avaliar(veiculoId, plataforma, minhaTentativa, { vindoDeEscolha: true })
    } catch (err: any) {
      toast({
        title: 'Erro ao confirmar mapeamento',
        description: err?.message,
        variant: 'destructive',
      })
    } finally {
      setOcupado(false)
    }
  }

  // Escolha numa lista de candidatos (modo "resolver" ou depois de "Trocar").
  const escolher = async (etapa: 'modelo' | 'versao', id: string) => {
    if (!veiculoId || !plataforma) return
    if (plataforma === 'webmotors' && etapa === 'modelo') {
      // Webmotors marca "mapeado" já ao confirmar só o modelo; por isso a
      // versão é escolhida antes, e as duas vão juntas.
      await abrirVersoesWm(id)
      return
    }
    if (plataforma === 'webmotors') {
      await confirmarIds(troca?.modeloId ?? atual?.modeloId ?? null, id)
      return
    }
    // NaPista: confirmar o modelo não resolve a versão (o catálogo depende do
    // modelo escolhido) — remapeia pra buscar os candidatos de versão.
    const minhaTentativa = ++tentativa.current
    setOcupado(true)
    try {
      if (etapa === 'modelo') {
        const res = await confirmarMapeamentoNapista(veiculoId, id, undefined)
        if (!res.success) throw new Error(res.error || 'Erro ao confirmar')
        await remapearVeiculoNapista(veiculoId)
        await avaliar(veiculoId, plataforma, minhaTentativa, { vindoDeEscolha: true })
      } else {
        const res = await confirmarMapeamentoNapista(veiculoId, undefined, id)
        if (!res.success) throw new Error(res.error || 'Erro ao confirmar')
        await avaliar(veiculoId, plataforma, minhaTentativa, { vindoDeEscolha: true })
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao confirmar mapeamento',
        description: err?.message,
        variant: 'destructive',
      })
    } finally {
      setOcupado(false)
    }
  }

  const abrirVersoesWm = async (modeloId: string) => {
    setTroca({ etapa: 'versao', modeloId, itens: [], busca: '', carregando: true })
    setFase('trocar')
    const { data } = await supabase
      .from('wm_versoes')
      .select('codigo_wm, nome_wm, anos_modelo')
      .eq('codigo_modelo_wm', modeloId)
      .order('nome_wm')
      .limit(500)
    const itens = (data || []).map((v) => ({
      id: v.codigo_wm,
      nome: v.nome_wm,
      score: 0,
      anos: v.anos_modelo,
    }))
    if (itens.length === 0) {
      // Sem versões no catálogo local: confirma só o modelo (comportamento antigo).
      await confirmarIds(modeloId, null)
      return
    }
    setTroca({ etapa: 'versao', modeloId, itens, busca: '', carregando: false })
  }

  // "Trocar": lista todos os modelos da marca no catálogo da plataforma, com
  // busca — a pessoa escolhe o veículo certo em vez de depender do automático.
  const iniciarTroca = async () => {
    if (!veiculoId || !plataforma || !atual?.marcaId) {
      toast({
        title: 'Não foi possível listar o catálogo',
        description: 'A marca deste veículo ainda não foi reconhecida pela plataforma.',
        variant: 'destructive',
      })
      return
    }
    setTroca({ etapa: 'modelo', modeloId: null, itens: [], busca: '', carregando: true })
    setFase('trocar')
    const carregar = async (): Promise<Candidato[]> => {
      if (plataforma === 'napista') {
        const { data } = await supabase
          .from('napista_modelos')
          .select('id, nome')
          .eq('marca_id', atual.marcaId!)
          .order('nome')
          .limit(500)
        return (data || []).map((m) => ({ id: m.id, nome: m.nome, score: 0 }))
      }
      const { data } = await supabase
        .from('wm_modelos')
        .select('codigo_wm, nome_wm')
        .eq('codigo_marca_wm', atual.marcaId!)
        .order('nome_wm')
        .limit(500)
      return (data || []).map((m) => ({ id: m.codigo_wm, nome: m.nome_wm, score: 0 }))
    }
    let itens = await carregar()
    if (itens.length === 0 && plataforma === 'napista') {
      // Catálogo da marca vazio no cache: o mapeamento baixa de verdade.
      await remapearVeiculoNapista(veiculoId, { sincronizarCatalogo: true })
      itens = await carregar()
    }
    setTroca({ etapa: 'modelo', modeloId: null, itens, busca: '', carregando: false })
  }

  const listaBuscavel = (titulo: string, itens: Candidato[], etapa: 'modelo' | 'versao') => {
    const filtro = (troca?.busca || '').trim().toLowerCase()
    const visiveis = filtro ? itens.filter((c) => c.nome.toLowerCase().includes(filtro)) : itens
    return (
      <div className="space-y-2">
        <Label>{titulo}</Label>
        <Input
          placeholder="Buscar pelo nome..."
          value={troca?.busca || ''}
          onChange={(e) => setTroca((t) => (t ? { ...t, busca: e.target.value } : t))}
        />
        <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
          {visiveis.length === 0 && (
            <p className="text-xs text-gray-500 py-2">Nada encontrado com esse nome.</p>
          )}
          {visiveis.map((c) => (
            <Button
              key={c.id}
              variant="outline"
              className="w-full justify-start text-left h-auto py-1.5"
              disabled={ocupado}
              onClick={() => escolher(etapa, c.id)}
            >
              {c.nome}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  const lista = (titulo: string, itens: Candidato[], etapa: 'modelo' | 'versao') => (
    <div className="space-y-2">
      <Label>{titulo}</Label>
      {itens.map((c) => (
        <Button
          key={c.id}
          variant="outline"
          className="w-full justify-between"
          disabled={ocupado}
          onClick={() => escolher(etapa, c.id)}
        >
          <span className="text-left">
            {c.nome}
            {c.anos && c.anos.length > 0 && (
              <span className="block text-xs font-normal text-gray-500">
                Anos aceitos: {c.anos.join(', ')}
              </span>
            )}
          </span>
          <span className="text-xs text-gray-400">{Math.round(c.score * 100)}%</span>
        </Button>
      ))}
    </div>
  )

  const aviso = (texto: string) => (
    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
      {texto}
    </p>
  )

  const conteudoEscolha = () => {
    if (!pendente) return null
    const { motivo, candidatosModelo, candidatosVersao } = pendente
    if (motivo === 'modelo' && candidatosModelo.length > 0)
      return lista('Escolha o modelo correto:', candidatosModelo, 'modelo')
    if (motivo === 'versao' && candidatosVersao.length > 0)
      return lista('Escolha a versão correta:', candidatosVersao, 'versao')
    if (motivo === 'modelo')
      return aviso(
        `Atualizei o catálogo da ${nomePlataforma} e mesmo assim não há nenhum modelo parecido. ` +
          `Provavelmente a ${nomePlataforma} ainda não cadastrou esse modelo — o veículo fica de fora ` +
          `dessa plataforma até lá. Se o nome do modelo estiver escrito diferente no cadastro, ` +
          `corrija o veículo e clique em "Tentar de novo".`,
      )
    if (motivo === 'versao')
      return aviso(
        `O catálogo da ${nomePlataforma} não tem nenhuma versão cadastrada para esse modelo. ` +
          `Não há o que escolher agora — o veículo fica de fora dessa plataforma até eles atualizarem.`,
      )
    if (motivo === 'marca')
      return aviso(
        `A marca do veículo não bate com nenhuma marca da ${nomePlataforma}. Ajuste a marca no ` +
          `cadastro do veículo e clique em "Tentar de novo".`,
      )
    return aviso(
      `Cor, câmbio ou combustível do veículo não têm equivalente no catálogo da ${nomePlataforma}. ` +
        `Ajuste esses campos no cadastro do veículo (ou peça pra cadastrar o termo equivalente) e ` +
        `clique em "Tentar de novo".`,
    )
  }

  const titulo =
    modo === 'confirmar'
      ? `Confirmar veículo na ${nomePlataforma}`
      : `Resolver mapeamento — ${nomePlataforma}`

  // A plataforma realmente não tem este veículo (marca, modelo ou versão sem
  // nenhuma opção no catálogo dela) — não há o que escolher.
  const semOpcao =
    !!pendente &&
    (pendente.motivo === 'marca' ||
      (pendente.motivo === 'modelo' && pendente.candidatosModelo.length === 0) ||
      (pendente.motivo === 'versao' && pendente.candidatosVersao.length === 0))

  return (
    <Dialog
      open={!!veiculoId && !!plataforma}
      onOpenChange={(aberto) => !aberto && !obrigatorio && onClose()}
    >
      <DialogContent
        className="max-w-lg"
        onInteractOutside={(e) => obrigatorio && e.preventDefault()}
        onEscapeKeyDown={(e) => obrigatorio && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>
            {nomeVeiculo ? `${nomeVeiculo}. ` : ''}A {nomePlataforma} precisa saber exatamente qual
            veículo do catálogo dela é este antes de publicar.
          </DialogDescription>
        </DialogHeader>

        {fase === 'carregando' && (
          <div className="flex items-center gap-2 py-6 text-sm text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            Buscando o catálogo da {nomePlataforma} e tentando mapear sozinho...
          </div>
        )}

        {fase === 'erro' && (
          <p className="text-sm text-red-700 flex items-start gap-2 py-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            {mensagemErro}
          </p>
        )}

        {fase === 'escolher' && pendente && (
          <div className="space-y-3">
            {pendente.erroMsg && <p className="text-sm text-gray-600">{pendente.erroMsg}</p>}
            {conteudoEscolha()}
          </div>
        )}

        {fase === 'confirmar' && atual && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              O sistema mapeou este veículo, na {nomePlataforma}, como:
            </p>
            <div className="border rounded-lg p-3 bg-green-50/60 border-green-200 text-sm space-y-0.5">
              <p className="flex items-center gap-1.5 font-medium text-gray-800">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                {[atual.marcaNome, atual.modeloNome].filter(Boolean).join(' › ') || 'Sem nome'}
              </p>
              <p className="text-gray-700 pl-5">{atual.versaoNome || 'Versão não definida'}</p>
            </div>
            <p className="text-xs text-gray-500">
              Confira se é o mesmo veículo do cadastro. Se não for, clique em "Trocar" e escolha o
              certo — assim o anúncio sai com o veículo correto.
            </p>
          </div>
        )}

        {fase === 'trocar' && troca && (
          <div className="space-y-3">
            {troca.carregando ? (
              <div className="flex items-center gap-2 py-6 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando o catálogo da {nomePlataforma}...
              </div>
            ) : troca.itens.length === 0 ? (
              aviso(`O catálogo da ${nomePlataforma} não tem opções para essa etapa.`)
            ) : (
              listaBuscavel(
                troca.etapa === 'modelo'
                  ? 'Escolha o modelo correto:'
                  : 'Escolha a versão correta:',
                troca.itens,
                troca.etapa,
              )
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {fase === 'trocar' && (
            <Button
              variant="ghost"
              disabled={ocupado}
              onClick={() => setFase(atual ? 'confirmar' : 'escolher')}
            >
              Voltar
            </Button>
          )}
          {fase === 'confirmar' && atual && (
            <>
              <Button variant="outline" disabled={ocupado} onClick={iniciarTroca}>
                Trocar
              </Button>
              <Button
                disabled={ocupado}
                onClick={() => confirmarIds(atual.modeloId, atual.versaoId)}
              >
                {ocupado ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                Está certo
              </Button>
            </>
          )}
          {(fase === 'erro' || fase === 'escolher') && (
            <Button variant="outline" disabled={ocupado} onClick={preparar}>
              <RefreshCw className="w-3 h-3 mr-1" /> Tentar de novo
            </Button>
          )}
          {obrigatorio &&
            onVoltarCorrigir &&
            (fase === 'erro' || fase === 'escolher' || fase === 'trocar') && (
              <Button variant="ghost" disabled={ocupado} onClick={onVoltarCorrigir}>
                Voltar e corrigir o cadastro
              </Button>
            )}
          {obrigatorio && onSeguirSemPlataforma && fase === 'escolher' && semOpcao && (
            <Button variant="outline" onClick={onSeguirSemPlataforma}>
              Seguir sem a {nomePlataforma}
            </Button>
          )}
          {!obrigatorio && fase !== 'carregando' && (
            <Button variant="ghost" onClick={onClose}>
              {modo === 'confirmar' ? 'Pular (confirmo depois)' : 'Fechar (resolvo depois)'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
