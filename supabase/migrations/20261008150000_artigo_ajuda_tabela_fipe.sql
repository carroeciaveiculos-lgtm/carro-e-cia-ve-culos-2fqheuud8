-- Artigo novo: página pública Tabela FIPE (consulta de valor por marca, modelo e ano). 08/10/2026. Não duplica se rodar de novo.
INSERT INTO public.ajuda_conteudos (titulo, setor_id, categoria, caminho, o_que_e, para_que_serve, quando_utilizar, como_utilizar, dependencias)
SELECT
  'Consultar a Tabela FIPE (página pública do site)',
  '42cc009b-1f94-4bf1-bd2e-8b486f4c11fa'::uuid,
  'Marketing',
  'Site público → menu "Nossos Serviços" → Tabela FIPE (/tabela-fipe)',
  'Uma página do site em que qualquer pessoa, da equipe ou cliente, escolhe marca, modelo e ano de um carro e vê o valor da Tabela FIPE do mês mais recente, com o código FIPE, o combustível e a variação contra o mês anterior. Os dados vêm direto da API gratuita da FIPE (fipe.parallelum.com.br), consultada pelo navegador de quem está usando a página. Nada é gravado no nosso banco.',
  'Dar ao cliente uma referência de preço do carro dele e levá-lo à conversa de avaliação, e dar à equipe uma consulta rápida de FIPE sem sair do site.',
  'Quando o cliente perguntar quanto vale o carro, ao preparar uma avaliação ou ao conferir o preço de um veículo do estoque.',
  E'1. Abra o site e vá em "Nossos Serviços" → "Tabela FIPE" (ou acesse /tabela-fipe).\n2. Escolha a Marca. Em Modelo, se a lista for grande, digite parte do nome no campo de busca (ex.: "Onix") e então escolha o modelo.\n3. Escolha o Ano. O valor aparece na hora, com mês de referência, código FIPE e a variação contra o mês anterior.\n4. Para o cliente: o botão "Quero uma avaliação gratuita" abre o WhatsApp da Clara já com o carro consultado na mensagem.\n5. Se aparecer um aviso de erro ("Muitas consultas seguidas" ou "Não conseguimos consultar"), espere alguns minutos e tente de novo: a API gratuita tem limite de consultas por dia para cada visitante.\nObservações: o valor FIPE é referência de mercado, não é o preço de venda. A FIPE publica uma tabela nova por mês, e a página sempre abre no mês mais recente disponível. Só carros (motos e caminhões não estão nesta página).',
  'Internet do visitante e a API pública da FIPE no ar. Não depende de nenhuma configuração do painel.'
WHERE NOT EXISTS (
  SELECT 1 FROM public.ajuda_conteudos WHERE titulo = 'Consultar a Tabela FIPE (página pública do site)'
);
