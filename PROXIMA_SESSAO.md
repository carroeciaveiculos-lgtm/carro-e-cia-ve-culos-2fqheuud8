# Próxima sessão — Carro e Cia Veículos
Atualizado em: 27/10/2026 (sessão 35)
Substitui: 09/10/2026 (sessão 34)

## AO ABRIR O CLAUDE CODE — VERIFICAÇÕES OBRIGATÓRIAS

Estas 6 pendências estavam abertas em 09/10 e NÃO foram confirmadas depois.
Verificar cada uma antes de assumir que estão resolvidas.
Marcar como RESOLVIDO, PENDENTE ou BLOQUEADO.

- [ ] 1. Interruptor 0 km e "mês de referência" testados no PAINEL PUBLICADO
       (o teste em localhost foi feito; o teste em produção ficou pendente)
       Como verificar: cadastrar um veículo de teste no admin publicado,
       conferir se o interruptor aparece, se o mês é gravado e o que
       /tabela-fipe mostra depois.

- [ ] 2. Os 2 avisos de WhatsApp da FIPE chegaram no celular da Adriana
       Como verificar: perguntar a ela diretamente; não há como confirmar
       por código.

- [ ] 3. A function fipe-atualizar-estoque foi rodada com um 0 km REAL
       (só a regra foi testada em script isolado; a function real nunca rodou
       com um 0 km. Rodá-la envia WhatsApp de verdade para a Adriana.)
       Como verificar: marcar um veículo de teste como is_zero_km=true e
       disparar a function. Confirmar o valor 32000 aplicado e o aviso enviado.

- [ ] 4. O cron das 07h grava linha em fipe_estoque_execucoes quando não há novidade
       (disparou em 09/10 mas nenhuma linha nova apareceu na tabela)
       Como verificar: ler o código da function e verificar se o caminho
       sem_novidade faz INSERT. Se não faz, decidir se deve fazer
       (registrar que rodou sem novidade é útil para auditoria).

- [ ] 5. Conectores Meta (meta_social_technologies e whatsapp_business_tools)
       — todos logados?
       (funcionam, mas a Adriana ainda não tinha logado em tudo)
       Como verificar: perguntar a ela; se algum não estiver logado, orientar
       a logar pelo painel.

- [ ] 6. Pedido da Community Management API do LinkedIn (w_organization_social)
       — aprovado?
       (pedido feito em 21/08/2026; lembrete era para checar em 26/08/2026)
       Como verificar: perguntar a ela o status no LinkedIn Developers.
       Se aprovado: trocar escopo no linkedin-oauth-start/callback e no
       publicar-social (detalhe em docs/linkedin-integracao.md).

## ONDE ESTAMOS (verificado pelo git log em 27/10/2026)

- Último commit: ca00c87 — "chore: ignora pasta .codex e recria AUDIT_REPORT"
- Último commit de código de produção: e5e44c0 — "feat: function google-ads-leads
  recebe leads do formulario do anuncio do Google Ads"
- Estado do working tree: LIMPO (git status --short vazio em 27/10)
- Tudo commitado e enviado ao origin/main

## O QUE ESTÁ NO AR (confirmado por commits)

- FIPE 0 km (linha 32000) e mês de referência no cadastro — commit 127ab2a
- FIPE do estoque fase 2 — commit fb19a48
- FIPE Fase 3: gráfico do histórico junta guardado + automação — commit 0659147
- ML não cria mais anúncio duplicado e avisa quando preço diverge — commit 7495c07
- Contador Diamante (12/15) e filtro de publicação dos portais pelo estado real — commit c143fc4
- Pajero sem vaga na Webmotors (documentado) — commit 09502ec
- Function google-ads-leads recebendo leads do formulário — commit e5e44c0
- /tabela-fipe no site publicado mostrando "0 km Flex" e R$ 91.910,00 (Argo) —
  confirmado em 09/10

## DECISÕES RECENTES (não reverter sem pedir)

- 27/10 — AUDIT_REPORT.md restaurado (a exclusão de 46e6798 foi acidental).
  Tratar como "histórico antigo, não atualizado" (conforme CLAUDE.md do projeto).
- 27/10 — .codex/ adicionado ao .gitignore (config local de ferramenta,
  sem segredo, não deve ser versionado).
- 27/10 — CLAUDE.md geral ajustado: nomes de memória flexíveis,
  hierarquia geral vs. projeto definida, ciclo de vida de anotação.
- 10/10 — Diamante: critério 12/15, filtro dos portais pelo estado real.

## PENDÊNCIAS DE MEMÓRIA (não urgentes)

- MEMORY_WORK.MD tem 357 KB e o bloco "O que está no ar hoje" está na
  linha 3451 de 4443 (78% do caminho). Precisa reorganizar.
- A codificação parece estar quebrada na leitura (UTF-8 lido como Latin-1:
  "estÃ¡" em vez de "está"). Busca por palavras acentuadas falha.
  Verificar antes de reorganizar: o problema é do arquivo ou do terminal?
- AGENTS.md existe (18 KB) e NUNCA foi comparado com CLAUDE.md. Se
  contradisser, o robô fica com duas regras incompatíveis.
- .claude/skills tem 2 junctions quebradas (supabase e
  supabase-postgres-best-practices) apontando para .agents/skills que
  não existe mais. Não afeta produção, mas polui comandos recursivos.

## REGRAS DO PROJETO

Seguir CLAUDE.md. Nada de git push --force. Não commitar direto em main
sem preview quando afetar o site. Detalhe técnico vai para docs/.