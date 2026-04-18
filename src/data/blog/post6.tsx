import { BlogPost } from './types'
import { getWhatsAppLink } from '@/lib/whatsapp'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const post6: BlogPost = {
  slug: 'como-anunciar-meu-carro-particular-ou-consignado',
  title: 'Como Anunciar Meu Carro: Particular ou Consignado — Qual Realmente Vale Mais a Pena?',
  category: 'Venda de Veículos',
  tags: ['anunciar carro', 'consignação', 'venda particular', 'dicas'],
  metaDescription:
    'Anunciar o carro sozinho ou consignar com uma loja especializada? Veja a comparação honesta e descubra qual opção vale mais para o seu perfil e situação.',
  readTime: '6 minutos',
  author: 'Equipe Carro e Cia',
  content: (
    <>
      <p>
        <strong>Introdução disruptiva:</strong>
      </p>
      <p>
        Todo mundo acha que sabe como anunciar um carro. Tira umas fotos com o celular, coloca no
        OLX, escreve "particular, bem conservado, troco" e espera. Às vezes funciona. Frequentemente
        não funciona — ou demora meses mais do que deveria. E quando vende, muitas vezes é por menos
        do que o carro valia. Existe uma forma mais inteligente de anunciar — e esse artigo vai te
        mostrar as duas opções com honestidade total.
      </p>

      <h2>O que Significa Anunciar o Carro Você Mesmo?</h2>
      <p>Vender de forma particular significa que você é responsável por todo o processo:</p>
      <ul>
        <li>Pesquisar e definir o preço</li>
        <li>Fotografar o veículo</li>
        <li>Criar e gerenciar os anúncios nos canais digitais</li>
        <li>Responder todos os contatos (mensagens, ligações, WhatsApp)</li>
        <li>Marcar visitas e acompanhar o comprador</li>
        <li>Negociar e fechar o preço</li>
        <li>Verificar a idoneidade do comprador</li>
        <li>Organizar e conferir toda a documentação</li>
        <li>Fazer o processo de transferência</li>
      </ul>
      <p>Parece muito? É porque é muito. E qualquer erro em qualquer etapa pode custar caro.</p>

      <h2>Como Anunciar Meu Carro na Internet — O Que Realmente Funciona</h2>
      <p>
        Se você decidir anunciar por conta própria, aqui estão os pontos que fazem diferença real:
      </p>

      <h3>Plataformas que trazem resultado em Uberaba</h3>
      <ul>
        <li>OLX — ainda é a maior plataforma de anúncios do Brasil</li>
        <li>Webmotors — mais focada em veículos, compradores mais qualificados</li>
        <li>Instagram local — grupos e perfis regionais têm bom alcance</li>
        <li>Facebook Marketplace e grupos de "Compra e Venda Uberaba"</li>
      </ul>

      <h3>O que o seu anúncio PRECISA ter</h3>
      <ul>
        <li>Fotos em boa iluminação (mínimo 10 fotos, todos os ângulos)</li>
        <li>Descrição completa: versão exata, quilometragem, revisões, opcionais</li>
        <li>Preço justo com margem de negociação</li>
        <li>Contato direto (WhatsApp com atendimento rápido)</li>
      </ul>

      <h3>O que DESTRÓI um anúncio</h3>
      <ul>
        <li>Fotos escuras ou desfocadas</li>
        <li>"Consulte" no lugar do preço — afasta compradores diretos</li>
        <li>Descrição vaga ou incompleta</li>
        <li>Demora para responder mensagens</li>
      </ul>

      <h2>Riscos de Vender Particular Que Ninguém Fala</h2>
      <p>
        Além do trabalho, vender particular tem riscos reais que muitos proprietários descobrem da
        pior forma:
      </p>
      <ul>
        <li>
          <strong>Risco 1 — Golpes financeiros:</strong> cheque sem fundos, PIX com comprovante
          falso, comprador que desaparece após o test drive
        </li>
        <li>
          <strong>Risco 2 — Problemas com documentação:</strong> erros na transferência podem gerar
          multas ou restrições no nome do vendedor por anos
        </li>
        <li>
          <strong>Risco 3 — Responsabilidade por débitos:</strong> se o comprador não transferir o
          veículo, multas e infrações ficam no seu CPF
        </li>
        <li>
          <strong>Risco 4 — Negociação emocional:</strong> vender o próprio carro é mais difícil
          psicologicamente — muitos cedem demais na hora da pressão
        </li>
      </ul>

      <h2>O que é a Consignação e Como Funciona na Carro e Cia</h2>
      <p>Na consignação, você entrega o veículo para a Carro e Cia comercializar em seu nome:</p>
      <ol>
        <li>Avaliação gratuita do veículo</li>
        <li>Assinatura de contrato com prazo e valor mínimo acordados</li>
        <li>Nossa equipe fotografa, anuncia e atende os compradores</li>
        <li>Toda a negociação e documentação é intermediada por nós</li>
        <li>Venda concluída — você recebe o valor líquido combinado</li>
      </ol>
      <p>
        Saiba mais sobre as nossas condições em{' '}
        <Link
          to="/venda-seu-carro-rapido-uberaba"
          className="text-primary font-medium hover:underline"
        >
          Consignação em Uberaba
        </Link>
        .
      </p>

      <h2>Comparativo Final: Particular vs Consignação</h2>
      <div className="my-8 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Característica</TableHead>
              <TableHead>Venda Particular</TableHead>
              <TableHead>Consignação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Trabalho envolvido</TableCell>
              <TableCell>Alto</TableCell>
              <TableCell>Nenhum para o proprietário</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Risco de golpe</TableCell>
              <TableCell>Alto</TableCell>
              <TableCell>Zero</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Tempo médio de venda</TableCell>
              <TableCell>30 a 90 dias</TableCell>
              <TableCell>15 a 30 dias</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Preço obtido</TableCell>
              <TableCell>Variável, sujeito a pressão</TableCell>
              <TableCell>Avaliação justa e profissional</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Segurança na documentação</TableCell>
              <TableCell>Responsabilidade sua</TableCell>
              <TableCell>Responsabilidade nossa</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Custo</TableCell>
              <TableCell>Gratuito (mas com riscos)</TableCell>
              <TableCell>Comissão sobre a venda</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <h2>Qual é a Certa Para Você?</h2>
      <p>
        <strong>Venda particular faz sentido para quem:</strong> tem tempo disponível, conhece o
        processo, tem habilidade de negociação e está disposto a assumir os riscos.
      </p>
      <p>
        <strong>Consignação faz sentido para quem:</strong> tem pouco tempo, quer maximizar o preço
        sem estresse, valoriza segurança e quer se concentrar em outras coisas enquanto o carro é
        vendido por profissionais.
      </p>

      <div className="mt-12 p-8 bg-muted rounded-2xl text-center shadow-sm">
        <h3 className="text-2xl font-bold mb-4">Escolha a opção que te dá paz de espírito</h3>
        <p className="mb-6 font-medium text-muted-foreground">
          Não sabe ainda por qual caminho ir? Venha fazer a avaliação gratuita na Carro e Cia. Nossa
          equipe apresenta as opções, você decide — sem pressão, sem compromisso.
        </p>
        <Button asChild size="lg" className="w-full sm:w-auto">
          <a
            href={getWhatsAppLink(
              'Olá! Li o artigo sobre Consignação x Particular e gostaria de agendar uma avaliação gratuita para o meu carro.',
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            Solicitar Avaliação Gratuita — WhatsApp
          </a>
        </Button>
      </div>
    </>
  ),
}
