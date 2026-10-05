-- Correção (04/10/2026): o artigo dizia que o Instagram só enviava mensagens diretas. Errado: o evento "comments" já chegava, o código é que descartava (formato diferente do Facebook).
UPDATE public.ajuda_conteudos
SET como_utilizar = replace(
  como_utilizar,
  E'- Comentários do Instagram só chegam depois que o app da Meta estiver inscrito no evento "comments" do Instagram (hoje o Instagram só envia mensagens diretas). Enquanto isso não for feito, só os comentários do Facebook aparecem aqui.',
  E'- Comentários do Instagram (inclusive os feitos em anúncios) também aparecem aqui e geram aviso e lead da mesma forma. Até 04/10/2026 eles chegavam ao sistema mas eram descartados por um erro de formato; foi corrigido.'
)
WHERE titulo = 'Responder comentários e transformar em lead (Central de Redes Sociais)'
  AND como_utilizar LIKE '%só chegam depois que o app da Meta%';
