# LinkedIn — conexão OAuth (21/08/2026)

Fluxo de autorização criado a pedido da Adriana, pra publicar post da revenda
também no LinkedIn. **Publicar de verdade ainda não funciona** — falta o
LinkedIn aprovar o produto do app (ver "Em aberto" abaixo). O que existe hoje
é só a conexão (pegar e guardar o token) — a function que efetivamente
publica (`publicar-social`) ainda não fala com o LinkedIn.

## O que foi construído

- Tabela `linkedin_integracao` (linha única — uma página só) guarda
  `access_token`, `refresh_token`, `expires_at`, `organization_urn`,
  `organization_nome`, `status`. RLS: só `admin_master`/`gerente` leem.
- `linkedin-oauth-start` (`verify_jwt=true`, chamada pelo botão "Conectar
  LinkedIn" na Central de Redes Sociais → Publicações): gera a URL de
  autorização do LinkedIn com um `state` novo, salvo na linha única pra
  conferir depois.
- `linkedin-oauth-callback` (`verify_jwt=false`, é o próprio LinkedIn que
  chama, direto no navegador de quem autorizou): troca o `code` pelo token,
  tenta descobrir a página (organização) administrada via
  `GET /rest/organizationAcls`, e salva tudo.
- Secrets já configurados pela Adriana: `LINKEDIN_CLIENT_ID`,
  `LINKEDIN_SECRET_KEY`.

## Passo que falta a Adriana fazer, fora do sistema

**Registrar a URL de redirecionamento no app do LinkedIn** (Developer
Portal → o app dela → aba Auth → "Authorized redirect URLs"):

```
https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/linkedin-oauth-callback
```

Sem isso, o LinkedIn recusa a autorização com erro de `redirect_uri`
inválido — testar o botão "Conectar" antes de registrar essa URL só serve
pra confirmar que o link é gerado, não completa a conexão de verdade.

## Testado até agora

`linkedin-oauth-start` testado ao vivo (21/08/2026) — gera a URL corretamente
e grava o `state` na linha única (confirmado batendo os dois). Não testado o
fluxo completo (autorizar de verdade) — depende do passo acima primeiro.

## Em aberto

- **Aprovação do LinkedIn pro produto "Share on LinkedIn"** (escopo
  `w_organization_social`) — revisão manual do LinkedIn, leva de 1 a 4
  semanas. Sem essa aprovação, mesmo com o redirect_uri certo e o login
  feito, a tela de autorização do LinkedIn provavelmente nem oferece o
  escopo, ou a publicação real falha depois.
- **`publicar-social` não fala com o LinkedIn ainda** — falta o bloco de
  publicação (POST `/rest/posts` com `Linkedin-Version` no header,
  `author` = `organization_urn` salvo aqui, escopo `w_organization_social`).
  Só implementar depois de confirmar que o token de teste realmente
  publica (ou pelo menos que o escopo foi aprovado) — não faz sentido
  escrever esse código sem poder testar contra permissão real.
- **Renovação de token**: token de acesso expira em 60 dias, o
  `refresh_token` (se o LinkedIn devolver — não é garantido, depende do
  produto aprovado) dura 365 dias. Nenhuma automação de renovação foi
  criada ainda — quando a conexão estiver testada de ponta a ponta, avaliar
  se precisa de um cron pra renovar sozinho antes de expirar.
- **Descoberta automática da organização pode falhar** — o escopo
  `organizationAcls` pode exigir permissão adicional (`r_organization_admin`)
  que não foi solicitada ainda, pra não arriscar o LinkedIn rejeitar a tela
  de autorização por pedir escopo não aprovado. Se `organization_urn` ficar
  vazio depois de conectar, precisa completar essa coluna à mão no banco.
