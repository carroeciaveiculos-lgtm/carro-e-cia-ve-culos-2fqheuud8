// Service worker mínimo do /admin — existe só pra satisfazer o critério de
// "instalável" de alguns navegadores (17/09/2026). Não guarda cache nenhum de
// propósito: o CRM sempre precisa de dado ao vivo do Supabase, e um cache
// velho aqui seria pior que não instalar o app. Todo fetch passa direto pra
// rede, sem interceptar nada.
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', () => {
  // Intencionalmente vazio — sem event.respondWith() o navegador já deixa a
  // requisição seguir pra rede normalmente.
})
