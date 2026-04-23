ERROS ENCONTRADOS — Auditoria Completa

CRÍTICA (1 erros):

1. `src/App.tsx` — Importações sendo feitas após a declaração de variáveis (ReferenceError/Hoisting) — Imports movidos para o topo do arquivo para evitar `Cannot access before initialization`.

ALTA (2 erros):

1. `index.html` — Preload desnecessário de imagem no `<head>` bloqueando a renderização inicial e concorrendo com recursos críticos — Removido o `<link rel="preload" as="image">`.
2. `src/lib/tracking.ts` — Eventos GTM e Meta Pixel disparados de forma síncrona podendo bloquear a thread principal em falhas de rede (Erro HTTP 0 reportado) — Refatorado para usar `requestIdleCallback` (com fallback para `setTimeout`), priorizando a fluidez da UI.

MÉDIA (2 erros):

1. `src/components/home/Hero.tsx` — Imagem principal do Hero carregando com `loading="lazy"` (prejudica o LCP em conexões lentas) — Alterado para `loading="eager"` e adicionado `fetchPriority="high"`.
2. `src/pages/Veiculo.tsx` — Imagens secundárias da galeria sem dimensões explícitas (`width` e `height`) e sem `loading="lazy"` — Adicionadas dimensões e atributos de performance para evitar _Layout Shift_ e economizar dados no mobile.

BAIXA (0 erros):
Nenhum erro de prioridade baixa identificado no escopo fornecido.
