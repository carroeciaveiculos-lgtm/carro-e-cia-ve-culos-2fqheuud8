import { Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

const NotFound = () => {
  const location = useLocation()

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname)
  }, [location.pathname])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-4">
      <h1 className="text-7xl md:text-9xl font-display font-extrabold text-primary mb-4 animate-fade-in-up">
        404
      </h1>
      <h2 className="text-3xl font-bold mb-4">Página não encontrada</h2>
      <p className="text-muted-foreground mb-8 max-w-md text-lg">
        A página que você está procurando pode ter sido removida, teve seu nome alterado ou está
        temporariamente indisponível.
      </p>
      <Button asChild size="lg" className="h-12 px-8 text-lg">
        <Link to="/">Voltar para o Início</Link>
      </Button>
    </div>
  )
}

export default NotFound
