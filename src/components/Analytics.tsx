import { useEffect } from 'react'

export function Analytics() {
  useEffect(() => {
    if (!document.getElementById('ga4-script')) {
      const script1 = document.createElement('script')
      script1.id = 'ga4-script'
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-7NCHPJ2SLT'}`
      script1.async = true
      document.head.appendChild(script1)

      const script2 = document.createElement('script')
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-7NCHPJ2SLT'}');
      `
      document.head.appendChild(script2)
    }

    if (!document.getElementById('gtm-script')) {
      const script3 = document.createElement('script')
      script3.id = 'gtm-script'
      script3.innerHTML = `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${import.meta.env.VITE_GTM_ID || 'GTM-N7LFK82W'}');
      `
      document.head.appendChild(script3)
    }

    if (!document.getElementById('clarity-script')) {
      const script4 = document.createElement('script')
      script4.id = 'clarity-script'
      script4.innerHTML = `
        (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${import.meta.env.VITE_CLARITY_ID || 'wb6vgqmca2'}");
      `
      document.head.appendChild(script4)
    }
  }, [])

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${import.meta.env.VITE_GTM_ID || 'GTM-N7LFK82W'}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      ></iframe>
    </noscript>
  )
}
