-- Corrige achado da autocritica: o formato_resposta ia inteiro pro prompt
-- de geracao de imagem (texto enviado a IA), incluindo meta-informacao
-- tecnica ("Modelo: gpt-image-2, tamanho 1024x1024", "Gera sempre 2
-- opcoes") que nao faz sentido como instrucao visual -- isso ja e
-- garantido por parametro de codigo (form.append/size/n), nao precisa
-- estar no texto enviado ao modelo de imagem.
UPDATE ai_prompts_config
SET formato_resposta = 'Regras de segurança de marca (protegidas, não remover): incluir sempre um cartão/faixa de fundo BRANCO (nunca preto/escuro) numa das bordas — é SOMENTE nesse cartão branco que a logomarca oficial (anexada como referência real) aparece, reproduzida fielmente, sem inventar logo novo. Nesse cartão, escrever "ESTAMOS CONTRATANDO" e, maior e em negrito, o nome do cargo (inserido automaticamente). A fachada real da loja (segunda imagem anexada) é usada só como referência de ambientação.'
WHERE slug = 'gerar_imagem_vaga';

UPDATE ai_prompts_config
SET formato_resposta = 'Nunca inclua texto dentro da imagem. O tema/assunto da foto é digitado por quem está usando, a cada chamada — não é fixo.'
WHERE slug = 'gerar_imagem_generica';
