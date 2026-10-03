-- Nota no artigo "Fotos, vídeo e roteiro de 20 fotos do veículo": botão próprio para sincronizar vídeo do Drive (03/10/2026).
-- Não repete se rodar de novo (a condição olha se a nota já está lá).
UPDATE public.ajuda_conteudos
SET como_utilizar = como_utilizar || E'\n\nAtualização de 03/10/2026 — vídeo do Drive tem botão próprio:\n- O botão "Sync Drive" (bloco de fotos) sincroniza SÓ as fotos.\n- Para trazer o vídeo do Drive, use o botão "Sincronizar vídeo do Drive", no bloco "Vídeos" do mesmo cadastro. Ele procura, na pasta "02-Videos de Veiculos", a pasta cujo nome começa com a placa do veículo e importa os vídeos novos. Vídeo grande pode levar alguns minutos; aguarde a mensagem.\n- Se aparecer "Nenhuma pasta de vídeo encontrada", confira se o nome da pasta no Drive começa com a placa. Se aparecer "Nenhum vídeo novo encontrado", os vídeos que já estão no cadastro não são importados de novo.\n- O veículo precisa estar salvo e com a placa preenchida para o botão funcionar.'
WHERE titulo = 'Fotos, vídeo e roteiro de 20 fotos do veículo'
  AND como_utilizar NOT LIKE '%Atualização de 03/10/2026%';
