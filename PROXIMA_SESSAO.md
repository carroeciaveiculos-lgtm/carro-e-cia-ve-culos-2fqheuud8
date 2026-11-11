# Próxima sessão — Carro e Cia Veículos

Atualizado em: 11/11/2026 (sessão 44)
Substitui: 10/11/2026 (sessão 43, que continua válida logo abaixo)

## SESSÃO 44 (10 e 11/11/2026) — conversador: mensagens sumiam e não havia status de entrega (PR #24 MESCLADO, `main` = `7a5ff50`)

**Verificado em 11/11/2026 10:30 UTC:** PR #24 mesclado às 10:03 UTC; "Deploy producao" e "Deploy Edge Functions" = success; só as 6 funções previstas subiram
(`receive-leads`, `ai-sdr`, `send-whatsapp`, `re-engagement-cron`, `lembrete-agendamento-cron`, `agendamento-no-show-cron`; nada em `_shared/`); `/`, `/estoque`, `/admin/login`
= 200 e o passo "anti tela branca" do workflow passou. **NÃO testado:** execução real das funções (sem Deno local) e a tela logada. Ainda não entrou mensagem depois do deploy.

**Causas encontradas (caso Janetty, lead `1b2becd9-b239-4e14-9346-7e56357b5d11`):**
1. `conversation_history` NÃO estava na publicação `supabase_realtime` (só `leads`); nenhuma migration jamais a adicionou. O painel dependia só do Realtime e nunca recebia nada novo.
2. `sendMessage` do `ConversationPanel` não mostrava a mensagem enviada e ignorava o `error` do envio (e limpava a caixa mesmo com falha).
3. Os avisos da Meta (`statuses` entregue/lido/falhou e `reaction`) chegavam no webhook e ficavam só em `meta_webhook_logs`; ninguém os processava. Reação do cliente virava linha-lixo e chamava a Clara (5 vezes entre 10/09 e 14/10).
4. Em 7 dias: 24 `failed`, 7 `sent`, 7 `delivered`, 6 `read`. `131042` (pagamento pendente da conta do WhatsApp Business) nos reengajamentos das 10h; `131047` só para o final 0220 (alerta fora da janela de 24 h). O marcador "[Template Automático de Reengajamento Enviado]" era gravado mesmo quando a mensagem falhava.

**Entregue:** migrations `20261110223614_conversation_history_realtime` e `20261110230758_conversation_history_status_envio` (6 colunas anuláveis `wamid`, `status_envio`, `status_em`,
`erro_codigo`, `erro_texto`, `reacao` + trava + índice; rollback no cabeçalho do arquivo). Painel: ✓ enviado, ✓✓ entregue, ✓✓ azul lido, ⚠ não entregue (com o motivo), reação do cliente,
recarrega após enviar e a cada 10 s, aviso vermelho "Mensagem NÃO enviada" com o texto mantido na caixa. Mensagens antigas ficam sem ícone de propósito. Lembrete de visita e reagendamento
agora aparecem no conversador. Detalhe: o `sent` da Meta é ignorado (a linha já nasce `enviado`); status nunca é rebaixado.

**PENDENTE (esperam resposta/"autorizo" dela):**
1. **Teste dela:** com a conversa aberta, mandar mensagem do número de teste e ver a resposta da Clara aparecer sozinha e o ✓ virar ✓✓. Se não aparecer em 10 s, avisar.
2. **Regra de desligar a Clara ao responder por texto (A/B/C, sem resposta):** hoje texto livre do atendente desliga `ai_enabled` (send-whatsapp, regra de 17/09/2026); template/foto/documento não.
   Foi o que fez o interruptor "parecer quebrado" na Janetty: ela ligava, enviava texto e o sistema desligava de novo. O interruptor em si grava certo (logs 204). A) manter; B) perguntar antes
   (recomendado); C) nunca desligar sozinho. O aviso "Clara desligada" também aparece mesmo se ela já estava desligada (detalhe menor). A Janetty está com `ai_enabled = true` (ela ligou).
3. **Frases de erro da Meta:** `ERROS_META` em `src/lib/whatsapp-status.ts` está VAZIO (único `TODO(human)` desta sessão; há outro antigo em `ad-copy-generator/index.ts`). Sem ele o painel mostra
   "Falha no envio (código N da Meta)". Códigos: 131042, 131047, 131026, 131049, 131048, 130429.
4. **Segurança (achado, nada alterado):** a tabela `leads` tem a política `allow_anon_update_leads` (UPDATE para `anon` com `using true`): quem tem a chave pública altera qualquer lead.
   Investigar quem depende dela (formulários?) e propor migration de correção com rollback (pedido separado).
5. ~~**Pagamento da conta do WhatsApp Business na Meta**~~ **Verificado em 11/11 ~10:30 UTC (`meta_webhook_logs`):** ela pagou em 10/11 e NÃO há mais nenhum `131042` desde as 22:00 UTC de 10/11
   (o reengajamento das 10:00 UTC de 11/11 teve 4 `delivered`, 2 `read` e só `131047` para o final 0220, que é alerta fora da janela de 24 h). NÃO confirmado: quais dessas entregas foram templates de cliente.
   Os `131047` para o 0220 seguem: o alerta interno só chega se ela tiver escrito para o número da Clara nas últimas 24 h (ou se usar template).
6. **Perguntas abertas:** de onde vem o rótulo "sem vendedor" (não existe no código; o lead está `novo`); por que a mensagem de 10/11 22:55 saiu duplicada (22:55:35 e 22:55:36, causa não identificada).
7. **Filtro de data do relatório de estoque (ela autorizou, mas faltam 2 respostas):** marcar "Vendidos" sozinho ao filtrar por venda? e OK do commit. Só front, em `RelatorioEstoque.tsx`
   (`data_venda` já existe em `veiculos`). A branch local `feat/video-narrado-etapa1` foi APAGADA em 10/11 (estava mesclada).
8. **Artigo da Central de Ajuda** "Entender os ✓ e os avisos de falha no conversador" (autorização permanente de 09/11): ainda NÃO escrito.
9. Os pendentes da sessão 43 abaixo continuam valendo (voz do vídeo narrado, esteira Fase 2 e as demais).

**Armadilhas novas:** mexer em `_shared/` redeploya as 87 funções (evitei de propósito); `mcp__supabase__query_logs` não aceita `interval '40 minutes'` (usar `iso_timestamp_start`); no `edge_logs` as chaves
úteis são `request.method`, `request.path`, `request.search`, `response.status_code`; `leads.updated_at` NÃO muda com `ai_enabled` (sem gatilho), então não dá para datar quando a Clara foi desligada;
PRs de memória abertos (#23) colidem com novas branches de documentação: registrar na mesma branch do PR aberto.

## SESSÃO 43 (07 a 10/11/2026) — relatório de estoque, esteira Fase 1, Central de Ajuda, vídeo narrado Etapa 1 (TUDO MESCLADO)

**Estado verificado em 10/11/2026:** `main` = `origin/main` = `6cba797` (merge do PR #22); código sem pendência de commit (os 2 arquivos de memória foram commitados na branch `docs/memoria-sessao-43`). Confie no `git status`. Deploys "Deploy producao" e
"Deploy Edge Functions" do PR #22 terminaram com sucesso; `/estoque` = 200. (Outras telas não reabertas após o PR #22: conferir home e `/admin/login`.)

**Entregue e no ar:**
- PR #18/#19: esteira de criativos estáticos, Fase 1 (4 fotos no cadastro, botão "Gerar criativos", tabela `veiculo_criativos`; migração `20261107204713`).
- PR #20: Relatório de Estoque imprimível (PDF). PR #21: artigos da Central de Ajuda (3 novos + 3 ajustados, conferido no banco).
- PR #22 (`6cba797`): `docs/video-narrado-padrao.md` (PADRÃO obrigatório, também citado no `CLAUDE.md`), `src/lib/roteiro-video.ts` (monta e valida o roteiro; não usado
  por nenhuma tela ainda) e Edge Function `narrar-veiculo` v1 (`verify_jwt = true`, SÓ modo ensaio: áudio mudo, custo ElevenLabs zero; "real" devolve 501).
  Sem login responde 401 (verificado). Chamada AUTENTICADA ao ar: NÃO testada (precisa do JWT dela).
- 8 veículos reais testados no roteiro: todos passam no 9:16; no 4:5 o Pajero tem 72 palavras (mín. 75), o validador avisa.

**Decisões dela (não reverter):** preço NÃO é falado (vai na tela final e na descrição); fecho "Chame a gente no WhatsApp e marque uma visita na loja" sem número;
tom "próximo e confiante"; vídeos 9:16 e 4:5, montados no painel (navegador); sem gastar crédito ElevenLabs em teste; arquivos organizados em
`criativos/<placa>/{imagens,videos,audios}` no R2. Data do relatório: filtrar pelos DOIS (entrada = `created_at`, venda = `data_venda`).
Regra permanente: criar/ajustar artigos da Central de Ajuda com commit e push sem pedir a cada vez (09/11).

**PRÓXIMOS PASSOS (nada disso foi iniciado; esperam resposta/"autorizo" dela):**
1. **Voz:** confirmar com ela se a voz clonada que a Clara usa (secrets `ELEVENLABS_API_KEY`/`ELEVENLABS_VOICE_ID` já no Supabase, inferido) é a dela para os
   vídeos. A chave do CLI em `.env.local` (git-ignorada, final 4190) é de OUTRA conta, só tem 21 vozes padrão: vale só para teste local. Se não for, ela envia o Voice ID.
2. **Filtro de data no relatório** (só front, `RelatorioEstoque.tsx`): mostrar antes→depois e pedir "autorizo". Dois períodos opcionais: entrada (de/até) e venda (de/até).
3. **Esteira Fase 2** (2 veículos/dia às 19:00, 6 linhas/dia; tipo `criativo_estatico` em `social_esteira`; `publicar-social` lê `rede` + trava de duplicidade;
   conferência de preço/dados; "aprovar os 3 posts do veículo"; novo na frente, depois sorteio com descanso de 15 dias; Stories conferido na API da Meta).
   Ela disse "autorizo" para a Fase 2, mas a MIGRAÇÃO DE BANCO exige pedido separado: ler `social_esteira`, trazer o SQL exato e pedir.
4. **Vídeo narrado, Etapa 2** (voz real, cache por hash do texto, teto diário de caracteres, migração de `veiculo_criativos` para vídeo/áudio — pedido separado);
   depois Etapa 3 (botão "Gerar vídeo narrado" no cadastro) e Etapa 4 (envio para aprovação e uso em anúncio).
5. Apagar a branch local `feat/video-narrado-etapa1` (já mesclada; precisa do OK). NÃO mexer em `agents/token-architecture-analysis-and-fixes` nem
   `fix/numero-interno-nao-vira-lead` sem perguntar.
6. Os testes dela: criativos do Hilux ("Gerar criativos" / "Enviar para aprovação") e decisão sobre o rascunho antigo (id `4d60140d-ee51-45a4-acd9-100b04e45f97`).
7. Artigos da Central de Ajuda adiados até ela testar: "Criar textos de anúncio com IA", "Agendador de Redes Sociais", "Ideias com IA". Features novas
   (filtro de data, narração, Fase 2) precisarão de artigo.

**Estado dos crons (verificado 10/11):** 14 `publicar-social-cron-job` ativo (*/15); 19 `post-organico-diario-cron-job` PAUSADO desde 08/11; 20 `esteira-proximo-post-cron-job`
ativo mas `esteira_config.ativa=false` (a esteira só monta carrosséis).

**Outras sobras:** rodapé do criativo (~26–28 px) e layout 1,91:1; operador gerar criativos dos ~29 veículos; regenerar tipos do Supabase e tirar `as any` de
`src/services/ad-copies.ts`; `FRASES_PROIBIDAS` (`TODO(human)` em `ad-copy-generator/index.ts`); preencher nomes de 23 conversas sociais antigas (precisa "autorizo").

**Armadilhas novas:** Git Bash `tar -xzf C:\...` falha (usar PowerShell); `mcp__supabase__list_edge_functions` devolve saída enorme (evitar); sem Deno local, testar
funções com `Deno.serve` simulado em Node + `ffprobe`; `numeroPorExtenso` já corrigido para "um milhão duzentos e cinquenta mil".

## SESSÃO 42 (05/11/2026) — Criador de Anúncios, Fase 1 (bloco A) PRONTA LOCALMENTE, NÃO commitada

- **Branch `feat/gerador-anuncios-fase1` (saiu de `fix/csp-envio-r2`), NADA commitado, NADA no banco, NADA deployado.** 9 arquivos:
  `AdCopyGenerator.tsx` (reescrito), `AdCarrossel.tsx`, `AdVariacoes.tsx`, `src/lib/ad-limites.ts`, `src/lib/criativo-carrossel.ts`,
  `src/services/ad-copies.ts`, `ads-manager.ts` (só removeu `generateAdCopy`), `supabase/functions/ad-copy-generator/index.ts` (reescrita; caminho antigo
  mantido para compatibilidade) e a migration `supabase/migrations/20261105223858_ad_copies.sql` (aplicada em 05/11/2026 22:38 UTC, `migration list` conferido).
- **Verificado em 05/11:** `bun run lint` = 0 erros (92 avisos antigos, nenhum nos arquivos novos); `bun run build` ok; `/admin/anuncios` responde 200 no
  `localhost:8080`. **NÃO testado:** a tela logada, gerar texto (a function nova só roda depois do deploy), carrossel e vídeo no navegador.
- **ORDEM DE EXECUÇÃO (os 4 riscos):** (1) conflito de memória: `MEMORY_WORK.MD`/`PROXIMA_SESSAO.md` mudam em PRs diferentes, mesclar o PR #14 antes (feito,
  `57bd0d5`); (2) migration `ad_copies` aplicada ANTES de mesclar o front que a usa (FEITO em 05/11 com o "autorizo" dela); arquivo renomeado para o timestamp
  real, `migration list`, regenerar tipos e tirar o `as any` de `ad-copies.ts`; (3) a function só pode ser testada depois do deploy (merge dispara
  `deploy-functions.yml`); (4) teste manual logado no painel depois do deploy.
- **ARMADILHA: NUNCA rodar `bun run format` no repositório inteiro.** Ele reescreveu 483 arquivos (fim de linha CRLF/LF + reformatação real) e, se
  commitado, redeploya dezenas de functions. Usar `npx oxfmt <arquivo>` só nos arquivos próprios. Limpo em 05/11 com `git checkout HEAD -- <arquivos>`.
- **Pendências dela:** "autorizo" da migration; "autorizo" do artigo da Central de Ajuda (dado no banco; o artigo antigo "Criar textos de anúncio com IA"
  está desatualizado); "autorizo" de commit+push (perguntar junto); depois PR/merge/deploy (liberados com segurança comprovada). Decidir a lista
  `FRASES_PROIBIDAS` (promessas que a loja nunca pode fazer; único `TODO(human)` em `ad-copy-generator/index.ts`). Padrões usados sem resposta dela: card 1 do
  carrossel com preço, mínimo 3 fotos, RLS "autenticado vê tudo". Limites de caracteres por canal vêm de conhecimento geral, NÃO conferidos na doc oficial.
- **Fase 2 (não iniciada):** catálogo de ofertas de financiamento, consignação, consórcio e seguro; checar categoria especial "Crédito" da Meta.


## SESSÃO 41 (04/11/2026) — PR #12 mesclado e no ar; falha do "Enviar para aprovação" = CSP bloqueia o envio ao R2

- **PR #12 (criativo 4 fotos + selo + logo) MESCLADO em 03/11 22:55 UTC, commit `145f253`; deploy verde (55s); site publicado conferido em 03/11**
  (home, `/estoque`, `/admin/login` renderizam; logo nova servida com 408.542 bytes). ~~SEM merge e SEM deploy~~ nas notas da sessão 40 abaixo = **FECHADO**.
  **Ainda NÃO testado:** o criativo no painel logado (gerar/salvar/exportar, 9:16 com 4 fotos).
- **Falha ao enviar post orgânico para aprovação (diagnóstico de 04/11, causa INFERIDA com evidência forte):** a CSP do site (`public/_headers`,
  `connect-src`) **não listava o R2**, então o navegador bloqueia o `PUT` da imagem só no site publicado. Verificado: logs mostram 2 URLs pré-assinadas
  emitidas (13:44 e 13:45 UTC) e **nenhum `POST` em `social_posts`**; `veiculo_criativos` = 0 registros no total (o "Salvar no sistema" também nunca
  funcionou); o navegador registra `securitypolicyviolation` com `disposition: enforce` para hosts fora da lista. O CORS do bucket está certo
  (permite `PUT` do `www`). **Correção:** acrescentar `https://*.r2.cloudflarestorage.com` ao `connect-src` (branch `fix/csp-envio-r2`, PR a mesclar).
  **Só se confirma depois do deploy** (no localhost não há CSP): conferir o cabeçalho com `curl` e repetir "Enviar para aprovação". Outras 7 telas usam o
  mesmo envio (cadastro de veículo, editor de imagem, conversa de leads...): testar se alguma falhava.
- **Erro `131042` do WhatsApp CONFIRMADO nos logs de 04/11:** "conta com pagamentos pendentes" (a Meta aponta o link de cobrança). Ela precisa
  regularizar o pagamento do WhatsApp Business na Meta; antes era só inferência.
- **Rascunhos apagados:** os 2 posts diários automáticos (03/11 e 04/11) foram apagados às 13:46 UTC pela tela de aprovações.
- **ONDE PARAMOS (fim da sessão 41, 04/11):** branch `fix/csp-envio-r2` com o commit `fdace82` **só local** (arquivos: `public/_headers`,
  `docs/R2_CORS_CONFIGURATION.md`, `MEMORY_WORK.MD`, `PROXIMA_SESSAO.md`). O 1º `git push` falhou por erro de digitação (ponto no fim do nome:
  `invalid refspec`); o 2º, correto (`! git push -u origin fix/csp-envio-r2`), travou 120 s esperando a janela de login do Git (rodava em segundo plano,
  resultado **NÃO verificado**). **Primeiro passo da próxima sessão:** `git fetch` e `git ls-remote origin fix/csp-envio-r2` para ver se subiu; se não,
  ela roda o push de novo e conclui a janela de login. Depois: abrir o PR (autorizado por ela), ela mescla com `! gh pr merge <N> --merge`, conferir
  `gh run list`, `curl -sI https://www.carroeciamotors.com.br/admin/login` (ver `*.r2.cloudflarestorage.com` no `connect-src`), abrir home, `/estoque`,
  `/admin/login`, e ela repete "Enviar para aprovação" (e "Salvar no sistema") no painel. Nada deployado ainda para essa correção.
- **Kit do IX35 não apareceu para aprovação (diagnóstico de 04/11, só leitura, causa verificada nos dados):** (1) a esteira de posts
  (`esteira-proximo-post`, cron a cada 15 min) está **pausada** (`esteira_config.ativa = false`) e o carrossel do IX35 é o 1º da fila (`social_esteira`)
  desde 06/10, então nunca gerou rascunho; (2) a tentativa manual das 13:41 UTC caiu no mesmo bloqueio da CSP acima. Ligar a esteira = mudança em
  produção (2 posts/dia, 10:00 e 18:00, começando pelo IX35): **decisão dela PENDENTE**; recomendo ligar só depois de o envio estar testado.
- **Fila de publicação e cron de 15 min — JÁ EXISTEM (não criar outro):** "fila" = `social_posts` com `status = 'Agendado'` e `data_agendamento <= agora`.
  `publicar-social` roda no cron `publicar-social-cron-job` (jobid 14, `*/15 * * * *`), publica Instagram e Facebook (feed/stories e carrossel).
  Outros crons: `esteira-proximo-post-cron-job` (jobid 20, `*/15`), `post-organico-diario-cron-job` (jobid 19, `0 11 * * *`). Hoje o botão "Aprovar" em
  Central de Redes Sociais → Aprovações move Rascunho → Agendado.
- **PEDIDO DELA AINDA NÃO IMPLEMENTADO (aguarda "autorizo" e 2 respostas):** botão extra **"Enviar para a fila de publicação"** no diálogo "Criar post
  orgânico" (`CriativoAnuncioPanel.tsx`, ao lado de "Enviar para aprovação"): grava como `Agendado` com `data_agendamento` = agora, com confirmação
  "Publicar sem revisar? Sai em até 15 min". Também renomear "Aprovar" → "Aprovar e enviar para a fila" nas Aprovações. Fazer em branch nova **depois** do PR
  da CSP mesclado. Perguntas abertas: (a) sai no próximo ciclo de 15 min ou ela escolhe data/hora? (b) ligar a esteira? Ao entregar, escrever o artigo
  na Central de Ajuda (regra do projeto).
- **Melhorias sugeridas (sem autorização ainda):** mostrar horário da próxima execução e tamanho da fila; mensagem de erro clara no envio em vez de
  "Failed to fetch"; "Aprovar todos" para os rascunhos diários; checar post duplicado por veículo/dia; corrigir o `return` silencioso de
  `criarPostOrganico` (se `!resultado || !canvas` não avisa nada); alerta de rascunho novo (hoje os alertas de WhatsApp falham com `131042`).

## SESSÃO 40 (03/11/2026) — criativo com 4 fotos + selo (commitado), Etapa 0 da marca de IA (teste feito), WABA da Clara

Estado verificado em 03/11 (git, `ls-remote`, banco, API do WhatsApp Business). **`origin/main` = `141a060`** (conferido com `git fetch`).
Branches enviadas/locais: `docs/memoria-sessao-39` (enviada, `5a9b6fa`) e `feat/criativo-4-fotos-selo` (local, `2a4de6c`, ver o push abaixo).

- **Logo do criativo corrigida em 03/11/2026 (commitada na mesma branch, SEM merge e SEM deploy).** Ela viu que o "&" de CARRO&CIA estava branco; o oficial é
  vermelho. O arquivo `public/logo-carro-e-cia-branco-vermelho.png` era idêntico ao que ela enviou (o "&" branco já vinha nele). Recolori só o "&" e o
  "VEÍCULOS" para RGB (227, 50, 42), a cor chapada da logo oficial (`logo carro e cia.png`); tamanho, transparência e letras brancas intactos (conferido
  por número). Em `criativo-padrao.ts` a redução da logo passou a `imageSmoothingQuality = 'high'`. Lint 0 erros, build ok, desenho conferido nos 3 formatos.
  **Limite:** o "VEÍCULOS" da arte de referência é fino e borrado (mede ≈ 98,32,40, escuro por mistura com o preto), então não deu para medir a cor real dele
  ali; usei a da logo oficial. Se ela quiser mais escuro como na referência, é ajuste de cor. Melhor fidelidade: ela enviar o arquivo-fonte da logo. Só o
  criativo usa esse arquivo. **NÃO testado no painel logado.**
- **Criativo "Padrão Carro e Cia" com 4 fotos e selo "Cautelar Aprovada" — commit `2a4de6c`, SEM merge e SEM deploy.** Causa das 3 fotos: painel aceita 4
  (`MAX_FOTOS_CRIATIVO`) e o desenho 3 (`MAX_FOTOS_PADRAO`); agora 4 (1 principal + 3). Selo no canto superior direito da foto principal, nos 3 formatos,
  **sempre ligado** (decisão dela: todo veículo entra com cautelar aprovada). Lint 0 erros, build ok, desenho conferido no Chrome. **NÃO testado no painel
  logado** (nem exportar/salvar). **Teste local não funciona:** o bucket bloqueia por CORS as fotos de `localhost`; testar na prévia do Cloudflare (a
  confirmar se o PR gera) ou no site publicado depois do merge.
- **Erros de texto no CADASTRO (verificado no banco, nada corrigido):** Jaguar F-Pace (TCT5A21) `versao` = "2.0 R-Dynamic SE 404cv (Hibrido)" sem acento;
  Pajero (ETP3C11) `versao` = "TR4 2.0/ 2.0 Flex 16V 4x4 Aut." (repete "2.0"). **Decisão dela PENDENTE** (oferta minha: listar todos os veículos com esse tipo de erro
  e corrigir; alteração de dado de produção = backup + pedido separado). No 9:16 a 3ª linha do título ficou apertada junto do preço (a conferir).
- **Marca de IA nas fotos — decisão REVISADA em 03/11:** ela pediu a ferramenta e disse que "a edição não muda o estado real do carro" (palavra dela, não
  verificável). Salvaguardas combinadas: não apagar o C2PA, original sempre intacta, preencher o canto (sem cortar). **Etapa 0 feita** (foto `OPZ2408`,
  arquivos em `...\scratchpad\etapa0\`): marca some, emendas discretas. **Aguarda o veredito dela.** Se aprovar: itens 1–7 do plano (function
  `tratar-marca-ia` com `verify_jwt = true`, 2 colunas em `veiculo_fotos_ia`, botão na aba "Fotos", carrossel aceitando as tratadas, textos/docs, artigo
  da Central de Ajuda). Os comentários do código e do `CLAUDE.md` ("marcas NÃO são removidas") ficam desatualizados nessa hora.
- **Código de 6 dígitos da Meta para o número da Clara: NÃO encontrado** (Gmail e webhook, falsos positivos de erro 131047/131042). O SMS vai ao chip do
  número; origem do pedido NÃO identificada (o número já está `registered`). Possível problema de pagamento da conta (erro 131042, inferido).
- **WABA da Clara reconfirmado:** `1530053735172401`; Phone Number ID `1231947963330780`; `+55 34 9738-4177`; business `carroeciaveiculos`. O "segundo WABA"
  é provavelmente a conta de teste (inferido).
- **Sujeira de ambiente (verificado 03/11):** 2 servidores Vite de 01/11 ainda rodando (portas 5173 e 5199); não fechei (não são desta sessão).

## SESSÃO 39 (02/11/2026) — PR #1 (Clara) pronto para mesclar; contas conferidas

Estado verificado em 02/11 (gh, git ls-remote). **`origin/main` = `141a060`** (último merge, só docs; `5af1382` é o último de código).

- **PR #1 (Clara) PRONTO, FALTA SÓ O MERGE DELA.** Branch `fix/numero-interno-nao-vira-lead` enviada ao GitHub em 02/11 (`1d18c23..a982374`,
  push normal, sem force; ela rodou `! git push origin fix/numero-interno-nao-vira-lead` e concluiu o login). Verificado: `OPEN`,
  `MERGEABLE`, `CLEAN`, check "Workers Builds" = SUCCESS. Altera 5 arquivos (`AGENTS.md`, `CLAUDE.md`, `ai-sdr`, `re-engagement-cron`,
  `receive-leads`; 47 linhas); a memória ficou idêntica à da main.
  **Próximo passo:** ela roda `! gh pr merge 1 --merge` (o `gh pr merge` anterior falhou porque o GitHub ainda tinha a versão antiga com
  conflito). O merge dispara o deploy de 3 funções (`ai-sdr`, `re-engagement-cron`, `receive-leads`) pelo `deploy-functions.yml`.
  Depois: eu conferir `list_edge_functions` (versão e hora das 3), `gh run list`, logs e o site (home, `/estoque`, `/admin/login`).
  O código do PR #1 NUNCA foi executado (sem `deno`): acompanhar os primeiros leads/agendamentos da Clara.
  Se o merge ainda não tiver acontecido ao abrir a sessão: conferir `gh pr view 1` antes de qualquer coisa.
- **Contas (verificado por leitura em 02/11):** GitHub = `carroeciaveiculos-lgtm` (única logada no `gh`, escopos repo/read:org/gist; remoto
  `origin` = `carroeciaveiculos-lgtm/carro-e-cia-ve-culos-2fqheuud8`; commits como "Adriana Araújo" `lgacomerciodeveiculos@gmail.com`).
  Cloudflare = conta "Lgacomerciodeveiculos@gmail.com's Account" (`96c599909cb2c55408eceedc08a01aca`), acesso por token de conta na variável
  `CLOUDFLARE_API_TOKEN` (permissões do token NÃO verificadas); Worker `carro-e-cia-ve-culos-2fqheuud8`. O Claude Code está logado com outro
  e-mail (`nutriadrianaaraujo22@gmail.com`), que não é nenhuma dessas contas.
- **Aviso de assinatura (02/11):** o Claude Code mostrou "não consegue usar sua assinatura, pagamento em atraso"; ela rodou `/login` e deu
  sucesso. Se voltar: claude.ai/settings/billing.
- **Dúvida dela SEM resposta:** "corrigiu a imagem da logo no modelo?" no teste do Compass. O banco mostra 0 criativos salvos e nenhum post
  novo (o teste não gravou nada). Pedir a captura ou a descrição do que ela viu.
- **Notas de 28 e 29/10 PERDIDAS** ao ficar com a memória da main no PR #1 (defeitos conhecidos da Clara: remarcar deixa a linha antiga
  `agendado`/dupla reserva; lead duplicado 1093; `sendWhatsApp` do `ai-sdr` ignora a resposta da Meta; `daily-report-cron` não confere `res.ok`;
  pendências de fotos NaPista/WM; lead 0151; Paolo; facebook_ads/instagram_ads sem lead). Decisão dela pendente: reinserir via PR de documentação?
- **Conectores desta sessão:** os do claude.ai (Cloudflare Developer Platform, Supabase, Vercel, Windsor) desconectaram; `supabase`, `cloudflare`
  e `meta-ads` seguem. `brevo` (401) e `n8n` (404) falham ao conectar.
- **Becos sem saída novos:** (1) `gh pr merge` antes do push da versão corrigida não adianta (o PR continua `CONFLICTING`). (2) Dois `git push`
  seguidos travaram no `git-credential-manager`; funcionou quando ela rodou com `!` e concluiu a janela.

## SESSÃO 38 (01/11/2026, tarde/noite) — criativo no ar (Stories 9:16, modelo único, foto sem corte), CSP, auditoria Meta

Estado verificado em 01/11 ~22h BRT (git, gh, MCP Supabase, MCP Meta, site publicado). **`origin/main` = `5af1382`** (merge do PR #10).
Todos os PRs abaixo foram mesclados e o `Deploy producao` de cada um terminou com sucesso; site conferido (home, `/estoque`,
`/admin/login` = 200) e o chunk `Estoque-*.js` publicado contém o código novo.

- **PR #7** (`f651f0e`, 21:13 UTC): 3 estilos de IA, `size` validado, logo branca/vermelha transparente (`public/logo-carro-e-cia-branco-vermelho.png`).
  Função `gerar-criativo-anuncio` **v11** (21:14 UTC). O 400 que ela viu antes foi front local x função antiga em produção (INFERIDO; corpo
  da resposta não lido).
- **PR #8** (`8f3a349`): regra no CLAUDE.md "lembrar de commit e push a cada alteração, em toda resposta".
- **PR #5** (`cba7158`, 22:00 UTC): CSP libera Google Ads/Clarity/GA4. Decisão dela: "mesclar assim". **Pendente (LGPD):** GTM, GA4
  (`G-BMYR1WXTT2`) e Pixel da Meta carregam no `index.html` SEM consentimento; o `CookieConsent` só cobre o Clarity. Com o CSP liberado o
  Google Ads/GA4 passam a coletar sem consentimento. Ligar o consentimento às tags NÃO foi feito.
- **PR #9** (`289a9db`, 23:55 UTC; mesclado por ela com `! gh pr merge`): **Stories 9:16** (1080x1920, área segura 250 px topo / 340 px base,
  regra prática a conferir na prévia real do Instagram; IA em `1536x1008`) e **modelo único "Padrão Carro e Cia"** (os 2 antigos saíram do painel;
  `criativo-anuncio.ts` de 343 para 94 linhas). Modelo antigo confirmado ausente no JS publicado.
- **PR #10** (`5af1382`, 00:57 UTC de 02/11): **foto sem corte.** No 1:1 a janela é 2,06:1 e as fotos de celular são 4:3 (4000x3000): o `cover`
  cortava 35% da altura. `fotoCover` virou `fotoInteira` (foto inteira + sobras desfocadas; foto da IA, já na proporção da janela, não muda).
  Testado com as 3 fotos reais do Pajero (1:1 e 4:5).
- **NÃO testado:** painel logado (gerar, "Salvar e copiar link", "Criar post orgânico"); 9:16 com fotos reais; Safari antigo (sem `ctx.filter`,
  as sobras ficam pretas).
- **PRIMEIRO PASSO DA PRÓXIMA SESSÃO — teste no Jeep Compass** (`13ee117d-e038-4fc3-beec-c1a0e2cc51c0`, ela escolheu): ela clica no site publicado
  (Ctrl+F5): 1:1/4:5/9:16 sem IA, Salvar e copiar link, Criar post orgânico (fica Rascunho; NÃO aprovar). Eu confiro `veiculo_criativos` e
  `social_posts` e apagamos o que for do teste só com "autorizo". Antes do teste: 0 criativos salvos; o único rascunho do Compass é o post
  automático `post_organico_diario` (cron), não é do teste.
- ~~**PR #1 (Clara) segue ABERTO**, único PR aberto. Branch local `fix/numero-interno-nao-vira-lead` tem 2 commits NÃO enviados: merge da main
  (`f98bba4`, conflitos só nos arquivos de memória) e um commit de memória (`e9428f6`) que ficou VENCIDO por este arquivo. Ao retomar: trazer a
  main de novo, ficar com a memória da main, revisar e pedir o push. Código revisado e coerente (`ai-sdr` agendamento idempotente;
  `re-engagement-cron` e `receive-leads` não tratam número interno como lead); sem teste de execução (sem `deno`).~~
  **Superado em 02/11 (sessão 39):** a branch foi enviada (`a982374`) e o PR está CLEAN; falta só o merge dela.
- **Auditoria Meta (só leitura), conta `4333456556917039`:** 2 campanhas, gasto R$ 0 em toda a vida. "Consórcio Auto" ATIVA mas SEM nenhum
  anúncio (objetivo Tráfego x meta Conversas, destino indefinido, público aberto); "Consórcios Carro e Cia" PAUSADA pelo `carroecia_bot` em
  31/10 13:36 (parece o teste ao vivo da Clara, INFERIDO). Pixel, página/IG e saldo NÃO checados. Decisão dela pendente (recriar com objetivo
  Mensagens, WhatsApp `5534998037651`, público restrito = pedido separado; gasto real = pedido separado).
- **Pendências sem destino:** stash de 28/09 "fix sync video" (4 arquivos, não revisado); worktree `agents/token-architecture-analysis-and-fixes`
  (≥10 arquivos preparados, branch nunca enviada); artigo da Central de Ajuda do gerador (inserção em banco = pedido separado); limpeza dos slugs e
  regras de IA dos 2 modelos antigos (função + `ai_prompts_config`, pedido separado); ~~selo "Cautelar Aprovada"~~ (FEITO em 03/11, commit `2a4de6c`, ver sessão 40); potência (cv); 16:9.
- **Becos sem saída novos:** (1) o MCP não sobe arquivo binário no Storage do Supabase (usado `public/`). (2) `query_logs` com
  `source='function_edge_logs'` FUNCIONA (método/status/URL, sem corpo), contrariando a nota de 29/10. (3) `git switch -c ... origin/main` deixa o
  upstream em `origin/main`: empurrar com o nome explícito. (4) `git push` travou várias vezes no `git-credential-manager` (login do GitHub no
  Windows); resolve-se rodando o push com `!` ou concluindo a janela, nunca trocar credencial/remoto; matar os processos git travados antes de
  tentar de novo. (5) O classificador do Claude Code barra `gh pr merge` feito por mim às vezes ("Merge Without Review"); alternativa:
  ela roda `! gh pr merge N --merge`. (6) Script do PowerShell: `[math]::Min(1, 0.65)` arredonda para inteiro e dá 100%; usar Python para conta.
  (7) Heredoc de Bash com aspas misturadas quebra: usar script `.py` em arquivo.
- **Sujeira de ambiente:** 4 processos do Vite de sessão anterior (portas 5173 e 5199) ficaram rodando. **Verificado em 03/11/2026: continuam rodando** (2 servidores, `bun`+`node` cada).

## SESSÃO 37 (continuação, 01/11/2026) — novo padrão de criativo (Feed) + incidente do Compass

Branch `feat/criativo-padrao-feed` (criada de `origin/main` = `d764a17`), commit e push autorizados em 01/11. Merge e deploy: NÃO pedidos.
- **Feito (verificado):** novo `src/lib/criativo-padrao.ts` (Feed 1080x1350 na linha da arte de referência da pasta
  `Fotos\IMAGENS PARA ANUNCIOS`) e 3º cartão "Padrão Carro e Cia (novo)" em `CriativoAnuncioPanel.tsx`. Os 2 modelos antigos
  (`criativo-anuncio.ts`) ficaram intactos. `bun run lint` 0 erros (92 avisos, nenhum novo), `bun run build` ok.
- **Regras combinadas com a Adriana:** só Feed (Stories depois, se houver uso real); foto ORIGINAL, sem IA; SEM selo até haver registro
  verificável da vistoria; "à vista" é campo editável (começa em "à vista", pode apagar); manter os 2 modelos antigos até ela aprovar.
- **Testado:** o desenho com 3 casos reais do estoque (Chrome, página temporária já apagada). Achou e corrigiu defeito: título muito
  longo era cortado, agora quebra em 2 linhas. **NÃO testado:** o painel real (exige login dela), exportar PNG, "Salvar no sistema",
  "Criar post orgânico".
- **Achado (verificado no console, 01/11):** `imagens.carroeciamotors.com.br` bloqueia por CORS as fotos pedidas de `localhost:5173` e
  `localhost:5199`. `docs/R2_CORS_CONFIGURATION.md` diz que o 5173 está liberado: está desatualizado ou não cobre esse domínio.
  Vale para TODOS os modelos do gerador: no localhost a prévia não monta. Para testar de verdade: prévia do Cloudflare (se o PR gerar:
  NÃO verificado) ou liberar `localhost:5173` no R2 (config externa, pedido separado).
- **Selo "Cautelar Aprovada":** emblema salvo em `Fotos\IMAGENS PARA ANUNCIOS\Emblema Cautelar Aprovada.png` (1254x1254, fundo BRANCO,
  sem transparência: precisa remover o fundo antes de usar no preto). `veiculos.laudo_cautelar` é caixinha manual (`VehicleFormModal`),
  sem documento; 0 dos 65 veículos marcados; o site público já mostra selo quando marcada. ~~Selo continua desligado.~~ Ligado em 03/11/2026 (commit `2a4de6c`), sem depender da caixinha, por decisão dela.
- **Cadastro:** não existe coluna de potência (cv); no novo padrão é texto digitado. Existe `cilindrada`.
- **Fonte:** a Montserrat só estava declarada no tailwind, o app não a carregava; o padrão novo carrega do Google Fonts (CSP já permite).
- ~~**Incidente ABERTO — Jeep Compass**~~ **FECHADO em 01/11/2026 (noite):** ela republicou o veículo; conferido no banco, `status` = `disponivel`
  (preço R$ 109.897,00, 20 fotos). Em 01/11 11:48:22 BRT ele tinha passado de `disponivel` para `rascunho` durante o teste do gerador antigo.
  **Causa NUNCA provada** (clique da ferramenta ou ação dela). Verificado que o gerador não escreve na tabela `veiculos`: a função
  `gerar-criativo-anuncio` só grava `logs_ia` e o painel não faz `update` em `veiculos`. O teste gastou 2 chamadas da OpenAI.
- ~~**Próximos passos:** Pedido B; aprovação visual; selo; Stories; PR #5 e PR #1~~ — SUPERADO pela sessão 38 acima (PR #5 mesclado, Stories feito,
  PR #1 ainda aberto, selo ainda desligado).

## SESSÃO 37 (01/11/2026) — conferência do estado real (nenhum código novo)

Verificado em 01/11/2026, ~08:50 (git, gh, MCP do Supabase e Chrome):
- `origin/main` = `9a754fa` (merge do PR #3). PR #2 mesclado em 31/10 13:31 UTC; PR #3 mesclado em 31/10 17:20 UTC.
  `Deploy producao` e `Deploy Edge Functions` com sucesso nos dois (runs `41217993787` e `41243510847`).
- Functions: todas ACTIVE; `receive-leads` v244 atualizada ~21:26 UTC de 31/10 (pós PR #3).
- Site publicado: home, `/estoque` (58 links, 0 imagens quebradas) e `/admin/login` renderizam.
  Painel por dentro NÃO testado (sem login).
- **PR #1** (número interno não vira lead; aberto desde 29/10): DIVERGIU da main (6 atrás / 6 à frente) e mexe em
  `receive-leads`, `ai-sdr`, `AGENTS.md`, `CLAUDE.md` e nestes dois arquivos de memória. Conflito provável.
  **Não mesclar sem trazer a main para dentro dele e revisar.** O `AGENTS.md` virou stub em 28/10 e o PR pode reverter isso.
- **PR #4** (legenda por IA): ~~merge autorizado~~ → FECHADO em 01/11/2026: mesclado às 14:13 UTC (`d764a17`), `Deploy producao` e
  `Deploy Edge Functions` com sucesso; só `gerar-conteudo-social` (v103) e `montar-post-veiculo` (v15) ganharam versão nova.
  A correção NÃO foi testada em uso real — pedir para ela ver uma legenda gerada.
- **CSP bloqueando rastreamento** (bloqueio VERIFICADO no console e no cabeçalho publicado; impacto INFERIDO): vem de
  `public/_headers` (idêntico ao publicado em 01/11); CSP existe desde `fbe7f26` (06/07). Bloqueia Google Ads
  (`AW-18085065720`, `AW-869570436`), GA4 (`analytics.google.com`), Clarity, Cloudflare Insights e gateway de conversões da Meta.
  Correção proposta no PR `fix/csp-liberar-rastreamento`: libera `googleads.g.doubleclick.net`, `www.clarity.ms`, `www.google.com`,
  `analytics.google.com` e `*.clarity.ms`. **Fica de fora, por decisão dela:** gateway da Meta (`*.on.aws`, `conversionsapigateway.com`)
  — pode duplicar o `meta-capi-postback`. Pendente antes de mesclar: testar a pré-visualização do Cloudflare e ler o `CookieConsent`
  (LGPD: confirmar que o consentimento segura as tags). Cloudflare Insights e iframe do Facebook também ficaram fora.
- Pedido da Adriana sobre "imagem padrão + prompt que ela enviou": NÃO localizado no repositório (só imagem de vaga,
  `a57c72f`, e criativos de anúncio, `1e2ce22`). Pode estar em sessão paralela — perguntar a ela onde foi pedido.

## SESSÃO 36 (31/10/2026) — Clara: frases + confirmação SIM/NÃO (PR #2 MESCLADO em 31/10, verificado em 01/11)

Estado registrado em 31/10/2026 (git/gh) — superado pela sessão 37 acima:
- ~~`origin/main` = `3a1e88e`, PR #2 aberto~~ → FECHADO em 01/11: PR #2 mesclado em 31/10 13:31 UTC, deploys ok.
  Branch `feat/clara-confirmacao-comandos` empurrada; continha `d657e23` (remove fallback do número alheio dos avisos) e
  `b849aa2` (confirmação SIM/NÃO). Na época o merge foi barrado pelo classificador de segurança ("merge sem revisão").
- Migração `20261031131357_comandos_pendentes_whatsapp` JÁ APLICADA no banco (tabela vazia, RLS ligada, sem policy) —
  arquivo local no PR. Rollback: `drop table public.comandos_pendentes_whatsapp;`.
- Validado antes do PR: `tsc` (stub do Deno) ok, 75 casos das regras de frase ok, `bun run lint` 0 erros, `bun run build` ok.
- Merge em `main` publica as 87 pastas de function (mexe em `_shared/`); deploy geral igual rodou com sucesso em 10/10.

Pendente / com a Adriana:
- [x] ~~Mesclar o PR #2 e conferir `gh run list` + `list_edge_functions`~~ — FECHADO em 01/11/2026: mesclado em 31/10,
  deploy ok (run `41217993787`), `receive-leads` v244 no ar.
- [ ] **Teste ao vivo (D)**: LISTAR; "Clara pausar [alvo]" → "não" (nada muda) → de novo → "sim" (confirmação real);
  alvo seguro: campanha do Google (só registra solicitação) ou campanha Meta sem anúncio ativo, a combinar.
  Conferir depois em `comandos_pendentes_whatsapp` e `agente_interacoes`.
- [ ] Artigo da Central de Ajuda (`ajuda_conteudos`) sobre os comandos da Clara — inserção de dado = pedido separado.
- [ ] Mensagem "anúncios ativos no Meta" (de +55 34 9738-4177 para a Adriana) NÃO foi enviada (aguardava "enviar").
- [ ] Em pausa: filtro "equipe não vira lead" (5 pessoas/6 números), avisos proativos por template, 401 do `ml-webhook`, FIPE 1/3/4.
- Observação: o aviso do CLAUDE.md sobre `populate-cache-test` está defasado (a pasta não existe mais); em produção
  `send-lead-email`, `sync-drive-videos` e `sync-google-drive` estão `verify_jwt:false` apesar de sem entrada no `config.toml`.

## AO ABRIR O CLAUDE CODE — VERIFICAÇÕES OBRIGATÓRIAS

Estas 6 pendências estavam abertas em 09/10 e NÃO foram confirmadas depois.
Verificar cada uma antes de assumir que estão resolvidas.
Marcar como RESOLVIDO, PENDENTE ou BLOQUEADO.

- [ ] **1. Interruptor 0 km e "mês de referência" testados no PAINEL PUBLICADO**
  (o teste em localhost foi feito; o teste em produção ficou pendente)
  Como verificar: cadastrar um veículo de teste no admin publicado,
  conferir se o interruptor aparece, se o mês é gravado e o que
  /tabela-fipe mostra depois.

- [ ] **2. Os 2 avisos de WhatsApp da FIPE chegaram no celular da Adriana**
  Como verificar: perguntar a ela diretamente; não há como confirmar
  por código.

- [ ] **3. A function fipe-atualizar-estoque foi rodada com um 0 km REAL**
  (só a regra foi testada em script isolado; a function real nunca rodou
  com um 0 km. Rodá-la envia WhatsApp de verdade para a Adriana.)
  Como verificar: marcar um veículo de teste como is_zero_km=true e
  disparar a function. Confirmar o valor 32000 aplicado e o aviso enviado.

- [ ] **4. O cron das 07h grava linha em fipe_estoque_execucoes quando não há novidade**
  (disparou em 09/10 mas nenhuma linha nova apareceu na tabela)
  Como verificar: ler o código da function e verificar se o caminho
  sem_novidade faz INSERT. Se não faz, decidir se deve fazer
  (registrar que rodou sem novidade é útil para auditoria).

- [ ] **5. Conectores Meta (meta_social_technologies e whatsapp_business_tools) — todos logados?**
  (funcionam, mas a Adriana ainda não tinha logado em tudo)
  Como verificar: perguntar a ela; se algum não estiver logado, orientar
  a logar pelo painel.

- [ ] **6. Pedido da Community Management API do LinkedIn (w_organization_social) — aprovado?**
  (pedido feito em 21/08/2026; lembrete era para checar em 26/08/2026)
  Como verificar: perguntar a ela o status no LinkedIn Developers.
  Se aprovado: trocar escopo no linkedin-oauth-start/callback e no
  publicar-social (detalhe em docs/linkedin-integracao.md).

## ONDE ESTAMOS (verificado pelo git e gh em 01/11/2026, ~22h BRT)

- **Atualização de 02/11 (sessão 39):** `origin/main` = `141a060` (merge do PR #11, só docs). Último código em produção: `5af1382`
  (PR #10). **PR #1 (Clara) aberto, CLEAN, aguardando o merge dela** (ver sessão 39). Branch desta memória: `docs/memoria-sessao-39`.
- ~~**`origin/main`:** `5af1382`~~ — superado por `141a060` (PR #11 de memória da sessão 38).
- **PRs abertos:** só o **#1** (Clara, ver sessão 39). Mesclados em 01/11: #4, #5, #6, #7, #8, #9, #10, #11.
- **Funções:** `gerar-criativo-anuncio` v11 (21:14 UTC); nenhum PR após o #7 mexeu em `supabase/functions/**`.
- ~~Anterior (08:50 de 01/11): `origin/main` = `d764a17`, PR do CSP aberto~~ — superado.
- Histórico anterior (28/10): último commit era `e327c1f` (docs) e o último código era `e5e44c0` (google-ads-leads) — superado.

## O QUE ESTÁ NO AR (confirmado por commits)

- FIPE 0 km (linha 32000) e mês de referência no cadastro — commit `127ab2a`
- FIPE do estoque fase 2 — commit `fb19a48`
- FIPE Fase 3: gráfico do histórico junta guardado + automação — commit `0659147`
- ML não cria mais anúncio duplicado e avisa quando preço diverge — commit `7495c07`
- Contador Diamante (12/15) e filtro de publicação dos portais pelo estado real — commit `c143fc4`
- Pajero sem vaga na Webmotors (documentado) — commit `09502ec`
- Function google-ads-leads recebendo leads do formulário — commit `e5e44c0`
- /tabela-fipe no site publicado mostrando "0 km Flex" e R$ 91.910,00 (Argo) —
  confirmado em 09/10

## DECISÕES RECENTES (não reverter sem pedir)

- **27/10** — `AUDIT_REPORT.md` restaurado (a exclusão de `46e6798` foi acidental).
  Tratar como "histórico antigo, não atualizado" (conforme CLAUDE.md do projeto).
- **27/10** — `.codex/` adicionado ao `.gitignore` (config local de ferramenta,
  sem segredo, não deve ser versionado).
- **27/10** — `CLAUDE.md` geral ajustado: nomes de memória flexíveis,
  hierarquia geral vs. projeto definida, ciclo de vida de anotação.
- **28/10** — `AGENTS.md` consolidado no `CLAUDE.md`. Regras por assunto agora vivem
  no `CLAUDE.md`; o `AGENTS.md` virou stub de redirecionamento.
- **10/10** — Diamante: critério 12/15, filtro dos portais pelo estado real.

## PENDÊNCIAS DE MEMÓRIA (não urgentes)

- `MEMORY_WORK.MD` tem 357 KB e o bloco "O que está no ar hoje" está na
  linha 3451 de 4443 (78% do caminho). Precisa reorganizar.
- A codificação parece estar quebrada na leitura (UTF-8 lido como Latin-1:
  "estÃ¡" em vez de "está"). Busca por palavras acentuadas falha.
  Verificar antes de reorganizar: o problema é do arquivo ou do terminal?
- ~~`AGENTS.md` comparado com `CLAUDE.md`~~ — **RESOLVIDO em 28/10/2026**:
  consolidado no `CLAUDE.md` (seção "Regras do projeto por assunto") e o
  `AGENTS.md` virou stub de redirecionamento.
- `.claude/skills` tem 2 junctions quebradas (supabase e
  supabase-postgres-best-practices) apontando para `.agents/skills` que
  não existe mais. Não afeta produção, mas polui comandos recursivos.

## REGRAS DO PROJETO

- Seguir `CLAUDE.md`.
- Nada de `git push --force`.
- Não commitar direto em `main` sem preview quando afetar o site.
- Detalhe técnico vai para `docs/`.