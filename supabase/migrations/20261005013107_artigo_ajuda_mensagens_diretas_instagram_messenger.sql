-- Artigo novo: mensagens diretas do Instagram e do Messenger chegando ao CRM (04/10/2026). Não duplica se rodar de novo.
INSERT INTO public.ajuda_conteudos (titulo, setor_id, categoria, caminho, o_que_e, para_que_serve, quando_utilizar, como_utilizar, dependencias)
SELECT
  'Mensagens diretas do Instagram e do Messenger no CRM',
  '42cc009b-1f94-4bf1-bd2e-8b486f4c11fa'::uuid,
  'Marketing',
  'Menu lateral → Leads (/admin/leads) e Conversas (/admin/conversas)',
  'Quando um cliente escreve no direct do Instagram ou no Messenger da página do Facebook, o sistema cria um lead no CRM e guarda a conversa. Você também recebe um aviso no WhatsApp.',
  'Não perder quem chama pelo direct ou pelo Messenger. Antes de 04/10/2026 essas mensagens chegavam ao sistema mas eram descartadas, então não virava lead.',
  'Sempre que aparecer um lead com origem "instagram_dm" ou "facebook_dm", ou quando chegar o aviso "Nova mensagem direta" no WhatsApp.',
  E'1. Abra o menu Leads e procure o lead com origem "instagram_dm" (Instagram) ou "facebook_dm" (Messenger). O nome vem do perfil de quem escreveu; se a Meta não informar, aparece "Cliente Instagram (direct)".\n2. Abra o lead e veja a conversa em Conversas: cada mensagem do cliente fica registrada. Foto, vídeo ou áudio aparecem como "[enviou: foto]" e resposta a story aparece como "[Respondeu ao story]".\n3. IMPORTANTE: neste canal NÃO há resposta automática (a Clara ainda não atende Instagram nem Messenger). Responda pelo app do Instagram ou pelo Facebook. As respostas feitas por vocês no app não aparecem no CRM.\n4. Cada mensagem nova do cliente gera um aviso no WhatsApp. O aviso usa texto livre, e a Meta só entrega se você tiver falado com o número da empresa nas últimas 24 horas; se não chegar, o lead aparece do mesmo jeito no CRM.\n5. Os comentários nos posts continuam em Central Social → Comentários.',
  'O app da Meta precisa estar inscrito em mensagens do Instagram e da página (hoje o Instagram já está; o Messenger do Facebook não mostrou nenhuma mensagem nos últimos 30 dias e precisa ser conferido). O nome do cliente depende da permissão do token da Meta.'
WHERE NOT EXISTS (SELECT 1 FROM public.ajuda_conteudos WHERE titulo = 'Mensagens diretas do Instagram e do Messenger no CRM');
