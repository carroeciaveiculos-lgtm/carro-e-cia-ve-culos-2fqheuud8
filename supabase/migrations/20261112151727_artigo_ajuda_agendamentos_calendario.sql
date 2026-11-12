-- Central de Ajuda: atualiza o artigo de Agendamentos para a tela nova (calendario do mes, janela do dia, filtros, "Ir para a conversa").
update public.ajuda_conteudos
set
  o_que_e = $t$Calendário do mês e lista com todas as visitas e avaliações de veículo marcadas com clientes. A maioria é marcada pela Clara (a atendente de IA) durante a conversa no WhatsApp. Cada dia do calendário mostra o número de agendamentos daquele dia, por exemplo "( 3 )".$t$,
  para_que_serve = $t$Saber quem vem à loja e quando. Registrar se o cliente compareceu, para o funil de vendas refletir a realidade e o cliente que faltou receber uma mensagem para reagendar. Nenhum agendamento é apagado: o que foi cancelado ou não veio continua guardado, para os relatórios de visitas marcadas x vieram x não vieram.$t$,
  quando_utilizar = $t$1) Toda manhã, para ver as visitas do dia. 2) Depois de cada visita, para marcar o resultado. 3) Quando o cliente avisar que não vem. 4) Para conferir quantas visitas foram marcadas em um dia ou mês que já passou.$t$,
  como_utilizar = $t$1. Abra "Agendamentos" no menu.
2. No calendário, cada dia mostra entre parênteses quantos agendamentos existem nele, por exemplo "( 3 )". O número conta TUDO o que foi marcado para o dia, inclusive cancelado e "não veio". Dia sem número não tem agendamento.
3. Use as setas ao lado do nome do mês para ir ao mês anterior ou ao próximo. O botão "Hoje" volta para o mês atual. O dia de hoje aparece destacado.
4. Clique em um dia para abrir a janela com os agendamentos dele. Cada um mostra: horário (de Brasília), tipo (visita ou avaliação), status, nome, telefone e e-mail do cliente, veículo, origem do lead, etapa, temperatura, forma de pagamento, observações e o resumo da Clara.
5. Na janela do dia, clique em "Ir para a conversa" para abrir o Conversador já na conversa daquele cliente.
6. Filtros (acima do calendário): Status, Tipo, Veículo e Origem. Eles valem para o calendário e para a lista ao mesmo tempo. Com um status escolhido, o número do dia passa a contar só aquele status. "Limpar filtros" volta a mostrar tudo.
7. Abaixo do calendário fica a lista. Os botões "Próximos / Hoje / Todos" valem só para a lista. "Próximos" esconde o que já passou e o que foi cancelado; para ver esses, use "Todos".
8. Com a visita ainda "Agendado", escolha um botão (na lista ou na janela do dia): "Compareceu" (o cliente veio), "Não veio" (faltou) ou "Cancelar" (desmarcado antes).
9. Errou o botão? Clique em "Reabrir". Volta para "Agendado" e você escolhe de novo.
10. A tela atualiza sozinha quando a Clara marca uma visita nova. Não precisa recarregar a página.

ATENÇÃO: se ninguém marcar nada, o sistema marca "Não compareceu" sozinho 2 horas depois do horário e envia ao cliente uma mensagem de reagendamento. Marque o resultado antes disso, para não mandar mensagem a quem veio.

REMARCAÇÃO: quando a Clara remarca uma visita, a antiga fica como "Cancelado" e nasce uma nova. O dia antigo continua contando a visita cancelada.$t$
where titulo = 'Acompanhar e Marcar Resultado de Visitas Agendadas'
  and categoria = 'Agendamentos';
