-- Artigo "Confirmar mapeamento de catálogo": passa a explicar os anos aceitos por versão da Webmotors. 06/10/2026. Não duplica se rodar de novo.
UPDATE public.ajuda_conteudos
SET como_utilizar = como_utilizar || E'\n\nAnos aceitos (Webmotors): ao lado de cada versão aparece "Anos aceitos: ...". A Webmotors só aceita a versão dentro desses anos; se o ano do veículo não estiver na lista, o anúncio é recusado (erro 43|41,43|37). Escolha uma versão cuja lista inclua o ano do veículo. Se você escolher uma versão que não vale para o ano, o sistema recusa e explica. Versão sem "Anos aceitos" é de um catálogo antigo e não é conferida.'
WHERE id = 'de1e659c-0824-4d40-b240-6e5657fa7b1c'
  AND como_utilizar NOT LIKE '%Anos aceitos (Webmotors)%';
