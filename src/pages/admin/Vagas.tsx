import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  Briefcase,
  Plus,
  Wand2,
  Image as ImageIcon,
  Share2,
  Loader2,
  Pencil,
  Trash2,
  FileText,
  Link as LinkIcon,
} from 'lucide-react'
import {
  Vaga,
  listVagas,
  createVaga,
  updateVaga,
  deleteVaga,
  gerarVagaComIA,
  gerarImagemVaga,
  gerarResumoVaga,
  postarVagaNasRedes,
  LIMITE_CARACTERES_RESUMO_REDES,
} from '@/services/vagas'
import { Candidatura, listCandidaturas, updateCandidaturaStatus } from '@/services/candidaturas'
import { Badge } from '@/components/ui/badge'
import { RichTextEditor } from '@/components/RichTextEditor'
import { stripHtml } from '@/lib/utils'
import { parseMarkdown } from '@/lib/markdown'

export default function VagasAdmin() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('vagas')

  const [vagas, setVagas] = useState<Vaga[]>([])
  const [candidaturas, setCandidaturas] = useState<Candidatura[]>([])
  const [loadingLista, setLoadingLista] = useState(true)
  const [filtroVagaId, setFiltroVagaId] = useState('todas')

  const tituloDaVaga = (vagaId: string | null) => {
    if (!vagaId) return 'Candidatura espontânea'
    return vagas.find((v) => v.id === vagaId)?.titulo || 'Vaga removida'
  }

  const candidaturasFiltradas = candidaturas.filter((c) => {
    if (filtroVagaId === 'todas') return true
    if (filtroVagaId === 'espontaneas') return !c.vaga_id
    return c.vaga_id === filtroVagaId
  })

  const [dialogAberto, setDialogAberto] = useState(false)
  const [vagaEmEdicao, setVagaEmEdicao] = useState<Vaga | null>(null)
  const [cargo, setCargo] = useState('')
  const [palavrasChave, setPalavrasChave] = useState('')
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [imagemUrl, setImagemUrl] = useState('')
  const [opcoesImagem, setOpcoesImagem] = useState<string[]>([])
  const [ajusteImagem, setAjusteImagem] = useState('')
  const [ativa, setAtiva] = useState(true)
  const [resumoRedes, setResumoRedes] = useState('')

  const [gerandoTexto, setGerandoTexto] = useState(false)
  const [gerandoImagem, setGerandoImagem] = useState(false)
  const [gerandoResumo, setGerandoResumo] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const carregarDados = async () => {
    setLoadingLista(true)
    const [{ data: vagasData }, { data: candidaturasData }] = await Promise.all([
      listVagas(),
      listCandidaturas(),
    ])
    setVagas(vagasData || [])
    setCandidaturas(candidaturasData || [])
    setLoadingLista(false)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const abrirNovaVaga = () => {
    setVagaEmEdicao(null)
    setCargo('')
    setPalavrasChave('')
    setTitulo('')
    setDescricao('')
    setImagemUrl('')
    setOpcoesImagem([])
    setAjusteImagem('')
    setAtiva(true)
    setResumoRedes('')
    setDialogAberto(true)
  }

  const abrirEdicaoVaga = (vaga: Vaga) => {
    setVagaEmEdicao(vaga)
    setCargo(vaga.titulo)
    setPalavrasChave('')
    setTitulo(vaga.titulo)
    setDescricao(vaga.descricao || '')
    setImagemUrl(vaga.imagem_url || '')
    setOpcoesImagem([])
    setAjusteImagem('')
    setAtiva(vaga.ativa)
    setResumoRedes(vaga.resumo_redes || '')
    setDialogAberto(true)
  }

  const handleGerarComIA = async () => {
    if (!cargo) {
      toast({ title: 'Informe o cargo', description: 'Digite o cargo da vaga antes de gerar.' })
      return
    }
    setGerandoTexto(true)
    try {
      const { data, error } = await gerarVagaComIA(cargo, palavrasChave)
      if (error) throw error
      if (data) {
        setTitulo(data.titulo)
        setDescricao(data.descricao)
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao gerar com IA',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setGerandoTexto(false)
    }
  }

  const handleGerarImagem = async () => {
    if (!titulo) {
      toast({ title: 'Defina o título da vaga', description: 'Preencha o título antes de gerar a imagem.' })
      return
    }
    setGerandoImagem(true)
    // Achado 23/08/2026: o gpt-image-2 gerando 2 imagens leva de 45 a 90
    // segundos (ele "pensa antes de desenhar") — sem esse aviso, a geração
    // sempre funcionava no servidor mas a pessoa fechava a tela ou saía da
    // página antes de aparecer, achando que tinha travado.
    toast({
      title: 'Gerando 2 opções de imagem...',
      description: 'Isso pode levar até 1 minuto. Não feche esta janela.',
    })
    try {
      const { data, error } = await gerarImagemVaga(titulo)
      if (error) throw error
      setOpcoesImagem(data || [])
      setAjusteImagem('')
    } catch (err: any) {
      toast({
        title: 'Erro ao gerar imagem',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setGerandoImagem(false)
    }
  }

  const handleRegenerarComAjuste = async () => {
    if (!ajusteImagem) {
      toast({ title: 'Descreva o ajuste', description: 'Diga o que quer mudar na imagem.' })
      return
    }
    setGerandoImagem(true)
    toast({
      title: 'Ajustando e gerando 2 opções...',
      description: 'Isso pode levar até 1 minuto. Não feche esta janela.',
    })
    try {
      const { data, error } = await gerarImagemVaga(titulo, {
        ajuste: ajusteImagem,
        imagemAtualUrl: imagemUrl || undefined,
      })
      if (error) throw error
      setOpcoesImagem(data || [])
      setAjusteImagem('')
    } catch (err: any) {
      toast({
        title: 'Erro ao ajustar imagem',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setGerandoImagem(false)
    }
  }

  const handleEscolherOpcaoImagem = (url: string) => {
    setImagemUrl(url)
    setOpcoesImagem([])
  }

  // Achado 23/08/2026, pedido da Adriana: descrições completas (a de SDR
  // passa de 3000 caracteres) quebram a publicação no Instagram (limite de
  // 2200). Gera o resumo automaticamente ao salvar, sem precisar de botão
  // separado — só não gera de novo se ela já escreveu/ajustou um resumo à
  // mão (nesse caso, respeita o que ela escreveu).
  const gerarResumoSeNecessario = async (descricaoAtual: string) => {
    const textoPlano = stripHtml(parseMarkdown(descricaoAtual))
    if (!textoPlano) return ''
    if (resumoRedes.trim()) return resumoRedes
    setGerandoResumo(true)
    try {
      const { data, error } = await gerarResumoVaga(titulo, descricaoAtual)
      if (error) throw error
      setResumoRedes(data || '')
      return data || ''
    } catch (err: any) {
      toast({
        title: 'Não consegui gerar o resumo pra redes sociais',
        description: `${err?.message || 'Tente novamente'} — a vaga foi salva mesmo assim, você pode gerar o resumo depois.`,
      })
      return ''
    } finally {
      setGerandoResumo(false)
    }
  }

  const handleGerarResumo = async () => {
    const textoPlano = stripHtml(parseMarkdown(descricao))
    if (!textoPlano) {
      toast({ title: 'Escreva a descrição primeiro', description: 'O resumo é gerado a partir da descrição da vaga.' })
      return
    }
    setGerandoResumo(true)
    try {
      const { data, error } = await gerarResumoVaga(titulo, descricao)
      if (error) throw error
      setResumoRedes(data || '')
    } catch (err: any) {
      toast({
        title: 'Erro ao gerar resumo',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setGerandoResumo(false)
    }
  }

  const handleSalvar = async () => {
    if (!titulo) {
      toast({ title: 'Título obrigatório', variant: 'destructive' })
      return
    }
    setSalvando(true)
    try {
      const resumoFinal = await gerarResumoSeNecessario(descricao)
      const payload = {
        titulo,
        descricao,
        imagem_url: imagemUrl || null,
        resumo_redes: resumoFinal || null,
        ativa,
      }
      const { error } = vagaEmEdicao
        ? await updateVaga(vagaEmEdicao.id, payload)
        : await createVaga(payload)
      if (error) throw error
      toast({ title: vagaEmEdicao ? 'Vaga atualizada!' : 'Vaga criada!' })
      setDialogAberto(false)
      carregarDados()
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const handleExcluir = async (vaga: Vaga) => {
    if (!confirm(`Excluir a vaga "${vaga.titulo}"?`)) return
    const { error } = await deleteVaga(vaga.id)
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Vaga excluída' })
    carregarDados()
  }

  const handleCopiarLink = (vaga: Vaga) => {
    const link = `https://carroeciamotors.com.br/vagas/${vaga.slug || vaga.id}`
    navigator.clipboard.writeText(link)
    toast({ title: 'Link copiado!', description: link })
  }

  const handlePostarRedes = async (vaga: Vaga) => {
    if (!vaga.imagem_url) {
      toast({
        title: 'Gere uma imagem primeiro',
        description: 'Edite a vaga e gere a imagem padrão antes de postar.',
      })
      return
    }
    const { error } = await postarVagaNasRedes(vaga)
    if (error) {
      toast({ title: 'Erro ao agendar postagem', description: error.message, variant: 'destructive' })
      return
    }
    toast({
      title: 'Postagem agendada!',
      description:
        'Entrou na fila do Facebook e do Instagram — publica em até 15 minutos, não precisa fazer mais nada.',
    })
  }

  const handleStatusCandidatura = async (candidatura: Candidatura, status: string) => {
    const { error } = await updateCandidaturaStatus(candidatura.id, status)
    if (error) {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' })
      return
    }
    carregarDados()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="w-6 h-6" /> Vagas
          </h1>
          <p className="text-muted-foreground">
            Gerencie as vagas abertas e acompanhe as candidaturas recebidas pelo site.
          </p>
        </div>
        {activeTab === 'vagas' && (
          <Button onClick={abrirNovaVaga}>
            <Plus className="w-4 h-4 mr-2" /> Nova Vaga
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="vagas">Vagas Abertas</TabsTrigger>
          <TabsTrigger value="candidaturas">
            Candidaturas Recebidas
            {candidaturas.filter((c) => c.status === 'novo').length > 0 && (
              <Badge className="ml-2" variant="secondary">
                {candidaturas.filter((c) => c.status === 'novo').length} novas
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vagas" className="space-y-3">
          {loadingLista ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : vagas.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma vaga cadastrada ainda.</p>
          ) : (
            vagas.map((vaga) => (
              <Card key={vaga.id}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    {vaga.imagem_url && (
                      <img
                        src={vaga.imagem_url}
                        alt={vaga.titulo}
                        className="w-14 h-14 rounded-lg object-cover shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold truncate">{vaga.titulo}</h3>
                        <Badge variant={vaga.ativa ? 'default' : 'secondary'}>
                          {vaga.ativa ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate max-w-md">
                        {stripHtml(parseMarkdown(vaga.descricao || ''))}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => handleCopiarLink(vaga)}>
                      <LinkIcon className="w-4 h-4 mr-1" /> Copiar link
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handlePostarRedes(vaga)}>
                      <Share2 className="w-4 h-4 mr-1" /> Postar
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => abrirEdicaoVaga(vaga)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleExcluir(vaga)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="candidaturas" className="space-y-3">
          <div className="flex items-center gap-3">
            <Label htmlFor="filtro-vaga" className="shrink-0">
              Filtrar por vaga
            </Label>
            <Select value={filtroVagaId} onValueChange={setFiltroVagaId}>
              <SelectTrigger id="filtro-vaga" className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as candidaturas</SelectItem>
                <SelectItem value="espontaneas">Candidaturas espontâneas</SelectItem>
                {vagas.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loadingLista ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : candidaturasFiltradas.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma candidatura encontrada com esse filtro.</p>
          ) : (
            candidaturasFiltradas.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">{c.nome}</h3>
                      <Badge variant={c.status === 'novo' ? 'default' : 'secondary'}>
                        {c.status}
                      </Badge>
                      <Badge variant="outline">{tituloDaVaga(c.vaga_id)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {c.telefone} · {c.email}
                    </p>
                    {c.informacoes_adicionais && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2 max-w-xl">
                        {c.informacoes_adicionais}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {c.created_at && new Date(c.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" asChild>
                      <a href={c.curriculo_url} target="_blank" rel="noopener noreferrer">
                        <FileText className="w-4 h-4 mr-1" /> Currículo
                      </a>
                    </Button>
                    {c.status === 'novo' && (
                      <Button size="sm" onClick={() => handleStatusCandidatura(c, 'lido')}>
                        Marcar como lida
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={dialogAberto}
        onOpenChange={(open) => {
          // Não deixa fechar enquanto gera imagem (achado 23/08/2026) —
          // fechar no meio da geração fazia o resultado nunca aparecer.
          if (!open && gerandoImagem) return
          setDialogAberto(open)
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{vagaEmEdicao ? 'Editar Vaga' : 'Nova Vaga'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!vagaEmEdicao && (
              <Card className="p-4 bg-muted/40">
                <div className="grid md:grid-cols-2 gap-3 mb-3">
                  <div className="space-y-1.5">
                    <Label>Cargo</Label>
                    <Input
                      value={cargo}
                      onChange={(e) => setCargo(e.target.value)}
                      placeholder="Ex: Vendedor(a) de veículos"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Palavras-chave (opcional)</Label>
                    <Input
                      value={palavrasChave}
                      onChange={(e) => setPalavrasChave(e.target.value)}
                      placeholder="Ex: experiência com vendas, CNH B"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleGerarComIA}
                  disabled={gerandoTexto}
                >
                  {gerandoTexto ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4 mr-2" />
                  )}
                  Gerar com IA
                </Button>
              </Card>
            )}

            <div className="space-y-1.5">
              <Label>Título da vaga *</Label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <RichTextEditor value={descricao} onChange={setDescricao} placeholder="Descreva a vaga..." />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Resumo para redes sociais</Label>
                <span className="text-xs text-muted-foreground">
                  {resumoRedes.length}/{LIMITE_CARACTERES_RESUMO_REDES} caracteres
                </span>
              </div>
              <Textarea
                rows={4}
                value={resumoRedes}
                onChange={(e) => setResumoRedes(e.target.value)}
                placeholder="Gerado automaticamente a partir da descrição ao salvar — pode editar à vontade"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGerarResumo}
                disabled={gerandoResumo || !stripHtml(parseMarkdown(descricao))}
              >
                {gerandoResumo ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4 mr-2" />
                )}
                {resumoRedes ? 'Atualizar resumo' : 'Gerar resumo agora'}
              </Button>
              <p className="text-xs text-muted-foreground">
                É esse texto (curto, dentro do limite do Instagram) que vai no post das redes
                sociais — a descrição completa acima fica só na página da vaga.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Imagem padrão para redes sociais</Label>

              {gerandoImagem ? (
                <div className="w-full max-w-sm h-56 rounded-lg border border-dashed flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground mx-auto text-center px-4">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Gerando 2 opções de imagem...</span>
                  <span className="text-xs">Pode levar até 1 minuto. Não feche esta janela.</span>
                </div>
              ) : opcoesImagem.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-sm text-muted-foreground text-center">
                    Escolha uma das opções abaixo:
                  </p>
                  <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                    {opcoesImagem.map((url, i) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => handleEscolherOpcaoImagem(url)}
                        className="rounded-lg border-2 border-transparent hover:border-primary transition-colors overflow-hidden"
                      >
                        <img src={url} alt={`Opção ${i + 1}`} className="w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : imagemUrl ? (
                <img
                  src={imagemUrl}
                  alt="Imagem da vaga"
                  className="w-full max-w-sm rounded-lg border object-cover mx-auto"
                />
              ) : (
                <div className="w-full max-w-sm h-56 rounded-lg border border-dashed flex items-center justify-center text-sm text-muted-foreground mx-auto">
                  Nenhuma imagem gerada ainda
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGerarImagem}
                disabled={gerandoImagem}
              >
                {gerandoImagem ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ImageIcon className="w-4 h-4 mr-2" />
                )}
                {imagemUrl ? 'Gerar do zero de novo' : 'Gerar imagem'}
              </Button>

              {(imagemUrl || opcoesImagem.length > 0) && !gerandoImagem && (
                <div className="flex gap-2 pt-1">
                  <Input
                    placeholder='Peça um ajuste (ex: "fundo mais claro")'
                    value={ajusteImagem}
                    onChange={(e) => setAjusteImagem(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleRegenerarComAjuste}
                    disabled={gerandoImagem || !ajusteImagem}
                  >
                    {gerandoImagem ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={ativa} onCheckedChange={setAtiva} id="ativa" />
              <Label htmlFor="ativa">
                Vaga ativa (aparece no card "Temos vaga" do site)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAberto(false)} disabled={gerandoImagem}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} disabled={salvando}>
              {salvando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
