# Usuários e acesso (admin) — referência técnica

**Como usar este documento.** Vá direto à seção do seu assunto. A seção
_Becos sem saída_ lista o que já foi testado e falhou — **não repita**. Ao
descobrir algo novo, acrescente aqui com data e fonte, em vez de deixar só no
histórico de conversa.

Última atualização: 2026-08-18.

## Mapa das 2 functions

| Function | Trigger | O que faz |
|---|---|---|
| `criar-usuario-admin` | Frontend autenticado (`verify_jwt` não declarado no `config.toml` — usa o padrão do projeto) | Cria usuário novo no painel (Auth + tabela `usuarios` + vínculo de setor) |
| `esqueci-senha` | Público (`verify_jwt = false`, tela de login) | Gera link de redefinição de senha e manda por e-mail via Resend |

## Fatos confirmados

| Fato | Como se sabe |
|---|---|
| `criar-usuario-admin` **checa o nível de quem está chamando dentro da própria function** (não confia só na tela) — só segue se `usuarios.nivel = 'admin_master'` do usuário autenticado, senão devolve 403 | leitura de `criar-usuario-admin/index.ts`, linhas 55-63 |
| Se o usuário for criado no Auth mas a linha em `usuarios` falhar, a function **desfaz** (`auth.admin.deleteUser`) — não deixa usuário "fantasma" só na Auth sem registro na tabela | leitura, linhas 92-95 |
| Se o vínculo de setor (`usuario_setores`) falhar, a function **não desfaz** o usuário já criado — só devolve um aviso (`warning`) pra corrigir manualmente | leitura, linhas 97-109 |
| Mensagens de erro do Supabase Auth (em inglês) são traduzidas pra português antes de voltar pro frontend (`traduzErro`) — e-mail duplicado, senha curta, e-mail inválido, rate limit | leitura, linhas 14-33 |
| `esqueci-senha` **nunca revela se o e-mail existe** no sistema — sempre devolve a mesma mensagem genérica de sucesso, inclusive quando a geração do link falha internamente (proteção contra enumeração de conta) | leitura, `respondGeneric()`, usada em todos os caminhos de erro |
| Se `RESEND_API_KEY` não estiver configurada, a function **não envia e-mail nenhum, mas responde sucesso do mesmo jeito** — só loga o problema no console do servidor, sem qualquer sinal pra quem pediu a redefinição | leitura, linhas 51/87-89 |
| Quem realmente envia o e-mail é o Resend (`api.resend.com`), não o Supabase Auth — o link de redefinição só é *gerado* pelo Supabase (`generateLink`), pra manter o remetente igual ao das outras notificações do sistema | comentário no código + leitura do fluxo completo |

## Becos sem saída — não repetir

- Não adianta testar `esqueci-senha` esperando um erro visível quando algo dá
  errado (chave ausente, e-mail não encontrado) — por design, ela sempre
  responde sucesso. Pra diagnosticar problema real, olhar o log da function
  no Supabase, não a resposta da API.

## Em aberto

- Não confirmado nesta sessão se `RESEND_API_KEY` está configurada hoje —
  mesma pendência já registrada em `docs/meta-integracao.md` e
  `docs/consultas-externas.md` pra outras variáveis, fora do escopo (só
  documentar).
