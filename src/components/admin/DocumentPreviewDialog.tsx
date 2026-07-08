import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface DocumentPreviewDialogProps {
  document: any | null
  onClose: () => void
}

export function DocumentPreviewDialog({ document: doc, onClose }: DocumentPreviewDialogProps) {
  const isImage =
    doc?.tipo?.startsWith('image/') || doc?.url_documento?.match(/\.(png|jpe?g|gif|webp|svg)$/i)

  return (
    <Dialog open={!!doc} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="text-base font-bold">
            {doc?.nome_documento || 'Pré-visualização'}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto p-4 bg-slate-50">
          {doc?.url_documento &&
            (isImage ? (
              <img
                src={doc.url_documento}
                alt={doc.nome_documento || 'Documento'}
                className="max-w-full max-h-full mx-auto object-contain rounded-lg shadow-md"
              />
            ) : (
              <iframe
                src={doc.url_documento}
                className="w-full h-full min-h-[60vh] border-0 rounded-lg"
                title={doc.nome_documento || 'Documento'}
              />
            ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
