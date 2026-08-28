-- Fase 1 do plano de unificacao das IAs (pedido da Adriana, 28/08/2026):
-- preparar o banco pra tela unica de "regras de IA por botao". So dado --
-- nenhum codigo de producao le essas colunas novas ainda, nada muda de
-- comportamento agora.
--
-- 3 colunas novas:
--   onde_fica: onde o botao aparece na interface (texto livre, informativo)
--   api_provider: 'gemini' ou 'openai', FIXO por decisao da Adriana (texto/
--     pesquisa sempre Gemini, imagem sempre OpenAI -- sem seletor)
--   formato_resposta: a parte TECNICA fixa que o codigo precisa pra
--     conseguir ler a resposta (ex: contrato JSON) -- fica visivel na tela
--     nova, mas travada pra edicao (nao escondida, decisao da Adriana
--     28/08/2026: sempre mostrar o texto completo que a IA recebe).
--     NULL pros 9 prompts que ja sao editaveis hoje -- a parte fixa deles
--     mora dentro do codigo de gerar-conteudo/index.ts, sera exibida
--     (read-only) na Fase 4 sem precisar migrar como dado agora.

ALTER TABLE public.ai_prompts_config
  ADD COLUMN IF NOT EXISTS onde_fica text,
  ADD COLUMN IF NOT EXISTS api_provider text,
  ADD COLUMN IF NOT EXISTS formato_resposta text;

-- Preenche onde_fica + api_provider pros 13 prompts ja existentes.
UPDATE public.ai_prompts_config SET
  onde_fica = 'Nenhum lugar hoje -- nenhum codigo le esse prompt (achado 28/08/2026)',
  api_provider = null
WHERE slug = 'negociacao';

UPDATE public.ai_prompts_config SET
  onde_fica = 'Estoque -> editar veiculo -> "Gerar Descricao com IA" (hoje compartilhado) | Chat interno do Admin | Configuracoes -> Brain IA -> AI Playground',
  api_provider = 'gemini'
WHERE slug = 'ai_assistant';

UPDATE public.ai_prompts_config SET
  onde_fica = 'Nenhum lugar hoje -- nenhum codigo le esse prompt (achado 28/08/2026)',
  api_provider = null
WHERE slug = 'gerar_conteudo_social';

UPDATE public.ai_prompts_config SET
  onde_fica = 'Nenhum lugar hoje -- card morto, a descricao de veiculo hoje usa "Assistente Interno" (sera corrigido na Fase 2)',
  api_provider = 'gemini'
WHERE slug = 'vehicle_description';

UPDATE public.ai_prompts_config SET
  onde_fica = 'Marketing -> Anuncios -> gerar copy (Meta Ads / Google Ads)',
  api_provider = 'gemini'
WHERE slug = 'ad_copy_generator';

UPDATE public.ai_prompts_config SET
  onde_fica = 'Nenhum lugar hoje -- nenhum codigo le esse prompt (achado 28/08/2026)',
  api_provider = null
WHERE slug = 'gerar_conteudo';

UPDATE public.ai_prompts_config SET
  onde_fica = 'Conteudo -> editor de artigo -> "Otimizar rascunho"',
  api_provider = 'gemini'
WHERE slug = 'seo_optimizer';

UPDATE public.ai_prompts_config SET
  onde_fica = 'Conteudo -> editor de artigo -> "Gerar estrutura de titulos" (H2/H3)',
  api_provider = 'gemini'
WHERE slug = 'seo_heading_draft';

UPDATE public.ai_prompts_config SET
  onde_fica = 'Nenhum lugar hoje -- o processo real de re-engajamento (roda todo dia as 10h) usa texto fixo proprio, nao le este prompt (achado 28/08/2026)',
  api_provider = null
WHERE slug = 're_engagement';

UPDATE public.ai_prompts_config SET
  onde_fica = 'Marketing -> Redes Sociais -> "Gerar ideia" e "Gerar post"',
  api_provider = 'gemini'
WHERE slug = 'social_media';

UPDATE public.ai_prompts_config SET
  onde_fica = 'WhatsApp da loja -- Clara, roda sozinha quando o cliente manda mensagem',
  api_provider = 'gemini'
WHERE slug = 'sdr_whatsapp';

UPDATE public.ai_prompts_config SET
  onde_fica = 'Nenhum lugar hoje -- nome parecido com "SDR Digital (WhatsApp)", mas a Clara de verdade usa o slug sdr_whatsapp, nao este (achado 28/08/2026)',
  api_provider = null
WHERE slug = 'ai_sdr';

UPDATE public.ai_prompts_config SET
  onde_fica = 'Conteudo -> editor de artigo -> "Gerar artigo com IA" (Pillar Content)',
  api_provider = 'gemini'
WHERE slug = 'seo_copilot';

-- Insere as 4 linhas novas -- hoje 100% fixas no codigo, sem tela de edicao.
-- Texto exato extraido do codigo real em 28/08/2026, dividido em regra
-- (criativo/instrucional, editavel) + formato_resposta (contrato tecnico
-- que o parser do codigo exige, travado).
INSERT INTO public.ai_prompts_config (slug, name, description, prompt_text, default_prompt, formato_resposta, onde_fica, api_provider) VALUES
(
  'gerar_vaga_texto',
  'Gerar Vaga com IA (texto)',
  'Pesquisa e escreve o anuncio de vaga completo a partir so do cargo',
  'Você é responsável por RH da Carro e Cia Veículos, revenda de carros seminovos em Uberaba - MG, com mais de 20 anos de mercado. Pesquise na internet quais são os requisitos, atividades típicas, ferramentas/conhecimentos e diferenciais reais do mercado brasileiro em 2026 para o cargo pesquisado, e use essa pesquisa pra redigir um anúncio de vaga de emprego completo.

Siga esta estrutura como modelo (adapte o conteúdo de cada seção pro cargo pesquisado, mas mantenha a ordem e o espírito):
1. Um parágrafo de abertura apresentando a Carro e Cia e convidando pro cargo.
2. "Principais Responsabilidades" — lista do que a pessoa faz no dia a dia.
3. "Requisitos e Qualificações" — o que é obrigatório.
4. "Diferenciais Desejáveis" — o que é bônus, não obrigatório.
5. "Perfil Comportamental Esperado" — que tipo de pessoa se encaixa.
6. "Benefícios, Remuneração e Horário" — só o que for genérico/seguro afirmar (salário fixo + comissões, sem inventar valor exato).
7. "Informações Finais e Chamada para Candidatura" — parágrafo convidando a se candidatar pelo formulário do site.

Tom: profissional, acolhedor, direto. Sem promessas irreais de salário ou benefícios que não foram informados. Não invente número de salário.

Formate a descrição em markdown simples: use "# Título da seção" pros títulos de cada parte, "- item" pra listas, "**palavra**" só quando quiser destacar algo pontual.

Depois de escrever, monte também uma lista de 5 a 8 palavras-chave de SEO relevantes pra alguém que procura esse tipo de vaga (cargo, sinônimos do cargo, principais habilidades).',
  'Você é responsável por RH da Carro e Cia Veículos, revenda de carros seminovos em Uberaba - MG, com mais de 20 anos de mercado. Pesquise na internet quais são os requisitos, atividades típicas, ferramentas/conhecimentos e diferenciais reais do mercado brasileiro em 2026 para o cargo pesquisado, e use essa pesquisa pra redigir um anúncio de vaga de emprego completo.

Siga esta estrutura como modelo (adapte o conteúdo de cada seção pro cargo pesquisado, mas mantenha a ordem e o espírito):
1. Um parágrafo de abertura apresentando a Carro e Cia e convidando pro cargo.
2. "Principais Responsabilidades" — lista do que a pessoa faz no dia a dia.
3. "Requisitos e Qualificações" — o que é obrigatório.
4. "Diferenciais Desejáveis" — o que é bônus, não obrigatório.
5. "Perfil Comportamental Esperado" — que tipo de pessoa se encaixa.
6. "Benefícios, Remuneração e Horário" — só o que for genérico/seguro afirmar (salário fixo + comissões, sem inventar valor exato).
7. "Informações Finais e Chamada para Candidatura" — parágrafo convidando a se candidatar pelo formulário do site.

Tom: profissional, acolhedor, direto. Sem promessas irreais de salário ou benefícios que não foram informados. Não invente número de salário.

Formate a descrição em markdown simples: use "# Título da seção" pros títulos de cada parte, "- item" pra listas, "**palavra**" só quando quiser destacar algo pontual.

Depois de escrever, monte também uma lista de 5 a 8 palavras-chave de SEO relevantes pra alguém que procura esse tipo de vaga (cargo, sinônimos do cargo, principais habilidades).',
  'Responda APENAS com um JSON válido, sem formatação markdown ao redor, sem texto antes ou depois, no formato:
{
  "titulo": "título curto e claro da vaga (até 60 caracteres)",
  "descricao": "a descrição completa em markdown, seguindo a estrutura acima",
  "palavras_chave": ["palavra1", "palavra2", "palavra3"]
}',
  'Vagas -> Nova Vaga -> botao "Gerar com IA"',
  'gemini'
),
(
  'gerar_resumo_vaga',
  'Gerar Resumo de Vaga (redes sociais)',
  'Resume a descricao completa da vaga num texto curto pro Instagram/Facebook',
  'Você é responsável por RH da Carro e Cia Veículos, revenda de carros seminovos em Uberaba - MG. Resuma a vaga informada num texto pronto pra postar no Facebook e Instagram, no MÁXIMO 450 caracteres (conte os caracteres, é um limite rígido).

Regras do resumo:
- Direto e convidativo, foco nos pontos mais atrativos (o que a pessoa vai fazer + 1 ou 2 requisitos principais).
- NÃO use tags HTML, markdown, asteriscos ou links.
- NÃO repita o cargo várias vezes.
- Pode usar 1 ou 2 emojis, sem exagero.
- NÃO inclua "candidate-se" nem link no final — isso é adicionado depois, fora do resumo.',
  'Você é responsável por RH da Carro e Cia Veículos, revenda de carros seminovos em Uberaba - MG. Resuma a vaga informada num texto pronto pra postar no Facebook e Instagram, no MÁXIMO 450 caracteres (conte os caracteres, é um limite rígido).

Regras do resumo:
- Direto e convidativo, foco nos pontos mais atrativos (o que a pessoa vai fazer + 1 ou 2 requisitos principais).
- NÃO use tags HTML, markdown, asteriscos ou links.
- NÃO repita o cargo várias vezes.
- Pode usar 1 ou 2 emojis, sem exagero.
- NÃO inclua "candidate-se" nem link no final — isso é adicionado depois, fora do resumo.',
  'Responda APENAS com um JSON válido, sem formatação markdown, no formato:
{"resumo": "texto do resumo aqui"}
(trava de segurança extra do sistema: corta automaticamente em 2200 caracteres se a IA passar do limite, mesmo que essa regra seja alterada)',
  'Vagas -> editar vaga -> botao "Gerar resumo agora"',
  'gemini'
),
(
  'gerar_imagem_vaga',
  'Gerar Imagem de Vaga',
  'Cria as 2 opcoes de imagem padrao pra divulgar a vaga nas redes sociais',
  'Crie uma foto realista e profissional (não é ilustração nem desenho vetorial) para post de vaga de emprego da revenda de veículos Carro e Cia. Mostre duas pessoas reais, uma mulher e um homem, ambos com vestimenta profissional (camisa social ou blazer), em pé lado a lado, com expressão confiante e simpática, num ambiente de concessionária de veículos (loja ou com um carro desfocado ao fundo). Mantenha a identidade visual da marca (vermelho, branco, preto) no restante da composição, estilo corporativo e moderno.',
  'Crie uma foto realista e profissional (não é ilustração nem desenho vetorial) para post de vaga de emprego da revenda de veículos Carro e Cia. Mostre duas pessoas reais, uma mulher e um homem, ambos com vestimenta profissional (camisa social ou blazer), em pé lado a lado, com expressão confiante e simpática, num ambiente de concessionária de veículos (loja ou com um carro desfocado ao fundo). Mantenha a identidade visual da marca (vermelho, branco, preto) no restante da composição, estilo corporativo e moderno.',
  'Regras de seguranca de marca (protegidas, nao remover): incluir sempre um cartao/faixa de fundo BRANCO (nunca preto/escuro) numa das bordas -- e SOMENTE nesse cartao branco que a logomarca oficial (anexada como referencia real) aparece, reproduzida fielmente, sem inventar logo novo. Nesse cartao, escrever "ESTAMOS CONTRATANDO" e, maior e em negrito, o nome do cargo (inserido automaticamente). A fachada real da loja (segunda imagem anexada) e usada so como referencia de ambientacao. Gera sempre 2 opcoes por chamada. Modelo: gpt-image-2, tamanho 1024x1024.',
  'Vagas -> Nova Vaga -> botao "Gerar imagem"',
  'openai'
),
(
  'gerar_imagem_generica',
  'Gerar Imagem de Veiculo ou Artigo de Blog',
  'Gera uma imagem a partir de um tema digitado na hora (editor de fotos do veiculo e editor de artigo do blog usam o mesmo botao/funcao)',
  'Gere uma foto profissional para o blog/site da loja de carros, com o tema descrito pelo usuário no momento. Estilo realista, editorial.',
  'Gere uma foto profissional para o blog/site da loja de carros, com o tema descrito pelo usuário no momento. Estilo realista, editorial.',
  'Nunca inclua texto dentro da imagem. O tema/assunto da foto e digitado por quem esta usando, a cada chamada -- nao e fixo. Modelo: gpt-image-2, tamanho 1024x1024, 1 imagem por chamada.',
  'Estoque -> editor de fotos do veiculo  |  Conteudo -> editor de artigo do blog (mesmo botao/codigo nos 2 lugares)',
  'openai'
);
