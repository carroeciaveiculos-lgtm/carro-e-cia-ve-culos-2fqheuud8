# Edge Functions – Política de `verify_jwt`

## Regra Principal

Toda Edge Function no Supabase DEVE ter sua entrada `[functions.<name>]` definida em `supabase/config.toml` com a propriedade `verify_jwt` explicitamente configurada.

### Classificação

| Categoria                             | `verify_jwt` | Descrição                                                                                                                                                     |
| ------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Webhook / Server-to-Server / Cron** | `false`      | Funções que recebem chamadas de plataformas externas (Meta, ML, Webmotors), de outras Edge Functions, ou de cron jobs. Não há JWT de usuário nessas chamadas. |
| **Frontend-only**                     | `true`       | Funções chamadas exclusivamente pelo browser com o JWT do usuário autenticado.                                                                                |

### Por que isso importa?

Quando `verify_jwt = true` (o padrão do Supabase) e uma função é chamada:

- **Por um webhook externo** (ex: Meta enviando eventos de WhatsApp): a requisição não contém um JWT válido → **HTTP 401 Unauthorized**.
- **Por outra Edge Function** usando `SUPABASE_SERVICE_ROLE_KEY`: a service role key NÃO é um JWT de usuário GoTrue → **HTTP 401 Unauthorized**.
- **Por um cron job do Supabase**: não há Authorization header → **HTTP 401 Unauthorized**.

Isso quebra sincronizações de estoque, automações de leads, disparos de WhatsApp, geração de relatórios e todo o fluxo automatizado.

### Quando criar uma nova função

1. A função será chamada **por webhook externo**, **por outra função server-side**, ou **por cron**?
   - **SIM** → `verify_jwt = false`
   - **NÃO** (apenas pelo browser autenticado) → `verify_jwt = true`

2. Mesmo com `verify_jwt = false`, se a função executa ações privilegiadas, valide internamente o `Authorization` header comparando com `SUPABASE_SERVICE_ROLE_KEY` ou use secrets específicos.

3. Adicione a entrada em `supabase/config.toml` **antes** de fazer o deploy.

4. Atualize a tabela de classificação abaixo com a nova função.

---

## Classificação Atual (Julho 2026)

### `verify_jwt = false` (Webhook / Server-to-Server / Cron)

| Função                          | Tipo                    | Motivo                                                                  |
| ------------------------------- | ----------------------- | ----------------------------------------------------------------------- |
| `receive-leads`                 | Webhook                 | Recebe leads de portais externos (Webmotors, OLx, etc.)                 |
| `enviar-candidatura`            | Public                  | Recebe candidaturas do formulário "Trabalhe Conosco" (sem login)        |
| `sitemap`                       | Public                  | Gera sitemap.xml para crawlers                                          |
| `og-vehicle`                    | Public                  | Gera imagens Open Graph para bots de redes sociais                      |
| `ads-agent`                     | Server-to-Server        | Agente de anúncios chamado internamente                                 |
| `meta-capi-postback`            | Webhook                 | Postback de conversões Meta CAPI                                        |
| `admin-plataformas-api`         | Server-to-Server        | API interna do admin chamada pelo frontend autenticado via service role |
| `notify-new-vehicle`            | Server-to-Server        | Notificação automática ao adicionar veículo                             |
| `sync-estoque`                  | Cron / Server-to-Server | Sincronização de estoque agendada                                       |
| `ml-webhook`                    | Webhook                 | Webhook do Mercado Livre                                                |
| `whatsapp-webhook`              | Webhook                 | Webhook do WhatsApp/Meta                                                |
| `webhook-portais`               | Webhook                 | Webhook genérico de portais                                             |
| `webhook-autentique`            | Webhook                 | Webhook do Autentique (assinaturas)                                     |
| `ml-auth`                       | Server-to-Server        | Autenticação OAuth com Mercado Livre                                    |
| `ml-sync`                       | Server-to-Server / Cron | Sincronização de anúncios com ML                                        |
| `on-lead-created`               | Server-to-Server        | Trigger disparada ao criar lead (database webhook)                      |
| `daily-report-cron`             | Cron                    | Relatório diário automatizado                                           |
| `re-engagement-cron`            | Cron                    | Re-engagement de leads agendado                                         |
| `public-inventory-feed`         | Public                  | Feed público de estoque para classificados                              |
| `send-whatsapp`                 | Server-to-Server        | Envio de mensagens WhatsApp disparado pelo CRM                          |
| `ai-sdr`                        | Server-to-Server        | SDR de IA processando leads                                             |
| `crm-inventory-feed`            | Server-to-Server        | Feed de estoque para o CRM                                              |
| `lead-automation`               | Server-to-Server / Cron | Automação de leads (Brevo, follow-up)                                   |
| `sync-plataforma`               | Server-to-Server / Cron | Sincronização genérica de plataforma                                    |
| `send-lead-email`               | Server-to-Server        | Envio de email de lead                                                  |
| `consultar-placa`               | Server-to-Server        | Consulta de placa via API Brasil                                        |
| `consultar-cpf`                 | Server-to-Server        | Consulta de CPF via API Brasil                                          |
| `enviar-para-assinatura`        | Server-to-Server        | Envio de contrato para assinatura                                       |
| `gerar-pdf-contrato`            | Server-to-Server        | Geração de PDF de contrato                                              |
| `gerar-pdf-proposta`            | Server-to-Server        | Geração de PDF de proposta                                              |
| `gerar-conteudo`                | Server-to-Server        | Geração de conteúdo via IA                                              |
| `gerar-imagem`                  | Server-to-Server        | Geração de imagem via IA                                                |
| `gerar-conteudo-social`         | Server-to-Server        | Geração de conteúdo para redes sociais                                  |
| `publicar-social`               | Server-to-Server        | Publicação em redes sociais                                             |
| `social-actions`                | Server-to-Server        | Ações de redes sociais                                                  |
| `content-workflow-notification` | Server-to-Server        | Notificação de workflow de conteúdo                                     |
| `ai-assistant`                  | Server-to-Server        | Assistente de IA                                                        |
| `ai-agents`                     | Server-to-Server        | Agentes de IA                                                           |
| `og-vehicle`                    | Public                  | Geração de imagem OG                                                    |
| `wm-auth`                       | Server-to-Server        | Autenticação Webmotors                                                  |
| `wm-webhook-leads`              | Webhook                 | Webhook de leads Webmotors                                              |
| `wm-webhook-estoque`            | Webhook                 | Webhook de estoque Webmotors                                            |
| `wm-process-lead`               | Server-to-Server        | Processamento de lead Webmotors                                         |
| `wm-catalogue`                  | Server-to-Server        | Catálogo Webmotors (era órfã até 06/08/2026)                            |
| `linkedin-oauth-callback`       | Webhook                 | Redirect OAuth do LinkedIn direto no navegador (21/08/2026)             |
| `wm-sync-catalogo`              | Server-to-Server        | Carga em lote de marcas/modelos do catálogo Webmotors                   |
| `wm-sync-test`                  | —                       | **Inerte**: `export default` em vez de `Deno.serve`; aponta para outra API |
| `wm-sync-validator-test`        | —                       | **Inerte**: `export ... handler`; valida strings fixas, não chama a WM   |
| `sync-google-drive`             | Server-to-Server        | Sincronização Google Drive                                              |
| `sync-drive-videos`             | Server-to-Server        | Sincronização de vídeos do Drive                                        |
| `avaliar-qualidade-anuncios`    | Cron / Server-to-Server | Avaliação de qualidade de anúncios                                      |

### `verify_jwt = true` (Frontend-only)

| Função                 | Motivo                                                       |
| ---------------------- | ------------------------------------------------------------ |
| `get-r2-presigned-url`    | Gera URLs assinadas do R2; requer JWT do usuário autenticado |
| `migrar-storage-r2`       | Migração de storage; operação privilegiada com JWT do admin  |
| `linkedin-oauth-start`    | Gera link de autorização OAuth; botão "Conectar LinkedIn" no painel (21/08/2026) |
| `populate-cache-test`     | Função de teste com JWT verification                         |
| `wm-sync`                 | Publica anúncio no portal; chamada só pelo admin via `src/services/wm-sync.ts` |
| `wm-mapear-veiculo`       | Tela de mapeamento do admin                                  |
| `wm-confirmar-mapeamento` | Tela de pendências do admin                                  |
| `wm-catalog-fetch`        | Consulta de catálogo a partir do admin                       |
| `gerar-vaga-ia`           | Gera título/descrição de vaga via IA, tela `/admin/vagas`    |
| `gerar-imagem-vaga`       | Gera imagem padrão de vaga via IA, tela `/admin/vagas`       |

> `wm-sync` estava classificada aqui como Server-to-Server / Cron e declarada
> `false` no `config.toml`, enquanto produção rodava `true`. O único chamador é
> `supabase.functions.invoke('wm-sync')` em `src/services/wm-sync.ts` — browser
> autenticado. Corrigido em 06/08/2026: um deploy pelo CLI teria aberto a
> publicação no portal para qualquer chamada sem sessão.

---

## Checklist para Novas Plataformas de Sync

Ao integrar uma nova plataforma (lead sync, inventory sync, etc.):

1. **Criar a Edge Function** em `supabase/functions/<nome>/index.ts`
2. **Adicionar entrada no `config.toml`**:
   ```toml
   [functions.<nome>]
   verify_jwt = false
   ```
3. **Adicionar entrada no `deno.json`** local se necessário (imports NPM)
4. **Atualizar a tabela de classificação** acima
5. **Testar** com curl sem JWT e com service role key:

   ```bash
   # Sem JWT (simulando webhook)
   curl -X POST https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/<nome> \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   # Deve retornar 200, não 401

   # Com service role key (simulando chamada server-to-server)
   curl -X POST https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/<nome> \
     -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   # Deve retornar 200, não 401
   ```

6. **Deploy** via `supabase functions deploy <nome>` ou GitHub sync
7. **Verificar** no painel do Supabase que a função está ativa

---

## Troubleshooting 401

Se uma função retornar HTTP 401:

1. Verifique se `[functions.<nome>]` existe em `supabase/config.toml`
2. Verifique se `verify_jwt = false` está configurado
3. Faça o deploy: `supabase functions deploy <nome>`
4. Reinicie o edge runtime se necessário
5. Verifique se a URL está correta (sem barras extras)
6. Confirme que o header `Authorization` não está sendo enviado com um token inválido (algumas funções com `verify_jwt = false` ainda podem validar internamente)
