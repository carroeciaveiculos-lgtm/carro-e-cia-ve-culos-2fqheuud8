import { useState, useEffect } from 'react'

export function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('clarity-consent')
    if (consent === null) {
      setShow(true)
    }
  }, [])

  const acceptClarity = () => {
    localStorage.setItem('clarity-consent', 'true')
    setShow(false)
    window.location.reload()
  }

  const rejectClarity = () => {
    localStorage.setItem('clarity-consent', 'false')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full bg-slate-900 text-white p-4 z-[1000] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl border-t border-slate-700 animate-in slide-in-from-bottom-5 fade-in duration-500">
      <div className="flex flex-col">
        <p className="text-sm font-medium text-slate-100 m-0">
          Sua privacidade é importante para nós
        </p>
        <p className="text-xs text-slate-400 m-0 mt-1 max-w-3xl leading-relaxed">
          Usamos ferramentas de análise como Microsoft Clarity para entender como você utiliza nosso
          site e melhorar sua experiência. Seus dados são coletados de forma anônima e protegem sua
          privacidade ocultando campos de preenchimento.
        </p>
      </div>
      <div className="flex gap-3 whitespace-nowrap mt-2 sm:mt-0">
        <button
          onClick={rejectClarity}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-sm font-medium transition-colors"
        >
          Recusar
        </button>
        <button
          onClick={acceptClarity}
          className="px-4 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded text-sm font-medium transition-colors"
        >
          Aceitar
        </button>
      </div>
    </div>
  )
}
