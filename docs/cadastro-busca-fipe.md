# Cadastro de veículo: busca FIPE manual + campo "Lugares"

Plano criado em 25/11/2026, a pedido da Adriana. **Estado: planejado, nada implementado.**
Opção escolhida por ela em 25/11/2026: **(A) campo "Lugares" no cadastro** (a (B), escolher a versão
Webmotors direto no cadastro, foi descartada por ser mais um passo para quem cadastra).

## Por que existe

Caso real de 25/11/2026 — duas Hilux SW4 de 7 lugares foram anunciadas na Webmotors como 5 lugares.

- A consulta por placa (`consultar-placa`, API Brasil) preenche marca/modelo/versão em texto e o código FIPE.
  Ela **não** escolhe a versão da Webmotors: quem escolhe é o `wm-mapear-veiculo`, comparando o texto da
  versão com o catálogo da Webmotors (similaridade de trigramas, depois de filtrar pelo ano).
- SSF5A83: a placa trouxe "SRX 4x4 2.8 TDI 16V Dies. Aut." (sem "7 Lug.") → o mapeamento escolheu a versão de
  5 lugares, que além disso não valia para 2024 (mapeada em 10/08, antes da trava de ano de 06/10).
- PYT5J89: a placa trouxe "SRX 4x4 **7 Lug.** ..." (correto), mas a versão de 5 lugares foi **confirmada à mão** em 19/08.
- **A FIPE não separa a SW4 SRX 2.8 por lugares** — um código só, `002146-6` ("Hilux SW4 SRX 4x4 2.8 TDI 16V Dies. Aut.",
  anos 2016–2024; conferido na API FIPE v2 em 25/11/2026). Então só a busca FIPE manual **não resolveria** este caso.
- A Webmotors não tem campo de lugares: o número de lugares só existe dentro da versão (`wm_versoes`). Ver
  `docs/webmotors-integracao.md`, "Achado real (25/11/2026)".

Conclusão: são dois problemas diferentes, e o plano tem duas partes.

1. **Modelo divergente na placa** → busca FIPE manual (marca → modelo → ano) para corrigir marca/modelo/versão/código FIPE.
2. **Lugares** → campo próprio no cadastro que orienta a escolha da versão Webmotors.

## Parte 1 — busca FIPE manual no cadastro

Onde: `src/pages/admin/VehicleFormModal.tsx`, ao lado do botão de consulta por placa (`consultarAPIPlaca`).

- Botão "Buscar na tabela FIPE" abre um diálogo com 3 listas encadeadas: marca → modelo → ano.
- Reaproveita as funções v2 que já existem em `src/services/fipe.ts` (`getFipeReferencias`, `getFipeMarcas`,
  `getFipeModelos`, `getFipeAnos`, `getFipePreco`), as mesmas da página pública `/tabela-fipe`. Sem custo, chamada direta
  do navegador; limite de 500 consultas/dia por IP de quem usa (ver `docs/tabela-fipe.md`).
- Ao escolher, preenche: marca, modelo, versão, `info_personalizadas.codigo_fipe`, `valor_fipe`, `fipe_ref`.
  **Não** apaga o que a placa trouxe e a FIPE não tem (cor, chassi, ano de fabricação).
- Se o carro já tinha código FIPE vindo da placa e o escolhido for diferente, mostrar aviso "a placa indicava X, você
  escolheu Y" antes de salvar.

## Parte 2 — campo "Lugares" (opção A)

1. **Banco**: coluna nova `veiculos.lugares smallint null` (migration; RLS da tabela já cobre). Vazio = não informado.
2. **Cadastro**: lista opcional "Lugares" (2, 4, 5, 6, 7, 8, 9). Pré-preenche 7 quando o texto da versão contém
   "7 Lug", "7L" ou "7 lugares"; a pessoa pode trocar.
3. **`wm-mapear-veiculo`** — depois do filtro de ano que já existe (`filtrarPorAno`), antes de pontuar:
   - `lugares = 7` e existe versão válida com "7 LUGARES"/"7L" → considerar só essas;
   - `lugares = 5` (ou outro ≠ 7) → descartar as versões de 7;
   - campo vazio **e** o modelo tem versões de 5 e de 7 válidas no ano → `revisao_necessaria` com a mensagem
     "Informe o número de lugares no cadastro" (em vez de escolher no chute);
   - nenhuma versão com "7" no modelo (ex.: Tiggo 8, que é sempre 7) → segue como hoje.
4. **Central de Ajuda**: atualizar o artigo do cadastro de veículos (campo novo + quando aparece a revisão).
5. **Tela de mapeamento** (`MapeamentoCatalogoDialog.tsx`): mostrar "5 lugares"/"7 lugares" ao lado de cada versão
   candidata, para quem confirma à mão não repetir o erro da PYT5J89.

Tamanho do problema hoje: no nosso cache do catálogo (`wm_versoes`) só 2 modelos têm versões de 5 e 7 lugares
(Hilux/SW4). O cache só tem os modelos já consultados, então outros aparecerão com o tempo.

## Decisões da Adriana (26/11/2026)

1. Ao escolher na busca FIPE, grava o **nome completo da FIPE** no campo versão (junto com o código FIPE).
2. A conferência FIPE é **um botão disponível**, não obrigatório no cadastro.
3. Carro **já publicado** com versão/lugares corrigidos é **reenviado ao portal sozinho** (edição), com travas:
   - só quando o mapeamento achar **uma única** versão Webmotors compatível; na dúvida vai para "revisar" e não envia;
   - todo reenvio fica registrado no `sync_log` (versão anterior → nova), para poder desfazer;
   - antes de implementar, conferir na documentação do Mercado Livre se ele aceita trocar a versão em anúncio ativo
     (hipótese não verificada em 26/11/2026).

## Ordem de execução proposta

1. Migration `lugares` (autorizo separado).
2. Campo no cadastro + pré-preenchimento + `wm-mapear-veiculo` + rótulos na tela de mapeamento (um PR).
3. Busca FIPE manual (mesmo PR ou o seguinte, conforme as decisões acima).
4. Artigo da Central de Ajuda.
5. Teste: cadastrar em `localhost` uma SW4 com e sem lugares e conferir o status do mapeamento; nada é enviado ao portal no teste.

## Riscos

- O texto das versões da Webmotors não é padronizado ("7 LUGARES", "7L"); a regra de texto pode falhar em modelo novo.
  Mitigação: na dúvida, revisão humana em vez de escolha automática.
- Remapear carros já publicados muda o anúncio no portal; decisão 3 tomada em 26/11/2026: reenvio automático
  com as travas acima.
- `consultar-placa` ainda tem o modo simulado (dados falsos) quando falta `API_BRASIL_TOKEN` — pendência antiga, não
  coberta por este plano.

## Becos sem saída

- Confiar no código FIPE para saber os lugares: não funciona para a SW4 SRX 2.8 (`002146-6` único) — 25/11/2026.
- Procurar campo de lugares no XML da Webmotors (`IncluirCarro`/`AlterarCarro`): não existe — 25/11/2026.
