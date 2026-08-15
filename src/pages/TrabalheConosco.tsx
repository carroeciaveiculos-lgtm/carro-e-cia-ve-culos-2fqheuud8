import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SEO } from '@/components/SEO'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Briefcase, Loader2, Upload, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { listVagasAtivas } from '@/services/vagas'
import { enviarCandidatura } from '@/services/candidaturas'

const INFO_MAX_LENGTH = 20000

export default function TrabalheConosco() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [vagasAtivas, setVagasAtivas] = useState<{ id: string; titulo: string }[]>([])

  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    informacoesAdicionais: '',
    vagaId: '',
  })
  const [curriculo, setCurriculo] = useState<File | null>(null)
  const [curriculoErro, setCurriculoErro] = useState('')

  useEffect(() => {
    listVagasAtivas().then(({ data }) => setVagasAtivas(data || []))
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setCurriculo(null)
      return
    }
    if (file.type !== 'application/pdf') {
      setCurriculoErro('O currículo precisa estar em formato PDF.')
      setCurriculo(null)
      e.target.value = ''
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setCurriculoErro('O arquivo excede o limite de 8MB.')
      setCurriculo(null)
      e.target.value = ''
      return
    }
    setCurriculoErro('')
    setCurriculo(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!curriculo) {
      setCurriculoErro('Anexe seu currículo em PDF para enviar a candidatura.')
      return
    }
    setLoading(true)
    try {
      const { error } = await enviarCandidatura({
        nome: formData.nome,
        telefone: formData.telefone,
        email: formData.email,
        informacoesAdicionais: formData.informacoesAdicionais,
        curriculo,
        vagaId: formData.vagaId || undefined,
      })
      if (error) throw error

      navigate('/obrigado', { state: { nome: formData.nome, tipo: 'candidatura' } })
    } catch (err: any) {
      toast({
        title: 'Erro ao enviar',
        description: err?.message || 'Tente novamente em instantes.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex-1 bg-background pt-24 pb-16">
      <SEO
        title="Trabalhe Conosco | Carro e Cia Veículos"
        description="Faça parte do time Carro e Cia Veículos em Uberaba - MG. Envie seu currículo e conheça nossas vagas abertas."
        canonical="https://carroeciamotors.com.br/trabalhe-conosco"
      />

      <section className="container max-w-3xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-6xl font-display font-extrabold mb-4">
            Trabalhe Conosco
          </h1>
          <p className="text-xl text-muted-foreground">
            Há mais de 20 anos construindo uma equipe apaixonada por atender bem. Se você quer
            fazer parte do time Carro e Cia, deixe seus dados e seu currículo abaixo.
          </p>
        </div>

        {vagasAtivas.length > 0 && (
          <Card className="p-6 mb-10 border-primary/30 bg-primary/5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 shrink-0 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-lg mb-1">Temos vaga!</h2>
                <p className="text-muted-foreground mb-2">
                  No momento estamos com as seguintes oportunidades abertas:
                </p>
                <ul className="list-disc list-inside space-y-1 font-medium">
                  {vagasAtivas.map((v) => (
                    <li key={v.id}>{v.titulo}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nome">Nome completo *</Label>
                  <Input
                    id="nome"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                    placeholder="Seu nome completo"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telefone">Telefone de contato *</Label>
                  <Input
                    id="telefone"
                    required
                    value={formData.telefone}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, telefone: e.target.value }))
                    }
                    placeholder="(34) 99999-9999"
                  />
                </div>
              </div>

              {vagasAtivas.length > 0 && (
                <div className="space-y-1.5">
                  <Label htmlFor="vaga">Vaga de interesse</Label>
                  <Select
                    value={formData.vagaId}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, vagaId: value }))}
                  >
                    <SelectTrigger id="vaga">
                      <SelectValue placeholder="Candidatura espontânea (sem vaga específica)" />
                    </SelectTrigger>
                    <SelectContent>
                      {vagasAtivas.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.titulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="seuemail@exemplo.com"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="informacoes">Informações adicionais</Label>
                  <span className="text-xs text-muted-foreground">
                    {formData.informacoesAdicionais.length}/{INFO_MAX_LENGTH}
                  </span>
                </div>
                <Textarea
                  id="informacoes"
                  rows={6}
                  maxLength={INFO_MAX_LENGTH}
                  value={formData.informacoesAdicionais}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, informacoesAdicionais: e.target.value }))
                  }
                  placeholder="Conte um pouco sobre você, sua experiência e qual área te interessa"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="curriculo">Currículo (PDF) *</Label>
                <label
                  htmlFor="curriculo"
                  className="flex items-center gap-3 border-2 border-dashed border-input rounded-lg p-4 cursor-pointer hover:border-primary transition-colors"
                >
                  {curriculo ? (
                    <FileText className="w-6 h-6 text-primary shrink-0" />
                  ) : (
                    <Upload className="w-6 h-6 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-sm text-muted-foreground truncate">
                    {curriculo ? curriculo.name : 'Clique para anexar seu currículo em PDF'}
                  </span>
                </label>
                <input
                  id="curriculo"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {curriculoErro && <p className="text-sm text-destructive">{curriculoErro}</p>}
              </div>

              <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={loading}>
                {loading && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
                Enviar candidatura
              </Button>
            </form>
          </Card>
      </section>
    </main>
  )
}
