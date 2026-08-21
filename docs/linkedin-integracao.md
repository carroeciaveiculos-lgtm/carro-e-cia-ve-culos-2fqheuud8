# LinkedIn — conexão OAuth e publicação (21/08/2026)

Construído a pedido da Adriana ("ativar LinkedIn pra publicar"). Hoje
**publica de verdade como membro pessoal** (testado ao vivo, funcionando).
**Publicar na página da empresa ainda não** — depende de aprovação da
LinkedIn pra um produto diferente (ver "Em aberto").

## O que existe e funciona hoje

- Tabela `linkedin_integracao` (linha única — uma conta conectada por vez)
  guarda `access_token`, `refresh_token`, `expires_at`, `author_urn`,
  `author_nome`, `status`. RLS: só `admin_master`/`gerente` leem.
- `linkedin-oauth-start` (`verify_jwt=true`, botão "Conectar LinkedIn" na
  Central de Redes Sociais → Publicações): gera a URL de autorização com
  escopo `openid profile w_member_social` e um `state` novo salvo na linha
  única pra conferir depois.
- `linkedin-oauth-callback` (`verify_jwt=false`, o próprio LinkedIn chama
  direto no navegador de quem autorizou): troca `code` por token, identifica
  o membro via `GET /v2/userinfo` (OpenID Connect) — `sub` vira
  `author_urn` no formato `urn:li:person:{sub}` — e salva tudo.
- `publicar-social` publica de verdade quando `redes.linkedin=true`: lê
  `access_token`/`author_urn` de `linkedin_integracao`, `POST
  https://api.linkedin.com/v2/ugcPosts` com `author` = essa URN,
  `shareMediaCategory: 'NONE'` (só texto — imagem/vídeo no LinkedIn exige
  um fluxo de upload em 3 passos: `registerUpload` → upload do binário →
  criar o share com o asset — não implementado ainda).
- Secrets: `LINKEDIN_CLIENT_ID`, `LINKEDIN_SECRET_KEY` (a Adriana já tinha
  configurado). Redirect URI registrado por ela no app:
  `https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/linkedin-oauth-callback`.

## Testado ao vivo (21/08/2026)

Fluxo completo: Adriana clicou "Conectar LinkedIn", autorizou como **Luiz
Fernando Rodrigues de Araújo**, `linkedin_integracao` confirmado
`status='conectado'` com `author_urn`/`author_nome` certos. Post de teste
criado via `publicar-social` (chamado manualmente, sem esperar o cron de 15
min) — **publicado de verdade**, `post_id` real (`urn:li:share:...`)
confirmado no `payload_erro` do log. **Confirmado que NÃO aparece na página
da empresa** (esperado — é o escopo member, não organization). Post de teste
apagado depois via `DELETE /v2/ugcPosts/{urn}` (204 confirmado) — não sobrou
rastro no LinkedIn nem no banco.

## Pivô de escopo (por que não é `w_organization_social`)

A primeira versão desta integração pedia `w_organization_social` (postar
como página), assumindo que era esse o produto aprovado. A Adriana leu a
documentação oficial (via microsoft-learn MCP,
`learn.microsoft.com/linkedin/consumer/integrations/self-serve/share-on-linkedin`)
e confirmou: o que estava aprovado de fato, self-serve, sem revisão, é
`w_member_social` ("Share on LinkedIn") — posta em nome de um **membro**
autenticado, não da página. Todo o código foi recodificado pra esse escopo
real (ver commits de 21/08/2026) — a tabela e as functions foram renomeadas
de `organization_urn`/`organization_nome` pra `author_urn`/`author_nome`
nesse pivô.

## Em aberto — publicar na página da empresa

Postar como a página ("Carro e Cia Veículos") exige o produto
**"Community Management API"** (escopo `w_organization_social`), que é
diferente do que já está aprovado e passa por revisão formal da LinkedIn
— **não é self-serve**. Pesquisado a fundo (docs oficiais):

- **Pré-requisitos**: verificar a página no LinkedIn (super admin associa
  o app à página — a Adriana já iniciou esse passo em 21/08/2026), e-mail
  comercial verificável (não pessoal), razão social/endereço/site/política
  de privacidade da empresa, nome do app sem "Linked"/"In"/logo do LinkedIn.
- **Como pedir**: Developer Portal → app → aba Products → "Community
  Management API" → Request Access → preencher o formulário.
- **Prazo**: **não divulgado pela LinkedIn** ("avaliado caso a caso") —
  cuidado, uma estimativa anterior de "1-4 semanas" que dei à Adriana não
  vinha da doc oficial, não é confiável.
- **2 tiers depois de aprovado**: Development (uso limitado — 500
  chamadas/24h por app, 100/24h por membro, até 12 meses pra completar a
  integração) → Standard (produção plena, mas exige pedido extra + vídeo de
  tela de até 5 min mostrando o fluxo completo funcionando).
- **Adriana já pediu acesso** (Request Access) em 21/08/2026. Lembrete
  agendado (rotina cloud `trig_01TXYbwdUr6yMcRnMMrwBJxq`) pra 26/08/2026 09h
  ela checar o status no Developer Portal.

### Quando for aprovado, o que precisa mudar no código

1. `linkedin-oauth-start`: escopo passa a incluir `w_organization_social`
   (mantendo `w_member_social` se quiser as duas opções).
2. `linkedin-oauth-callback`: depois do token, buscar a organização
   administrada via `GET /rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR`
   (não `/v2/userinfo`, que só dá o membro) — salvar como
   `organization_urn`/`organization_nome` (colunas novas, não reaproveitar
   `author_urn` — um token pode ter os dois tipos de acesso ao mesmo tempo).
3. `publicar-social`: bloco de LinkedIn passa a usar `author` =
   `organization_urn` em vez de `author_urn` quando publicar como página
   (decidir se vira opção por post ou substitui de vez o modo member).
4. Renovação de token: expira em 60 dias, `refresh_token` dura 365 dias —
   nenhuma automação de renovação existe ainda, avaliar se precisa de cron.
