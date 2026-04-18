import { BlogPost } from './types'
import { getWhatsAppLink } from '@/lib/whatsapp'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export const post3: BlogPost = {
  slug: 'emprestimo-consignado-com-carro',
  title: 'Empréstimo Consignado com Carro: Tudo Que Você Precisa Saber Antes de Assinar',
  category: 'Financiamento e Consignado',
  tags: ['consignado', 'empréstimo', 'garantia de carro'],
  metaDescription:
    'Empréstimo consignado com carro como garantia: como funciona, documentação necessária, cuidados essenciais e como evitar armadilhas. Guia completo e direto.',
  readTime: '5 minutos',
  author: 'Equipe Carro e Cia',
  content: (
    <>
      <p>
        <strong>Introdução disruptiva:</strong>
      </p>
      <p>
        Assinar um contrato financeiro sem entender cada linha é o caminho mais curto para o
        arrependimento caro. O empréstimo consignado com carro como garantia pode ser uma das
        melhores decisões financeiras da sua vida — ou um pesadelo — dependendo do quanto você sabe
        antes de assinar. Esse artigo existe para que você chegue na mesa de negociação sabendo
        exatamente o que está fazendo.
      </p>

      <h2>O Que Significa Usar o Carro Como Garantia?</h2>
      <p>
        Quando você usa o carro como garantia em um empréstimo consignado, você cede fiduciariamente
        o bem ao credor durante o período do contrato. Em linguagem simples: o banco passa a ser o
        "dono no papel" do veículo até a quitação, mas você continua usando normalmente.
      </p>
      <p>
        Essa modalidade é chamada de alienação fiduciária — é a mesma estrutura usada nos
        financiamentos de veículos tradicionais.
      </p>

      <h2>Documentação Necessária</h2>
      <p>Para contratar um empréstimo consignado com carro, você geralmente precisará de:</p>
      <p>
        <strong>Para você (tomador):</strong>
      </p>
      <ul>
        <li>RG e CPF</li>
        <li>Comprovante de residência atualizado</li>
        <li>Contracheque ou extrato do benefício (últimos 3 meses)</li>
        <li>Carteira de trabalho ou portaria de nomeação (servidores)</li>
      </ul>
      <p>
        <strong>Para o veículo:</strong>
      </p>
      <ul>
        <li>CRLV atualizado (documento do veículo)</li>
        <li>Comprovante de quitação ou declaração de inexistência de financiamento</li>
        <li>Laudo de vistoria (exigido por alguns credores)</li>
        <li>Fotos do veículo em alguns casos</li>
      </ul>

      <h2>Dúvidas Frequentes Respondidas com Honestidade</h2>

      <h3>Posso usar um carro financiado como garantia?</h3>
      <p>Não. O veículo precisa estar quitado e sem ônus para ser oferecido como garantia.</p>

      <h3>Preciso entregar o carro ao banco?</h3>
      <p>
        Não. Você continua usando o veículo normalmente. Apenas a titularidade no documento fica em
        nome do credor até a quitação.
      </p>

      <h3>E se eu quiser vender o carro durante o contrato?</h3>
      <p>
        Não é possível vender sem quitar o contrato antes ou obter anuência do credor. Planeje
        considerando esse ponto. Se pretende vender rápido, conheça nosso{' '}
        <Link
          to="/venda-seu-carro-rapido-uberaba"
          className="text-primary font-medium hover:underline"
        >
          serviço de consignação para venda
        </Link>
        .
      </p>

      <h3>O que acontece se eu atrasar as parcelas?</h3>
      <p>
        No consignado, o desconto é automático em folha — então o atraso só ocorre em casos extremos
        (demissão, suspensão do benefício). Nesses casos, é essencial contatar o credor
        imediatamente para renegociação antes que o veículo seja acionado como garantia.
      </p>

      <h2>Como Escolher o Melhor Credor para Empréstimo Consignado com Carro?</h2>
      <p>Nem todos os bancos e financeiras oferecem as mesmas condições. Compare sempre:</p>
      <ul>
        <li>CET (Custo Efetivo Total) — não apenas a taxa mensal</li>
        <li>Prazo máximo disponível</li>
        <li>Valor máximo liberado com base no seu veículo</li>
        <li>Reputação e atendimento da instituição</li>
        <li>Facilidade de portabilidade caso encontre condições melhores</li>
      </ul>

      <h2>Por Que Contar com a Carro e Cia nesse Processo?</h2>
      <p>
        Porque temos experiência no mercado de veículos de Uberaba há mais de 20 anos — e conhecemos
        as instituições, os processos e as armadilhas contratuais que a maioria das pessoas não vê.
      </p>
      <p>
        Nossa equipe não vende crédito por comissão. Apresentamos opções, explicamos cada detalhe e
        você decide com autonomia e informação de qualidade. Saiba mais sobre nossa expertise em{' '}
        <Link
          to="/financiamento-veiculo-consignado"
          className="text-primary font-medium hover:underline"
        >
          Financiamento Consignado
        </Link>
        .
      </p>

      <div className="mt-12 p-8 bg-muted rounded-2xl text-center shadow-sm">
        <h3 className="text-2xl font-bold mb-4">Não assine nada com dúvidas!</h3>
        <p className="mb-6 font-medium text-muted-foreground">
          Antes de assinar qualquer contrato, converse com a gente. Somos especialistas em veículos
          e conhecemos o mercado de crédito consignado de Uberaba por dentro.
        </p>
        <Button asChild size="lg" className="w-full sm:w-auto">
          <a
            href={getWhatsAppLink(
              'Olá! Gostaria de falar com um especialista sobre empréstimo consignado usando meu carro.',
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            Falar com Especialista — WhatsApp Carro e Cia
          </a>
        </Button>
      </div>
    </>
  ),
}
