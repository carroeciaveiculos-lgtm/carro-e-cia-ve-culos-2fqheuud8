# Corte Modelo/Versão — referência técnica

**Como usar este documento.** Vá direto à seção do seu assunto. A seção
_Becos sem saída_ lista o que já foi testado e falhou — **não repita**.

Última atualização: 2026-09-09.

## O problema original

Antes deste plano, a equipe digitava tudo em `veiculos.modelo` (ex:
"Corolla Cross XRE 2.0 16V Flex Aut.") e deixava `versao` em branco — o
próprio texto de ajuda do formulário incentivava isso. Consequência: busca
por versão/motorização não funcionava em lugar nenhum (Clara, site,
admin), porque nenhum dos três olhava o campo `versao`.

## A solução: corte automático + exceções

Regra: separar no primeiro espaço — `modelo` = 1ª palavra, `versao` =
resto — **exceto** quando a 1ª (ou as 2 primeiras) palavra(s) já formam
o nome de verdade do modelo (ex: "Corolla Cross", "Hilux SW4", "Grand
Cherokee").

- **`modelo_versao_excecoes`** (tabela) — lista curada à mão, dois tipos:
  `generico` (1ª palavra sozinha já indica nome composto, vale pra
  qualquer marca — ex: "Grand", "Range", "XC") e `composto` (frase de 2
  palavras específica, só dá match exato — ex: "Corolla Cross", "Hilux
  SW4"). Curadoria é humana, decisão da Adriana caso a caso — nunca
  escrita por código sozinho.
- **`public.cortar_modelo_versao(texto)`** (função Postgres) — recebe o
  texto cru de Modelo e devolve `{modelo, versao}` já separados,
  consultando a tabela acima. Única fonte de verdade do corte — qualquer
  lugar que precise separar Modelo/Versão deve chamar essa função, não
  reimplementar a lógica.

## As 5 fases (todas completas desde 09/09/2026)

1. **Base** (27/08/2026) — tabela de exceções + `cortar_modelo_versao()`.
   Migrations `modelo_versao_excecoes_e_funcao_corte` e
   `modelo_versao_excecoes_hilux_sw4_discovery_sport` (2 exceções achadas
   só no teste a seco: "Hilux SW4" e "Discovery Sp.").
2. **Busca corrigida** (27/08/2026) — coluna `veiculos.busca_normalizada`
   (marca+modelo+versão+placa, sem acento, minúsculo, mantida por
   trigger). `Estoque.tsx` (site), `Leads.tsx` (admin) e a tool
   `consultar_estoque` da Clara (`ai-sdr`) passaram a filtrar por essa
   coluna em vez de só `modelo`.
3. **Cadastro por placa** (27/08/2026) — `consultar-placa/index.ts` roda
   `cortar_modelo_versao` sobre o texto que vem da API Brasil/mock antes
   de gravar. Cobre tanto consulta nova quanto cache-hit de placa já
   consultada antes (achado real: o caminho de cache-hit não passava pelo
   corte até ser corrigido).
4. **Migração dos 26 veículos existentes** (27/08/2026) — backup em
   `veiculos_modelo_versao_backup_fase4` antes de sobrescrever, piloto
   com 2 Hilux SW4, depois lote completo. Confirmado que a migração não
   quebra o matching de catálogo WM/NaPista (eles comparam
   `[modelo, versao].join(' ')`, não o modelo isolado) nem republica nada
   sozinha no Mercado Livre além do `pending_update` esperado.
5. **Auditoria mensal da FIPE** (09/09/2026) — ver seção própria abaixo.

## Fase 5 — auditoria mensal (função + cron)

- **Function**: `supabase/functions/fipe-auditoria-modelo-versao/`.
- **Cron**: `fipe-auditoria-modelo-versao-cron-job`, todo dia 15 às 12h
  UTC (~9h Brasília).
- **O que faz**: busca o catálogo da API pública gratuita da FIPE
  (`parallelum.com.br`, mesma já usada em `src/services/fipe.ts`) só das
  marcas que a loja já teve (`veiculos`/`veiculos_cache` — hoje 19
  marcas, lido do banco a cada execução, não hardcoded). Pra cada nome de
  modelo de 2+ palavras não coberto por uma exceção, agrupa por (marca,
  1ª palavra, 2ª palavra). Vira candidato quando a 2ª palavra "parece"
  nome próprio (formato `Palavra`, não sigla tipo `GLi`/`XLi`/`SE-G`) e
  recorre 3+ vezes pra mesma marca.
- **Nunca escreve em `modelo_versao_excecoes` sozinha** — só grava o
  resultado em `fipe_auditoria_modelo_versao_runs` e avisa por WhatsApp
  (mesmo canal do `daily-report-cron`, número em
  `social_configuracoes.whatsapp_number`). Decisão de adicionar exceção
  continua sendo da Adriana.
- **Escopo restrito às marcas já usadas pela loja, não as ~130 da FIPE
  inteira** — decisão deliberada, por dois motivos: (1) relevância — só
  interessa o que a loja pode vir a cadastrar; (2) segurança — rodar as
  ~130 marcas numa Edge Function arriscaria o mesmo tipo de limite que já
  tirou o sync de vídeo do Google Drive do Supabase (ver
  `docs/google-drive-integracao.md` — CPU/wall-clock limitado). Com 19
  marcas, a auditoria roda em segundos.
- **Ruído conhecido, não corrigido de propósito**: nomes de linha de
  acabamento formatados como palavra normal escapam do filtro de "parece
  nome próprio" — ex: VW "Comfortline"/"Trendline"/"Highline", Hyundai
  "Vision"/"Sense"/"Platinum"/"Ocean"/"Spicy" são trim, não nameplate
  distinta, mas aparecem como candidato porque não têm sigla nem dígito.
  **Decisão consciente**: não curar essa lista à mão no código — seria a
  IA decidindo o que é ou não nameplate, exatamente o julgamento que o
  desenho reserva pra Adriana revisar mês a mês. A ordenação por
  ocorrência (mais frequente primeiro) tende a favorecer os casos reais
  nos top 15 que vão pro WhatsApp; a lista completa fica salva no banco.

## Fatos confirmados

| Fato | Como se sabe |
|---|---|
| O casamento de catálogo NaPista/Webmotors é indiferente a onde o corte cai — comparam Modelo+Versão juntos, não o Modelo isolado | testado ao vivo com `match_wm_modelo`/`match_napista_modelo` reais, score idêntico antes/depois do corte (sessão 16) |
| Busca por texto (Clara/site/admin) só olhava Modelo antes da Fase 2, nunca Versão | leitura de código nos 3 lugares (sessão 16) |
| Cache-hit de placa (`consultar-placa`) não passava pelo corte até ser corrigido na Fase 3 — qualquer placa consultada antes de 27/08 ficaria quebrada pra sempre sem a correção | bug real achado no teste ao vivo da Adriana, placa TCT5A21 (sessão 16) |
| A role usada pelo MCP `supabase` (padrão) não tem permissão em `public.get_internal_service_secret()` — usar o MCP `claude_ai_Supabase` (ou a role de verdade no SQL editor do painel) pra disparar cron manualmente via `net.http_post` | erro `42501: permission denied` testado em 09/09/2026 |

## Becos sem saída — não repetir

- Não tentar reconstruir a curadoria da lista de exceções por algoritmo
  perfeito — o próprio plano original já assumiu que é julgamento humano
  (ver "Ficam de fora por padrão" nas notas da sessão 16). A Fase 5 só
  detecta candidatos, não substitui esse julgamento.
- Não usar `execute_sql` do MCP `supabase` padrão pra disparar
  `net.http_post` com `get_internal_service_secret()` — vai dar
  `permission denied`. Usar `claude_ai_Supabase` (mesma técnica já
  documentada em `MEMORY_WORK.MD` pra testar `publicar-social`).
- Não expandir o escopo da Fase 5 pra todas as ~130 marcas da FIPE sem
  antes resolver paginação/lotes — o risco de timeout é real (mesma
  classe de problema do sync de vídeo).

## Em aberto

- Nenhum item bloqueado. Próxima auditoria real: 15/09/2026 (automática).
