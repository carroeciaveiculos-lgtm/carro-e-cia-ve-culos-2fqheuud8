-- Descrição Webmotors por veículo (até 500 caracteres) + frase final única para
-- todas as plataformas + limite de 800 para Mercado Livre/NaPista.
-- Pedido da Adriana em 30/09/2026. Ver docs/webmotors-integracao.md.

-- 1) Coluna nova: texto do carro para a Webmotors (a frase final NÃO fica aqui,
--    é colada pelo código no envio).
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS descricao_webmotors text;
COMMENT ON COLUMN public.veiculos.descricao_webmotors IS
  'Texto do veículo enviado à Webmotors (máx. 500 caracteres junto com a frase final, que o wm-sync acrescenta). Vazio = usa o parágrafo institucional padrão.';

-- 2) Regra nova em ai_prompts_config. O prompt é editável em /admin/prompts-ia;
--    o rodape_fixo guarda a FRASE FINAL usada no fim do anúncio de TODAS as
--    plataformas (Webmotors, Mercado Livre, NaPista).
INSERT INTO public.ai_prompts_config
  (slug, name, description, prompt_text, default_prompt, onde_fica, api_provider, formato_resposta, rodape_fixo)
SELECT
  'vehicle_description_webmotors',
  'Descrição Webmotors (máx. 500)',
  $t$Geração da Descrição Webmotors, limite de 500 caracteres contando a frase final. O campo de texto fixo desta regra é a frase que fecha o anúncio de TODAS as plataformas (Webmotors, Mercado Livre e NaPista).$t$,
  $t$Escreva uma descrição curta e direta do veículo para a Webmotors. Comece pelos destaques do vendedor, depois ano, motor, câmbio e opcionais reais. Frases objetivas, sem adjetivos vazios. NÃO mencione serviços da concessionária, financiamento, informações de contato, preço ou frases como "nossa loja" ou "entre em contato".$t$,
  $t$Escreva uma descrição curta e direta do veículo para a Webmotors. Comece pelos destaques do vendedor, depois ano, motor, câmbio e opcionais reais. Frases objetivas, sem adjetivos vazios. NÃO mencione serviços da concessionária, financiamento, informações de contato, preço ou frases como "nossa loja" ou "entre em contato".$t$,
  $t$Botão "Gerar com IA" no cadastro do veículo (gera a Descrição geral e a Descrição Webmotors juntas)$t$,
  'gemini',
  $t$Retorna um JSON com "texto_html": só o texto do carro, cortado para caber no espaço que sobra depois da frase final. A frase final é colada pelo código e nunca é escrita pela IA.$t$,
  $t$Reservamo-nos o direito de corrigir eventuais erros de digitação; valores sujeitos a alteração sem aviso prévio.$t$
WHERE NOT EXISTS (
  SELECT 1 FROM public.ai_prompts_config WHERE slug = 'vehicle_description_webmotors'
);

-- 3) O parágrafo institucional de 492 caracteres deixa de morar no banco: a
--    frase final passou a ser o rodapé de todas as plataformas. O texto
--    original continua guardado em supabase/functions/_shared/descricao-anuncio.ts
--    (PARAGRAFO_INSTITUCIONAL_LEGADO), usado como texto da Webmotors para
--    veículos sem descrição própria. Para desfazer: copiar o texto de lá de
--    volta para esta coluna.
UPDATE public.ai_prompts_config
SET rodape_fixo = NULL, updated_at = now()
WHERE slug = 'vehicle_description';

-- 4) Gatilho da Webmotors: mudar a descrição Webmotors também reenvia o anúncio.
--    (Mesma função de produção verificada em 30/09/2026 + uma linha nova.)
CREATE OR REPLACE FUNCTION public.trigger_wm_sync_on_veiculo_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  existing_post_id text;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    SELECT post_id INTO existing_post_id
    FROM public.estoque_publicacoes
    WHERE veiculo_id = NEW.id AND platform = 'webmotors'
    ORDER BY created_at DESC LIMIT 1;

    IF (OLD.publicado_webmotors IS DISTINCT FROM true AND NEW.publicado_webmotors = true
        AND existing_post_id IS NULL) THEN
      INSERT INTO public.estoque_publicacoes (veiculo_id, platform, status)
      VALUES (NEW.id, 'webmotors', 'pending_create');

    ELSIF NEW.publicado_webmotors = true AND existing_post_id IS NOT NULL AND (
      OLD.preco_venda IS DISTINCT FROM NEW.preco_venda OR
      OLD.preco_revenda IS DISTINCT FROM NEW.preco_revenda OR
      OLD.quilometragem IS DISTINCT FROM NEW.quilometragem OR
      OLD.descricao IS DISTINCT FROM NEW.descricao OR
      OLD.descricao_webmotors IS DISTINCT FROM NEW.descricao_webmotors OR
      OLD.portas IS DISTINCT FROM NEW.portas OR
      OLD.ano_modelo IS DISTINCT FROM NEW.ano_modelo OR
      OLD.ano_fabricacao IS DISTINCT FROM NEW.ano_fabricacao OR
      OLD.placa IS DISTINCT FROM NEW.placa OR
      OLD.adaptado_deficientes IS DISTINCT FROM NEW.adaptado_deficientes OR
      OLD.alienado IS DISTINCT FROM NEW.alienado OR
      OLD.blindado IS DISTINCT FROM NEW.blindado OR
      OLD.garantia_fabrica IS DISTINCT FROM NEW.garantia_fabrica OR
      OLD.ipva_pago IS DISTINCT FROM NEW.ipva_pago OR
      OLD.revisado_oficina IS DISTINCT FROM NEW.revisado_oficina OR
      OLD.revisoes_concessionaria IS DISTINCT FROM NEW.revisoes_concessionaria OR
      OLD.unico_dono IS DISTINCT FROM NEW.unico_dono OR
      OLD.licenciado IS DISTINCT FROM NEW.licenciado OR
      OLD.diferenciais IS DISTINCT FROM NEW.diferenciais
    ) THEN
      INSERT INTO public.estoque_publicacoes (veiculo_id, platform, status, post_id)
      VALUES (NEW.id, 'webmotors', 'pending_update', existing_post_id);

    ELSIF (OLD.publicado_webmotors = true AND NEW.publicado_webmotors IS DISTINCT FROM true) THEN
      IF existing_post_id IS NOT NULL THEN
        INSERT INTO public.estoque_publicacoes (veiculo_id, platform, status, post_id)
        VALUES (NEW.id, 'webmotors', 'pending_close', existing_post_id);
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 5) Artigo da Central de Ajuda (regra do projeto: toda função nova no painel
--    ganha artigo). Mesmo setor do artigo de "Confirmar mapeamento de catálogo".
INSERT INTO public.ajuda_conteudos
  (categoria, titulo, o_que_e, para_que_serve, caminho, quando_utilizar, como_utilizar, is_faq, setor_id, grupo)
VALUES (
  'Estoque',
  'Descrição do veículo: geral e Webmotors',
  $t$No cadastro do veículo, o campo de descrição agora tem dois textos lado a lado: a Descrição geral (usada no site, no Mercado Livre e no NaPista, até 800 caracteres) e a Descrição Webmotors (até 500 caracteres). Os dois terminam com a mesma frase fixa: "Reservamo-nos o direito de corrigir eventuais erros de digitação; valores sujeitos a alteração sem aviso prévio."$t$,
  $t$A Webmotors esconde a descrição inteira quando passa de 500 caracteres, e o Mercado Livre e o NaPista ficam melhores com texto de até 800. Com dois campos, cada plataforma recebe um texto do tamanho certo, sem cortes no meio da palavra. A frase final é colocada pelo sistema, então ninguém precisa digitar nem corre o risco de apagar.$t$,
  '/admin/estoque (editar veículo, aba Geral & Valores, campo Observações / Descrição)',
  $t$Ao cadastrar um veículo novo, ao mudar os destaques do carro, ou quando quiser refazer o texto dos anúncios.$t$,
  $t$1. Abra o veículo em Estoque e vá na aba "Geral & Valores".
2. No campo "Notas / Destaques (para IA)", escreva o que valoriza o carro (ex.: pneus novos, único dono, laudo cautelar aprovado). A IA lê esse campo e usa os destaques com prioridade.
3. Escolha o tom e clique em "Gerar com IA": uma só vez gera os dois textos.
4. Confira os dois textos. O contador de cada um mostra quantos caracteres já usou (800 na geral, 500 na Webmotors já contando a frase final, que aparece em cinza embaixo e não pode ser editada ali).
5. Pode editar qualquer texto à mão. Se passar do limite, o contador fica vermelho e o texto é encurtado no envio, sempre preservando a frase final.
6. Salve o veículo. Se ele já estiver publicado na Webmotors, a atualização é enviada em até 10 minutos.
7. Se a Descrição Webmotors ficar vazia, a Webmotors usa o parágrafo institucional padrão da loja.
8. Para mudar a frase final, vá em Regras de IA (/admin/prompts-ia), regra "Descrição Webmotors", e edite o campo "Frase final".$t$,
  false,
  '308efc6e-5db3-4cc9-83e3-e39ecdccd5e1',
  'operacional'
);
