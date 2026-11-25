-- 25/11/2026 — Central de Ajuda: o aviso de novo agendamento passa a ir também para o WhatsApp do
-- Pedro Cardoso (vendedor do pré-atendimento), e números da equipe não viram lead.
-- Aplicada em 25/11/2026 (timestamp real 20261125162954, conferido com list_migrations).

update public.ajuda_conteudos
set como_utilizar = replace(
      como_utilizar,
      '3. WhatsApp: o aviso vai para o número da loja configurado em Redes Sociais e para o celular da Adriana (uma vez só se forem o mesmo número). Quando o template "aviso_novo_agendamento" estiver aprovado pela Meta, ele chega a qualquer hora. Enquanto não estiver aprovado, o aviso sai em texto livre, que o WhatsApp só entrega se a pessoa tiver escrito para o número da Clara nas últimas 24 horas.',
      '3. WhatsApp: o aviso de novo agendamento vai para o número da loja configurado em Redes Sociais, para o celular da Adriana e para o WhatsApp do Pedro Cardoso, vendedor do pré-atendimento (cada número recebe uma vez só). O template "aviso_novo_agendamento" foi aprovado pela Meta, então o aviso chega a qualquer hora. O aviso de atendimento passado para humano continua indo só para a loja e a Adriana, em texto livre, que o WhatsApp só entrega se a pessoa tiver escrito para o número da Clara nas últimas 24 horas.'
    ) || E'\n6. Números da equipe (desde 25/11/2026): o celular da loja (Roberto) e o WhatsApp do Pedro nunca viram lead. Se mandarem mensagem ou foto para o número da Clara, ela não responde e não cria cadastro. Para incluir outro número da equipe, fale com o setor de Desenvolvimento e TI.',
    updated_at = now()
where id = '2d993ae2-7dee-4b04-b358-ef71f14bfd27'
  and como_utilizar like '%3. WhatsApp: o aviso vai para o número da loja%';
