DO $$
BEGIN

  -- Artigo: Seguro Auto Vale a Pena?
  INSERT INTO public.blog_posts (slug, title, category, meta_description, content, image_url, published) 
  VALUES (
    'seguro-auto-vale-a-pena',
    'Seguro Auto Vale a Pena? Análise Honesta para Decidir em 2026',
    'Seguros',
    'Seguro auto realmente vale a pena? Análise honesta 2026. Descubra quando o seguro é essencial, quando é desperdício, custos reais e como economizar.',
    '<p>Você está pagando caro demais em seguro auto? Neste artigo, você vai descobrir exatamente quando o seguro vale a pena, quando é desperdício de dinheiro e como economizar até 40% sem perder cobertura essencial. Análise honesta com dados reais de 2026.</p>

    <h2>Quando o seguro auto definitivamente vale a pena?</h2>
    <p>Seguro auto é essencial para proteger sua família e patrimônio. Carros novos e financiados sempre precisam de cobertura.</p>

    <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 20px 0;">
      <h3 style="margin-top: 0;">💡 PRO TIP: DPVAT é Obrigatório</h3>
      <p>Seguro DPVAT é obrigatório por lei para TODOS os veículos. Não confunda com seguro completo (RCF-DC). Ambos têm funções diferentes.</p>
    </div>

    <img src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/modelo-veiculo.webp" alt="Carro protegido por seguro auto - proteção de patrimônio" loading="lazy" width="1200" height="675" style="border-radius: 8px; margin: 20px 0; width: 100%; height: auto;" />

    <h2>A parceria Carro e Cia + Km Zero</h2>
    <p>Gabriel é especialista em seguros automotivos na Km Zero Corretora de Seguros e Consórcios com mais de 10 anos de experiência. Ele vai analisar seu caso e oferecer a melhor cobertura com preço justo.</p>

    <img src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/parceiros/Logo-km-zero-fundo-transparente.webp" alt="Logo Km Zero Seguros e Consórcios - especialista em seguros automotivos" loading="lazy" width="300" height="300" style="border-radius: 8px; margin: 20px auto; display: block;" />

    <div style="background-color: #fefce8; padding: 15px; border-radius: 8px; border-left: 4px solid #eab308; margin: 20px 0;">
      <h3 style="margin-top: 0;">⚠️ ATENÇÃO: Carro Financiado</h3>
      <p>Seu banco vai EXIGIR seguro completo se você financiar o carro. Não é opcional. Planeje isso no orçamento total do financiamento.</p>
    </div>

    <h2>Perguntas Frequentes (FAQ)</h2>
    <div itemscope itemtype="https://schema.org/FAQPage">
      <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
        <h3 itemprop="name">Seguro auto é obrigatório por lei?</h3>
        <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
          <p itemprop="text">Apenas o DPVAT é obrigatório, mas o seguro compreensivo é altamente recomendado.</p>
        </div>
      </div>
      <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
        <h3 itemprop="name">Carro financiado precisa de seguro auto?</h3>
        <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
          <p itemprop="text">Sim, as instituições financeiras exigem seguro completo para liberar o financiamento.</p>
        </div>
      </div>
      <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
        <h3 itemprop="name">Qual é o valor médio do seguro auto em Uberaba em 2026?</h3>
        <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
          <p itemprop="text">O valor médio de um seguro auto em Uberaba varia de R$ 1.500 a R$ 3.500/ano dependendo do veículo e perfil.</p>
        </div>
      </div>
    </div>',
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/modelo-veiculo.webp',
    true
  ) ON CONFLICT (slug) DO UPDATE SET 
    title = EXCLUDED.title, meta_description = EXCLUDED.meta_description, content = EXCLUDED.content, image_url = EXCLUDED.image_url;


  -- Artigo: Consignação de Veículos: Venda Segura
  INSERT INTO public.blog_posts (slug, title, category, meta_description, content, image_url, published) 
  VALUES (
    'consignacao-de-veiculos-venda-segura',
    'Consignação de Veículos: Venda Segura e Descomplicada',
    'Venda',
    'Consignação segura de veículos em Uberaba. Venda seu carro sem medo de golpe. Processo transparente, contrato protetor, 20+ anos de confiança.',
    '<p>Tem um carro para vender e está com medo? Consignação é a solução segura que você procura. Descubra como funciona, por que confiar na Carro e Cia e como vender seu carro em dias.</p>

    <h2>Processo de Consignação</h2>
    <img src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/fachada-da-loja.webp" alt="Fachada Carro e Cia Veículos - local confiável para consignar" loading="lazy" width="1200" height="675" style="border-radius: 8px; margin: 20px 0; width: 100%; height: auto;" />
    
    <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 20px 0;">
      <h3 style="margin-top: 0;">✅ Segurança Total</h3>
      <p>Contrato de consignação protege você e a loja. Transparência em cada etapa da venda.</p>
    </div>

    <div style="background-color: #fefce8; padding: 15px; border-radius: 8px; border-left: 4px solid #eab308; margin: 20px 0;">
      <h3 style="margin-top: 0;">⚡ Venda Rápida</h3>
      <p>Muitos clientes buscam carros na Carro e Cia diariamente. Vendemos seu carro de forma muito mais rápida que em anúncios particulares.</p>
    </div>

    <img src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/modelo-veiculo.webp" alt="Veículo modelo consignado na Carro e Cia" loading="lazy" width="1200" height="675" style="border-radius: 8px; margin: 20px 0; width: 100%; height: auto;" />

    <h2>Perguntas Frequentes (FAQ)</h2>
    <div itemscope itemtype="https://schema.org/FAQPage">
      <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
        <h3 itemprop="name">O que é consignação de veículo?</h3>
        <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
          <p itemprop="text">É deixar seu carro em uma loja de confiança, que fica responsável por encontrar um comprador e cuidar de toda a burocracia da venda.</p>
        </div>
      </div>
      <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
        <h3 itemprop="name">Meu carro fica seguro na loja?</h3>
        <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
          <p itemprop="text">Sim, na Carro e Cia seu carro fica em um ambiente seguro, sob contrato e protegido contra qualquer imprevisto.</p>
        </div>
      </div>
    </div>',
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/consignacao.webp',
    true
  ) ON CONFLICT (slug) DO UPDATE SET 
    title = EXCLUDED.title, meta_description = EXCLUDED.meta_description, content = EXCLUDED.content, image_url = EXCLUDED.image_url;


  -- Artigo: Como Simular Financiamento
  INSERT INTO public.blog_posts (slug, title, category, meta_description, content, image_url, published) 
  VALUES (
    'como-simular-financiamento',
    'Como Simular Financiamento de Veículo em 2026',
    'Financiamento',
    'Simule seu financiamento de carro online. Ferramenta gratuita Km Zero. Descubra taxa, parcela e escolha a melhor opção em minutos.',
    '<p>Quer saber quanto você vai pagar no financiamento? Use nosso simulador online gratuito. Em 2 minutos você descobre a taxa real e a parcela mensal.</p>

    <h2>Como usar o simulador online</h2>
    <img src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/parceiros/Logo-km-zero-fundo-transparente.webp" alt="Simulador Km Zero Seguros - ferramenta online gratuita" loading="lazy" width="300" height="300" style="margin: 20px auto; display: block;" />
    <p>Basta inserir o valor do veículo, a entrada desejada e o prazo para obter os resultados imediatos.</p>
    
    <h2>Perguntas Frequentes (FAQ)</h2>
    <div itemscope itemtype="https://schema.org/FAQPage">
      <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
        <h3 itemprop="name">A simulação é precisa?</h3>
        <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
          <p itemprop="text">Sim, nossa simulação reflete as taxas praticadas pelo mercado atual. No entanto, a taxa final depende da análise de crédito.</p>
        </div>
      </div>
    </div>',
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/modelo-veiculo.webp',
    true
  ) ON CONFLICT (slug) DO UPDATE SET 
    title = EXCLUDED.title, meta_description = EXCLUDED.meta_description, content = EXCLUDED.content, image_url = EXCLUDED.image_url;


  -- Artigo: Tabela FIPE Explicada
  INSERT INTO public.blog_posts (slug, title, category, meta_description, content, image_url, published) 
  VALUES (
    'tabela-fipe-explicada',
    'Quanto Vale Meu Carro? Tabela FIPE Explicada',
    'Avaliação',
    'Quanto vale seu carro? Tabela FIPE explicada. Descubra como consultar, interpretar valores e vender seu veículo pelo preço justo em Uberaba.',
    '<p>Não sabe quanto seu carro vale? A Tabela FIPE é referência oficial no Brasil. Descubra como consultar, entender valores e negociar melhor.</p>

    <h2>Entendendo os Valores</h2>
    <p>A FIPE expressa o valor médio praticado no mercado nacional, mas o estado de conservação do carro pode afetar para mais ou para menos o valor real de venda.</p>
    
    <h2>Perguntas Frequentes (FAQ)</h2>
    <div itemscope itemtype="https://schema.org/FAQPage">
      <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
        <h3 itemprop="name">Por que o preço real é diferente da FIPE?</h3>
        <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
          <p itemprop="text">O mercado regional, a cor, estado de conservação e opcionais alteram o preço final do carro em relação à média nacional da FIPE.</p>
        </div>
      </div>
    </div>',
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/modelo-veiculo.webp',
    true
  ) ON CONFLICT (slug) DO UPDATE SET 
    title = EXCLUDED.title, meta_description = EXCLUDED.meta_description, content = EXCLUDED.content, image_url = EXCLUDED.image_url;


  -- Artigo: Comprar Carro Usado em Uberaba
  INSERT INTO public.blog_posts (slug, title, category, meta_description, content, image_url, published) 
  VALUES (
    'comprar-carro-usado-em-uberaba',
    'Comprar Carro Usado em Uberaba: Guia Seguro 2026',
    'Compra',
    'Guia para comprar carro usado seguro em Uberaba. Dicas, checklist de inspeção, como não cair em golpe e conseguir melhor preço. Carro e Cia.',
    '<p>Quer comprar carro usado em Uberaba? Descubra como evitar golpes, inspecionar o veículo corretamente e negociar o melhor preço. Guia completo 2026.</p>

    <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0;">
      <h3 style="margin-top: 0;">🚨 CUIDADO: Verifique RENAVAM e CHASSI</h3>
      <p>Sempre verificar RENAVAM e CHASSI antes de comprar. Nunca pague sinais antecipados sem ver o carro ou para contas em nomes de terceiros não relacionados à loja.</p>
    </div>

    <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 20px 0;">
      <h3 style="margin-top: 0;">✅ CONFIANÇA: Lojas Estabelecidas</h3>
      <p>Compre em lugar estabelecido com reputação sólida, como a Carro e Cia, que oferece procedência garantida e nota fiscal.</p>
    </div>

    <img src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/fachada-da-loja.webp" alt="Loja Carro e Cia - local confiável para comprar carro usado" loading="lazy" width="1200" height="675" style="border-radius: 8px; margin: 20px 0; width: 100%; height: auto;" />
    ',
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/consignacao.webp',
    true
  ) ON CONFLICT (slug) DO UPDATE SET 
    title = EXCLUDED.title, meta_description = EXCLUDED.meta_description, content = EXCLUDED.content, image_url = EXCLUDED.image_url;


  -- Artigo: Documentação Necessária
  INSERT INTO public.blog_posts (slug, title, category, meta_description, content, image_url, published) 
  VALUES (
    'documentacao-necessaria-para-vender-carro',
    'Documentação Necessária para Vender Carro: Checklist Completo',
    'Venda',
    'Documentação necessária para vender carro. Checklist completo com todos os documentos, originals e cópias. Venda segura e sem problemas.',
    '<p>Quer vender seu carro mas não sabe qual documentação precisa? Aqui está o checklist completo: originals, cópias, o que levar para a loja. Sem surpresas.</p>

    <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 20px 0;">
      <h3 style="margin-top: 0;">✅ CHECKLIST DE DOCUMENTOS</h3>
      <p>Você precisa de: RG + CPF (ou CNH atualizada), CRLV atualizado, Documento de Propriedade em seu nome (ou recibo), Certificado de Registro e comprovante de endereço.</p>
    </div>

    <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0;">
      <h3 style="margin-top: 0;">🚨 IMPORTANTE: Originais e Cópias</h3>
      <p>Sempre levar originais e cópias. A loja verificará toda a documentação na hora para agilizar o processo de venda ou consignação.</p>
    </div>

    <img src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/fachada-da-loja.webp" alt="Carro e Cia Veículos - local profissional para vender com segurança" loading="lazy" width="1200" height="675" style="border-radius: 8px; margin: 20px 0; width: 100%; height: auto;" />
    ',
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/modelo-veiculo.webp',
    true
  ) ON CONFLICT (slug) DO UPDATE SET 
    title = EXCLUDED.title, meta_description = EXCLUDED.meta_description, content = EXCLUDED.content, image_url = EXCLUDED.image_url;


  -- Artigo Consolidado: Como Vender Seu Carro Rápido
  INSERT INTO public.blog_posts (slug, title, category, meta_description, content, image_url, published) 
  VALUES (
    'como-vender-seu-carro-rapido',
    'Como Vender Seu Carro Rápido: 7 Estratégias + Consignação',
    'Venda',
    'Como vender seu carro rápido em Uberaba. 7 estratégias + consignação. Venda em dias ao invés de meses. Guia completo Carro e Cia.',
    '<p>Cansado de deixar seu carro na rua, esperando aparecer comprador? Descubra 7 estratégias para vender rápido ou consigne com a Carro e Cia. Venda em dias.</p>

    <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 20px 0;">
      <h3 style="margin-top: 0;">⚡ CONSIGNAÇÃO: Venda em dias</h3>
      <p>Múltiplas plataformas + clientes na loja. A Carro e Cia usa sua força de marketing para encontrar o comprador rapidamente.</p>
    </div>

    <div style="background-color: #fefce8; padding: 15px; border-radius: 8px; border-left: 4px solid #eab308; margin: 20px 0;">
      <h3 style="margin-top: 0;">💡 DICA: Qualidade Importa</h3>
      <p>Foto de qualidade + descrição honesta = venda 30% mais rápida. Nossa loja prepara o veículo para que ele pareça irresistível nas fotos.</p>
    </div>

    <img src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/fachada-da-loja.webp" alt="Loja Carro e Cia bem localizada em avenida estratégica" loading="lazy" width="1200" height="675" style="border-radius: 8px; margin: 20px 0; width: 100%; height: auto;" />
    ',
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/consignacao.webp',
    true
  ) ON CONFLICT (slug) DO UPDATE SET 
    title = EXCLUDED.title, meta_description = EXCLUDED.meta_description, content = EXCLUDED.content, image_url = EXCLUDED.image_url;


  -- Artigo: O Que é Consignação
  INSERT INTO public.blog_posts (slug, title, category, meta_description, content, image_url, published) 
  VALUES (
    'o-que-e-consignacao-de-veiculo',
    'O Que é Consignação de Veículo e Como Funciona',
    'Venda',
    'O que é consignação de veículo? Entenda como funciona, diferenças com venda particular e por que consignar com a Carro e Cia.',
    '<p>Ouviu falar em consignação mas não sabe como funciona? Aqui explicamos tudo: o que é, como funciona, contrato, quanto custa. Simples e direto.</p>

    <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 20px 0;">
      <h3 style="margin-top: 0;">✅ SEGURANÇA NA TRANSAÇÃO</h3>
      <p>O contrato de consignação protege tanto você quanto a loja. Suas garantias estão documentadas legalmente.</p>
    </div>

    <div style="background-color: #fefce8; padding: 15px; border-radius: 8px; border-left: 4px solid #eab308; margin: 20px 0;">
      <h3 style="margin-top: 0;">🤝 CONFIANÇA: 20+ anos de mercado</h3>
      <p>Escolha lojas que sejam referência em sua cidade. A Carro e Cia atua há mais de 20 anos em Uberaba, garantindo total transparência.</p>
    </div>

    <img src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/consignacao.webp" alt="Processo de consignação passo a passo" loading="lazy" width="1200" height="675" style="border-radius: 8px; margin: 20px 0; width: 100%; height: auto;" />
    ',
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/consignacao-1x1.webp',
    true
  ) ON CONFLICT (slug) DO UPDATE SET 
    title = EXCLUDED.title, meta_description = EXCLUDED.meta_description, content = EXCLUDED.content, image_url = EXCLUDED.image_url;


  -- Artigo: Avaliar Meu Veículo
  INSERT INTO public.blog_posts (slug, title, category, meta_description, content, image_url, published) 
  VALUES (
    'como-avaliar-meu-veiculo-para-venda',
    'Como Avaliar Meu Veículo Para Venda: Checklist',
    'Avaliação',
    'Como avaliar seu veículo antes de vender. Checklist completo. Carro e Cia faz avaliação gratuita em Uberaba.',
    '<p>Quer saber quanto seu carro vale? Aprenda a avaliar você mesmo ou deixe nossa equipe fazer. Avaliação gratuita Carro e Cia.</p>

    <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 20px 0;">
      <h3 style="margin-top: 0;">✅ TABELA FIPE E MERCADO</h3>
      <p>A avaliação na Carro e Cia é baseada na tabela FIPE, referência oficial brasileira, ajustada para a realidade do mercado local.</p>
    </div>

    <div style="background-color: #fefce8; padding: 15px; border-radius: 8px; border-left: 4px solid #eab308; margin: 20px 0;">
      <h3 style="margin-top: 0;">💯 HONESTIDADE</h3>
      <p>Realizamos a avaliação sem compromisso e sem qualquer pressão para vender. A escolha será sempre sua.</p>
    </div>

    <img src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/modelo-veiculo.webp" alt="Avaliação profissional de veículo para venda" loading="lazy" width="1200" height="675" style="border-radius: 8px; margin: 20px 0; width: 100%; height: auto;" />
    ',
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/modelo-veiculo.webp',
    true
  ) ON CONFLICT (slug) DO UPDATE SET 
    title = EXCLUDED.title, meta_description = EXCLUDED.meta_description, content = EXCLUDED.content, image_url = EXCLUDED.image_url;


  -- Artigo: Carros Seminovos em Uberaba MG
  INSERT INTO public.blog_posts (slug, title, category, meta_description, content, image_url, published) 
  VALUES (
    'carros-seminovos-em-uberaba-mg',
    'Carros Seminovos em Uberaba MG: O Guia Completo',
    'Compra',
    'Carros seminovos em Uberaba MG. Guia completo: como escolher, diferenciar qualidade, melhor preço. Carro e Cia referência 20+ anos.',
    '<p>Procurando carro seminovo em Uberaba? Descubra como escolher qualidade, evitar pegadinhas e conseguir melhor preço. A Carro e Cia tem a solução ideal para você.</p>

    <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 20px 0;">
      <h3 style="margin-top: 0;">✅ VANTAGEM FINANCEIRA</h3>
      <p>Um carro seminovo pode ser até 30% a 40% mais barato que um zero quilômetro, entregando praticamente a mesma qualidade e menos desvalorização inicial.</p>
    </div>

    <div style="background-color: #fefce8; padding: 15px; border-radius: 8px; border-left: 4px solid #eab308; margin: 20px 0;">
      <h3 style="margin-top: 0;">⚠️ CUIDADO: Histórico e Vistoria</h3>
      <p>Sempre verifique o histórico do RENAVAM e exija uma vistoria cautelar. Na Carro e Cia, todo nosso estoque passa por esse rigoroso processo.</p>
    </div>

    <img src="https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/fachada-da-loja.webp" alt="Showroom Carro e Cia - carros seminovos Uberaba MG" loading="lazy" width="1200" height="675" style="border-radius: 8px; margin: 20px 0; width: 100%; height: auto;" />
    ',
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/consignacao.webp',
    true
  ) ON CONFLICT (slug) DO UPDATE SET 
    title = EXCLUDED.title, meta_description = EXCLUDED.meta_description, content = EXCLUDED.content, image_url = EXCLUDED.image_url;

  
  -- Cleanup duplicados e legados conforme instrução
  DELETE FROM public.blog_posts WHERE slug IN (
    'financiamento-carro-cpf-negativado-versao-duplicada',
    'seguro-auto-analise-honesta',
    'consorcio-ou-financiamento-qual-escolher'
  );

END $$;
