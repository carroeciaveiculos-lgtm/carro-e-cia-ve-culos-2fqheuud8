-- Central de Ajuda (11/11/2026): artigo "Atender Conversas de Clientes (Clara x Atendimento
-- Humano)" passa a explicar a PAUSA por texto e a retomada automática da Clara depois de 2 h.
-- Rollback: rodar o replace inverso (os textos antigos estão nos pares abaixo).

update public.ajuda_conteudos
set como_utilizar = replace(
      replace(
        como_utilizar,
        $velho6$6. ATENÇÃO: ao enviar uma mensagem de texto, a Clara é desligada automaticamente para aquele cliente e a conversa passa para a aba "Atendendo". Um aviso confirma. Foto, documento e template NÃO desligam a Clara.$velho6$,
        $novo6$6. ATENÇÃO: ao enviar uma mensagem de texto, a Clara é PAUSADA para aquele cliente e a conversa passa para a aba "Atendendo". Um aviso confirma. Foto, documento e template NÃO pausam a Clara. Se depois o cliente escrever e ficar 2 horas sem resposta da equipe, a Clara volta sozinha, responde o cliente e o sino do painel avisa ("Clara retomou o atendimento"). Para ela não voltar, desligue pelo interruptor ou clique em "Manter desligada" (passo 11).$novo6$
      ),
      $velho11$11. No painel da direita, o interruptor "Assistente Clara (IA)" liga e desliga a Clara para aquele cliente. IMPORTANTE: a Clara nunca volta sozinha. Depois de desligada, mesmo que o cliente responda, a conversa continua em "Atendendo" até alguém ligar o interruptor de novo. Quando terminar o atendimento, religue a Clara. Ela também se desliga sozinha quando o cliente pede para falar com uma pessoa e quando ela encaminha o cliente para consórcio ou seguro.$velho11$,
      $novo11$11. No painel da direita, o interruptor "Assistente Clara (IA)" liga e desliga a Clara para aquele cliente. Desligar PELO INTERRUPTOR é definitivo: a Clara não volta sozinha, mesmo que o cliente responda, até alguém ligar de novo. Já a pausa por mensagem de texto (passo 6) mostra um aviso amarelo embaixo do interruptor, "Clara pausada... volta sozinha", com o botão "Manter desligada": clique nele para a Clara não voltar sozinha. Quando terminar o atendimento, religue a Clara. Ela também se desliga de vez quando o cliente pede para falar com uma pessoa e quando ela encaminha o cliente para consórcio ou seguro. Se o cliente ficar mais de 22 horas sem resposta, a Clara é religada mas não responde (o WhatsApp só aceita texto livre até 24 horas); a equipe é avisada pelo sino.$novo11$
    )
where id = 'fc2637e9-8d42-4021-b01c-00108961512a';
