import { ContentBlock } from '@/types/conteudo'

export function BlockPreview({ block, designVars }: { block: ContentBlock; designVars?: any }) {
  const { type, data, style, children } = block

  if (type === 'hero') {
    return (
      <div
        className="text-white p-12 text-center min-h-[300px] flex flex-col justify-center items-center relative"
        style={{
          backgroundColor: data.image_url ? 'transparent' : 'var(--primary)',
          backgroundImage: data.image_url ? `url(${data.image_url})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          fontFamily: 'var(--font-base)',
        }}
      >
        {data.image_url && <div className="absolute inset-0 bg-black/50 z-0"></div>}
        <div className="relative z-10 w-full max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{data.title || 'Seu Título Aqui'}</h1>
          <p className="text-lg md:text-xl mb-6 text-slate-200">
            {data.subtitle || 'Subtítulo persuasivo para capturar a atenção do usuário.'}
          </p>
          {data.cta_text && (
            <button
              style={{ backgroundColor: 'var(--primary)', borderRadius: 'var(--radius)' }}
              className="px-8 py-3 font-bold transition-colors shadow-lg hover:brightness-110"
            >
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
        style={{ fontFamily: 'var(--font-base)' }}
        dangerouslySetInnerHTML={{
          __html: data.html || '<p>Adicione seu texto formatado aqui...</p>',
        }}
      />
    )
  }

  if (type === 'flex' || type === 'grid') {
    const isFlex = type === 'flex'
    return (
      <div
        style={{
          display: isFlex ? 'flex' : 'grid',
          flexDirection: isFlex ? (style?.flexDirection as any) || 'row' : undefined,
          gridTemplateColumns: !isFlex
            ? (style?.gridTemplateColumns as any) || 'repeat(2, 1fr)'
            : undefined,
          gap: style?.gap || '1rem',
          padding: style?.padding || '2rem',
          alignItems: style?.alignItems || 'center',
          justifyContent: style?.justifyContent || 'flex-start',
          backgroundColor: style?.backgroundColor || 'transparent',
        }}
      >
        {children?.length ? (
          children.map((child) => (
            <BlockPreview key={child.id} block={child} designVars={designVars} />
          ))
        ) : (
          <div className="w-full p-8 border-2 border-dashed border-slate-300 text-slate-400 text-center rounded-lg flex items-center justify-center">
            {type === 'flex' ? 'Container Flexbox Vazio' : 'Container Grid Vazio'}
          </div>
        )}
      </div>
    )
  }

  if (type === 'image') {
    return (
      <div className="w-full flex justify-center">
        {data.url ? (
          <img
            src={data.url}
            alt="Block Image"
            className="max-w-full h-auto shadow-sm"
            style={{ borderRadius: 'var(--radius)' }}
          />
        ) : (
          <div className="w-full h-48 bg-slate-100 flex items-center justify-center text-slate-400 border border-dashed rounded-lg">
            Imagem
          </div>
        )}
      </div>
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
                style={{ borderRadius: 'var(--radius)' }}
                className="w-full h-48 object-cover shadow-sm"
                alt=""
              />
            ))
          ) : (
            <div className="col-span-full bg-slate-50 h-48 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200">
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

  return (
    <div className="p-4 bg-slate-100 text-slate-500 border border-slate-200 text-center rounded-lg m-4">
      Bloco do tipo <strong>{type}</strong>
    </div>
  )
}
