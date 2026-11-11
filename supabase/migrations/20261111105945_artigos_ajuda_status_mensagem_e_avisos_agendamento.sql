-- Central de Ajuda (11/11/2026): 2 artigos novos. Pode rodar de novo sem duplicar.
-- 1) Entender os ✓ e os avisos de falha no Conversador (PR #24)
-- 2) Receber o aviso de novo agendamento (WhatsApp, e-mail e sino do painel)

INSERT INTO public.ajuda_conteudos (titulo, setor_id, categoria, caminho, o_que_e, para_que_serve, quando_utilizar, como_utilizar, dependencias)
SELECT
  'Entender os ✓ e os avisos de falha no Conversador',
  '37b8d5ed-232c-425d-a80e-07b714c473a2'::uuid,
  'Conversas',
  'Menu lateral → Vendas → Conversador (/admin/conversas) e a conversa dentro de Leads (/admin/leads)',
  $t$Pequenos sinais embaixo de cada mensagem que a Clara ou a equipe enviou pelo WhatsApp, mostrando o que aconteceu com ela depois de enviada: ✓ cinza (enviada), ✓✓ cinza (entregue no celular do cliente), ✓✓ azul (lida pelo cliente) e um aviso vermelho "Não entregue" com o motivo quando falha. Quando o cliente reage com um emoji (por exemplo 👍), a reação aparece embaixo da mensagem.$t$,
  $t$Saber se o cliente recebeu e leu o que foi enviado, e perceber na hora quando uma mensagem não saiu, em vez de descobrir só quando o cliente reclama. Vale para mensagens da Clara, da equipe e para os templates automáticos (reengajamento, lembrete de visita, oferta de reagendamento).$t$,
  $t$Sempre que enviar algo ao cliente e quiser conferir se chegou, ou quando um cliente disser que não recebeu uma mensagem.$t$,
  $t$1. Abra a conversa do cliente. As mensagens novas aparecem sozinhas, sem precisar sair e voltar: a tela se atualiza ao vivo e, por segurança, também se recarrega a cada 10 segundos.
2. Olhe o canto de cada mensagem enviada, ao lado da hora: ✓ cinza = a Meta aceitou, ainda sem confirmação de entrega; ✓✓ cinza = entregue no celular do cliente; ✓✓ azul = o cliente abriu e leu. Passe o mouse sobre o ícone para ver o texto.
3. Se aparecer a caixa vermelha "Não entregue", leia o motivo. Os mais comuns: pagamento pendente na conta do WhatsApp Business na Meta (código 131042), que é regularizado no Gerenciador de Negócios; e mensagem fora da janela de 24 horas (código 131047), que só aceita template aprovado, não texto livre.
4. Se você digitar um texto e o envio falhar, aparece o aviso vermelho "Mensagem NÃO enviada" com o motivo, e o texto continua na caixa para você tentar de novo ou copiar.
5. A reação do cliente aparece como um emoji pequeno embaixo da mensagem a que ele reagiu. Ela não conta como mensagem nova e não aciona a Clara.
Observações: mensagens antigas, de antes de 10/11/2026, ficam sem ícone de propósito, porque não dá para afirmar "entregue" sem confirmação. O ✓ cinza não é garantia de entrega. Responder por texto livre pelo painel desliga a Clara para aquele lead (os templates, fotos e documentos não desligam); o interruptor "Assistente Clara (IA)" no painel do lead liga de novo. Escrito pela leitura do código e dos avisos reais da Meta; ainda sem teste logado completo.$t$,
  $t$Setor Vendas. Conta do WhatsApp Business ativa e com o pagamento em dia na Meta. Os avisos de entrega dependem do webhook da Meta apontado para a função receive-leads.$t$
WHERE NOT EXISTS (
  SELECT 1 FROM public.ajuda_conteudos WHERE titulo = 'Entender os ✓ e os avisos de falha no Conversador'
);

INSERT INTO public.ajuda_conteudos (titulo, setor_id, categoria, caminho, o_que_e, para_que_serve, quando_utilizar, como_utilizar, dependencias)
SELECT
  'Receber o aviso de novo agendamento (WhatsApp, e-mail e sino do painel)',
  '37b8d5ed-232c-425d-a80e-07b714c473a2'::uuid,
  'Agendamentos',
  'Sino de notificações no topo do painel (qualquer tela de /admin) e Menu lateral → Vendas → Agendamentos (/admin/agendamentos)',
  $t$O aviso automático que a equipe recebe quando a Clara fecha uma visita ou avaliação com um cliente (e também quando ela passa um atendimento para um humano). Chega por três caminhos ao mesmo tempo: mensagem no WhatsApp, e-mail e o sino no topo do painel (com aviso opcional no canto da tela do computador).$t$,
  $t$Ninguém precisar abrir o Conversador para descobrir que há uma visita marcada. O aviso traz o nome do cliente, o telefone, se é visita ou avaliação, o veículo (quando houver) e o dia e a hora.$t$,
  $t$Ao usar o painel no dia a dia e ao configurar quem deve ser avisado.$t$,
  $t$1. Sino do painel: no topo, ao lado do seu e-mail, fica o ícone de sino. O número vermelho mostra quantos avisos não lidos existem. Clique para ver a lista: 📅 é novo agendamento e 🙋 é atendimento passado para humano. Passe o mouse sobre um aviso e clique no ✓ para marcá-lo como lido, ou use "Marcar todas".
2. Aviso no canto da tela do computador: abra o sino e, se aparecer a faixa amarela "Receba os avisos também no canto da tela do computador", clique em "Ativar" e depois em "Permitir" na janela do navegador. Só aparece com o painel aberto em alguma aba. Se o navegador tiver bloqueado, libere as notificações deste site nas configurações dele.
3. WhatsApp: o aviso vai para o número da loja configurado em Redes Sociais e para o celular da Adriana (uma vez só se forem o mesmo número). Quando o template "aviso_novo_agendamento" estiver aprovado pela Meta, ele chega a qualquer hora. Enquanto não estiver aprovado, o aviso sai em texto livre, que o WhatsApp só entrega se a pessoa tiver escrito para o número da Clara nas últimas 24 horas.
4. E-mail: o mesmo aviso é enviado para pedro.cardoso@carroeciamotors.com.br, com o remetente vendas@carroeciamotors.com.br.
5. Se o cliente já tinha uma visita no mesmo horário, a Clara não cria outra nem avisa de novo.
Observações: para entrar na lista de e-mails ou trocar quem recebe, fale com o setor de Desenvolvimento e TI, porque hoje a lista fica no código da função ai-sdr. Quem ainda não tem usuário no CRM não vê o sino, mas recebe o e-mail. Escrito pela leitura do código; ainda sem teste logado completo.$t$,
  $t$Setor Vendas. Para o sino: usuário logado no painel. Para o WhatsApp: template aviso_novo_agendamento aprovado na Meta (senão cai no texto livre). Para o e-mail: chave do Resend configurada nas funções.$t$
WHERE NOT EXISTS (
  SELECT 1 FROM public.ajuda_conteudos WHERE titulo = 'Receber o aviso de novo agendamento (WhatsApp, e-mail e sino do painel)'
);
