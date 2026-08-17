# Prompt pra próxima sessão

Copie e cole como primeira mensagem numa sessão nova do Claude Code.

```
Continuando de uma sessão anterior (17/08/2026, sessão 7). Leia primeiro:
- MEMORY_WORK.MD deste projeto (seção "O que está no ar hoje" tem tudo
  de 17/08: setores substituindo módulos, remoção de 3 telas mock, menu
  reorganizado em 3 grupos, manual operacional + skill)
- CLAUDE.md deste projeto, seção "Manual Operacional do Sistema" (regra
  ampliada em 17/08 — fechar lacuna relacionada à tarefa do momento sem
  esperar pedido)
- docs/manual-operacional-contexto.md — checklist de documentação por
  setor, usar como guia se a Adriana pedir pra escrever manual

## Precisa de ação/decisão da Adriana
1. Planejar junto o futuro das 3 telas removidas em 17/08 (eram só
   fachada, sem salvar dado real): Avaliação de veículo formal,
   Configurações gerais de Loja/SEO/Scripts, Automações de e-mail de
   nutrição de lead. Detalhe de cada uma na seção "Backlog" de
   `docs/manual-operacional-contexto.md`. Ela pediu esse plano
   explicitamente, ainda não começou.
2. Confirmar se a integração OLX/iCarros/Napista em `/admin/portais`
   continua só com flag (sem API real por trás) ou se isso já mudou —
   comentário no código pode estar desatualizado, não foi checado.
3. Escolher por onde começar a escrever os artigos do Manual Operacional
   (skill `manual-operacional` já pronta) — hoje só existe 1 artigo real
   ("Criar Usuário no Painel"), o resto de `docs/manual-operacional-contexto.md`
   está sem ✅.
4. Testar o NaPista de ponta a ponta: toggle "Publicar no NaPista" num
   veículo de teste em /admin/portais, conferir se enfileira certo
   (pendência antiga, ainda aberta).
5. Se ela quiser o Brevo configurado, preciso da chave de API — nada
   foi feito ainda, só confirmado que não existe conector oficial.
6. Rodar `claude mcp list` — conferir se o Canva aparece conectado. Se
   ainda "Needs authentication", pedir pra ela rodar /mcp e autenticar.

## Conferir, sem precisar perguntar
- **Feature "Criar Usuário" e "Esqueci minha senha" já testadas, no ar e
  commitadas** (17/08/2026) — os itens antigos sobre testar essas telas
  estão resolvidos, não repetir.
- Push feito em 17/08/2026: commit `ba3b5f5` enviado pro GitHub (menu
  reorganizado, 3 telas mock removidas, manual operacional + skill). Não
  tem nada pendente de push até a próxima sessão criar commit novo.
- Meta Ads MCP **resolvido em 16/08/2026**: conector conectado com token
  pessoal de longa duração (Admin do app, `expires_at: 0`). Token de
  Usuário de Sistema NUNCA funciona pra essa permissão — testado duas
  vezes. Não reinvestigar, ver `docs/meta-ads-mcp.md`.
- Modo automático (`defaultMode: auto`) já é padrão — isso NÃO
  substitui a regra do CLAUDE.md global da Adriana de pedir
  autorização antes de qualquer mudança em produção.
- Regra em vigor (pedido direto da Adriana): sempre que eu aplicar uma
  mudança autorizada, perguntar se ela quer que eu já commite e dê push
  em seguida (as duas coisas juntas) — não deixar acumular.
- Regra nova (17/08/2026): ao fechar qualquer tarefa que tocar o painel
  admin, checar `docs/manual-operacional-contexto.md` e já escrever o
  artigo que faltar relacionado à mudança, sem esperar pedido explícito.
  Fechar lacunas antigas não relacionadas ao momento continua sendo por
  iniciativa da Adriana, chamando a skill `manual-operacional`.

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
```

Depois de usar, atualize este arquivo antes de fechar a sessão (regra no
`CLAUDE.md`) — não precisa apagar, só manter em dia.
