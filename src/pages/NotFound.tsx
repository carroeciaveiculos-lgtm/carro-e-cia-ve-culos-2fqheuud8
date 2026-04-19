import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Página não encontrada</h2>
      <p className="text-muted-foreground max-w-md mb-8 text-lg">
        Desculpe, não conseguimos encontrar a página que você estava procurando. Ela pode ter sido
        movida ou não existe mais.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild size="lg">
          <Link to="/">Voltar para o Início</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/estoque">Ver nosso Estoque</Link>
        </Button>
      </div>
    </div>
  )
}
