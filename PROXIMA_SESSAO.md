# Prompt pra próxima sessão

Copie e cole como primeira mensagem numa sessão nova do Claude Code.

```
Continuando de uma sessão anterior (17/08/2026, sessão 7). Leia primeiro:
- MEMORY_WORK.MD deste projeto (seção "O que está no ar hoje" tem tudo
  de 17/08: setores substituindo módulos, remoção de 3 telas mock,
  Avaliação de Veículo reconstruída, Configurações Loja & SEO, correção
  de fotos cortadas nos cards de veículo)
- CLAUDE.md deste projeto, seção "Manual Operacional do Sistema" (regra
  ampliada em 17/08 — fechar lacuna relacionada à tarefa do momento sem
  esperar pedido)
- docs/manual-operacional-contexto.md — checklist de documentação por
  setor, usar como guia se a Adriana pedir pra escrever manual

## Onde paramos — pedido em aberto
A Adriana pediu pra seguir pro backlog **"Documentação de API"**
depois da correção de fotos. Esse item **não tem escopo definido
ainda** — antes de implementar qualquer coisa, perguntar a ela: o que
precisa ser documentado (API interna do admin? endpoints públicos do
site? Edge Functions pra integração de terceiros?), formato (Swagger/
OpenAPI ou markdown simples), e onde isso deve aparecer (seção nova em
`/admin/ajuda`, ou documento técnico separado). Ver achado registrado
em "Achado à parte" no fim de `docs/manual-operacional-contexto.md`.

## Precisa de ação/decisão da Adriana
1. **Escopo da "Documentação de API"** (ver acima) — pedido explícito
   dela, próximo item da fila.
2. **Automações de e-mail de nutrição de lead** — único item do
   backlog de 17/08 que ainda não foi implementado (os outros dois,
   Avaliação de Veículo e Configurações Loja & SEO, já estão no ar).
   Detalhe em `docs/manual-operacional-contexto.md`, seção "Backlog",
   item 3. Precisa de decisão de escopo antes de começar (o que dispara
   o e-mail, com que frequência, qual provedor — ver pendência do
   Brevo abaixo).
3. Se ela quiser o Brevo configurado, preciso da chave de API — nada
   foi feito ainda, só confirmado que não existe conector oficial.
4. Rodar `claude mcp list` — conferir se o Canva aparece conectado. Se
   ainda "Needs authentication", pedir pra ela rodar /mcp e autenticar.

## Pendência minha, não da Adriana — fechar assim que possível
**Artigos da Central de Ajuda em atraso.** A regra do CLAUDE.md diz que
toda função nova/ajustada no painel ganha artigo em `/admin/ajuda`
(tabela `ajuda_conteudos`) — isso ficou pendente pras duas telas
reconstruídas em 17/08 (Avaliação de Veículo e Configurações Loja &
SEO). Só documentei em `docs/manual-operacional-contexto.md` (doc
técnico interno), não escrevi o artigo real que a equipe usaria no
painel. Fechar isso antes de considerar essas duas funcionalidades
100% prontas — usar a skill `manual-operacional`.

## Conferir, sem precisar perguntar
- **Avaliação de Veículo e Configurações Loja & SEO já testadas pela
  Adriana e no ar** (17/08/2026) — commits `52b2cf0` e `e5cf206`. Não
  testado no navegador por mim (sem login), mas ela confirmou "testado
  e ok" nas duas.
- **Correção de fotos cortadas nos cards de veículo — resolvida e
  testada** (17/08/2026, commits `57de41a`, `4b0edd2`, `a5466f6`).
  História completa: primeira tentativa trocou `object-cover` por
  `object-contain` pra parar de cortar fotos verticais/quadradas
  (Volvo XC 60, HR-V, Toro) — a Adriana testou e não gostou (cards
  ficavam com tamanho desigual, faixa cinza nas laterais). Revertido
  pra `object-cover` e criado `src/lib/image-cover-position.ts`, que
  só ajusta o ponto de corte pra cima nas fotos fora do padrão
  paisagem — testei ao vivo rodando o site local (`bun run dev`) nos 3
  carros citados antes de subir, confirmado visualmente. Não
  reabrir isso à toa — se a Adriana reportar corte de foto de novo,
  provavelmente é um veículo NOVO com foto vertical/quadrada que ainda
  não foi visto, não regressão do que já foi corrigido.
- **Achado sem ação, registrado**: existe um terceiro componente de
  card de veículo duplicado, `src/components/home/HomeFeatures.tsx`
  (seção "Veículos em Destaque" da home) — nunca teve o bug de corte,
  não foi mexido. Ao lado de `VehicleCard.tsx` e `Estoque.tsx`, são 3
  implementações de card no total — oportunidade de unificação futura,
  não é urgente.
- Push feito em 17/08/2026: commit `a5466f6` é o mais recente enviado
  pro GitHub. Não tem nada pendente de push até a próxima sessão criar
  commit novo.
- Meta Ads MCP **resolvido em 16/08/2026**: conector conectado com token
  pessoal de longa duração (Admin do app, `expires_at: 0`). Token de
  Usuário de Sistema NUNCA funciona pra essa permissão — testado duas
  vezes. Não reinvestigar, ver `docs/meta-ads-mcp.md`.
- **NaPista — confirmado que só publica no ambiente de desenvolvimento
  da NaPista** (`api.development.napista.com.br`), nunca em produção —
  falta `client_id` de produção. Adriana já mandou e-mail pra
  `parceiros@napista.com.br` pedindo (17/08/2026) — aguardando
  resposta, nada a fazer até ela responder.
- Google Ads: acesso total confirmado pela Adriana (pode editar/criar
  campanha). Conector caseiro em `C:\Projeto\carroecia-api-google-ads\`
  ganhou 2 tools novas (`detalhar_campanha`, `verificar_auto_tagging`)
  — auto-tagging confirmado ATIVO, campanhas apontam só pra home (sem
  landing page por veículo). Gap gclid→WhatsApp identificado e
  pesquisado, solução ainda não aprovada pela Adriana pra implementar.
- Modo automático (`defaultMode: auto`) já é padrão — isso NÃO
  substitui a regra do CLAUDE.md global da Adriana de pedir
  autorização antes de qualquer mudança em produção.
- Regra em vigor (pedido direto da Adriana): sempre que eu aplicar uma
  mudança autorizada, perguntar se ela quer que eu já commite e dê push
  em seguida (as duas coisas juntas) — não deixar acumular.
- Regra em vigor (17/08/2026): ao fechar qualquer tarefa que tocar o
  painel admin, checar `docs/manual-operacional-contexto.md` e já
  escrever o artigo que faltar relacionado à mudança, sem esperar
  pedido explícito — ver "Pendência minha" acima, isso ficou devendo
  duas vezes nesta sessão.

## Deploy do site — não fazer manual por hábito
O deploy do front **já é automático**: Cloudflare Workers Builds está
conectado ao repositório, dispara build+deploy sozinho a cada push pro
`main`. Rodar `npx wrangler deploy` manual só em emergência — fazer isso
por rotina já causou o site ficar no ar antes do commit correspondente
(sessão 5, 14/08).

## Segurança — não esquecer
- Nunca usar `execute_sql` direto pra mudança de schema/cron no
  projeto da revenda — sempre via migration.
- Nunca escrever senha/segredo em texto plano numa migration — ver
  regra em CLAUDE.md, seção Migrations.
- Antes de propor mudança em produção, autocrítica proativa própria
  ("o que um especialista atacaria nisso?") sem esperar ser
  perguntado — ver memória permanente `autocritica-antes-de-propor`.
- Antes de propor configuração/integração técnica pra um sistema real
  já conectado (Cloudflare, Supabase, GitHub), checar o estado real com
  a ferramenta disponível (MCP/CLI) ANTES de descrever a solução —
  mesma memória permanente, item mais recente.
- A `client_secret` do app Meta (`APP CARRO E CIA`) foi colada em texto
  puro no chat em 16/08/2026 — Adriana disse que ia revogar/trocar
  depois. Confirmar se já trocou; se não, lembrar
  (developers.facebook.com/apps/1369928368361968/settings/basic/).
- Senha do Roberto e da conta kmzero (Webmotors) continuam expostas
  numa migration antiga — decisão da Adriana foi não mexer. Não
  reabrir isso sem ela pedir.

## Não repetir do zero
- A investigação de integridade de migrations (47 descasadas, crons
  duplicados, feita em 16/08) já está documentada — não reinvestigar.
- As 22 migrations sem arquivo local continuam pendentes (precisa
  Docker Desktop instalado) — sem urgência, não insistir à toa.
- A auditoria completa das 21 páginas do painel (17/08/2026) já foi
  feita e gerou `docs/manual-operacional-contexto.md` — não reauditar do
  zero; só reler o documento e atualizar pontualmente quando algo mudar.
- Limpeza do Security/Performance Advisor do Supabase feita parcialmente
  em 16/08/2026 — o que ficou de fora foi decisão consciente (RLS sem
  policy em 4 tabelas, extensões no schema public, funções SECURITY
  DEFINER expostas, etc.) — não reaplicar a mesma análise do zero.
- A investigação da geração de PDF (`gerar-pdf-proposta`) já achou e
  corrigiu que era 100% fake (zero arquivos reais gerados antes da
  correção em 17/08) — não reabrir essa investigação, já resolvida e
  testada com jsPDF real.
```

Depois de usar, atualize este arquivo antes de fechar a sessão (regra no
`CLAUDE.md`) — não precisa apagar, só manter em dia.
