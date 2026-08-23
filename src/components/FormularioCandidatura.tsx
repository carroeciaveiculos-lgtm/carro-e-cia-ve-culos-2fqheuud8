import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { Loader2, Upload, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { enviarCandidatura } from '@/services/candidaturas'

const INFO_MAX_LENGTH = 20000

interface VagaOpcao {
  id: string
  titulo: string
}

interface FormularioCandidaturaProps {
  // Quando informado, a candidatura já entra vinculada a essa vaga e o
  // seletor de "vaga de interesse" some — usado na página dedicada de uma
  // vaga específica. Sem isso, mostra o seletor (candidatura espontânea ou
  // escolhida entre as vagas ativas) — usado na página genérica.
  vagaFixa?: VagaOpcao
  vagasAtivas?: VagaOpcao[]
}

export function FormularioCandidatura({ vagaFixa, vagasAtivas = [] }: FormularioCandidaturaProps) {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    informacoesAdicionais: '',
    vagaId: '',
  })
  const [curriculo, setCurriculo] = useState<File | null>(null)
  const [curriculoErro, setCurriculoErro] = useState('')

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
        vagaId: vagaFixa?.id || formData.vagaId || undefined,
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
              onChange={(e) => setFormData((prev) => ({ ...prev, telefone: e.target.value }))}
              placeholder="(34) 99999-9999"
            />
          </div>
        </div>

        {!vagaFixa && vagasAtivas.length > 0 && (
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
  )
}
