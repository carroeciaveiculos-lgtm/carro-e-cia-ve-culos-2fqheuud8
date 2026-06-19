import { ContentBlock } from '@/types/conteudo'

export function BlockPreview({ block }: { block: ContentBlock }) {
  const { type, data } = block

  if (type === 'hero') {
    return (
      <div
        className="bg-slate-900 text-white p-12 text-center min-h-[300px] flex flex-col justify-center items-center"
        style={{
          backgroundImage: data.image_url ? `url(${data.image_url})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="bg-black/50 p-6 rounded-xl w-full max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{data.title || 'Seu Título Aqui'}</h1>
          <p className="text-lg md:text-xl mb-6 text-slate-200">
            {data.subtitle || 'Subtítulo persuasivo para capturar a atenção do usuário.'}
          </p>
          {data.cta_text && (
            <button className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-full font-bold transition-colors">
              {data.cta_text}
            </button>
          )}
        </div>
      </div>
    )
  }

  if (type === 'text') {
    return (
      <div
        className="p-8 max-w-4xl mx-auto prose prose-slate"
        dangerouslySetInnerHTML={{
          __html: data.html || '<p>Adicione seu texto formatado aqui...</p>',
        }}
      />
    )
  }

  if (type === 'gallery') {
    const imgs = data.images || []
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {imgs.length ? (
            imgs.map((img: string, i: number) => (
              <img
                key={i}
                src={img}
                className="w-full h-48 object-cover rounded-lg shadow-sm"
                alt=""
              />
            ))
          ) : (
            <div className="col-span-1 sm:col-span-2 md:col-span-3 bg-slate-50 h-48 flex items-center justify-center text-slate-400 rounded-lg border-2 border-dashed border-slate-200">
              Nenhuma imagem na galeria
            </div>
          )}
        </div>
      </div>
    )
  }

  if (type === 'faq') {
    const items = data.items || []
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-4">
        <h2 className="text-2xl font-bold text-center mb-8">Perguntas Frequentes</h2>
        {items.length ? (
          items.map((item: any, i: number) => (
            <details
              key={i}
              className="border border-slate-200 rounded-lg p-4 group bg-white [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="font-bold text-lg cursor-pointer flex justify-between items-center">
                {item.q || 'Nova Pergunta?'}
                <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-slate-600 mt-4 leading-relaxed">{item.a || 'Resposta...'}</p>
            </details>
          ))
        ) : (
          <p className="text-center text-slate-400 italic">FAQ Vazio</p>
        )}
      </div>
    )
  }

  return <div className="p-4 bg-red-50 text-red-500 border border-red-200">Bloco Desconhecido</div>
}
