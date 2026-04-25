import { useEffect, useRef } from 'react'

export function useScrollTracking() {
  const trackedDepths = useRef(new Set<number>())

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight
      const scrolled = (window.scrollY / scrollHeight) * 100

      const depths = [25, 50, 75, 100]
      depths.forEach((depth) => {
        if (scrolled >= depth && !trackedDepths.current.has(depth)) {
          trackedDepths.current.add(depth)
          if (typeof window !== 'undefined' && (window as any).gtag) {
            ;(window as any).gtag('event', 'scroll', {
              scroll_depth: `${depth}%`,
              page_path: window.location.pathname,
            })
          }
        }
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
}
