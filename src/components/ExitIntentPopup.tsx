import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getWhatsAppLink } from '@/lib/whatsapp'

export function ExitIntentPopup() {
  const [open, setOpen] = useState(false)
  const [hasShown, setHasShown] = useState(false)

  useEffect(() => {
    if (hasShown) return

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        setOpen(true)
        setHasShown(true)
      }
    }

    const timer = setTimeout(() => {
      if (!hasShown) {
        setOpen(true)
        setHasShown(true)
      }
    }, 30000)

    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave)
      clearTimeout(timer)
    }
  }, [hasShown])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Espera! Antes de ir...
          </DialogTitle>
          <DialogDescription className="text-lg text-center mt-2">
            Receba a avaliação gratuita do seu veículo sem sair de casa.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center mt-4">
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto bg-[#25D366] hover:bg-[#25D366]/90 text-white font-bold"
          >
            <a
              href={getWhatsAppLink('Olá Luiz, quero a avaliação grátis do meu veículo!')}
              target="_blank"
              rel="noopener noreferrer"
              data-event="clique_whatsapp"
            >
              Quero a Avaliação Grátis
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
