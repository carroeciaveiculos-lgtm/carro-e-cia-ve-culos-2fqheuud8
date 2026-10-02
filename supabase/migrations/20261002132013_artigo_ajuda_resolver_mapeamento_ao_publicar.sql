-- Artigo da Central de Ajuda do trabalho de 01/10/2026 (regra do projeto: toda
-- funcionalidade nova no painel ganha artigo). O INSERT só roda se o título
-- ainda não existir, então pode ser executado de novo sem duplicar.
-- Complementa o artigo "Confirmar mapeamento de catálogo (Webmotors e NaPista)",
-- que cobre a janela que abre ao SALVAR o veículo; este cobre o que acontece ao PUBLICAR.

INSERT INTO public.ajuda_conteudos
  (categoria, titulo, o_que_e, para_que_serve, caminho, quando_utilizar, como_utilizar, dependencias, is_faq, setor_id, grupo)
SELECT
  'Portais',
  'Resolver erro de mapeamento ao publicar (Webmotors e NaPista)',
  $t$Uma janela chamada "Resolver mapeamento" que abre na tela de Portais quando a publicação de um veículo na Webmotors ou na NaPista falha com a mensagem "Veículo sem mapeamento de catálogo ... confirmado". Mapeamento é o "de-para" entre o veículo do nosso estoque (marca, modelo, versão, cor, câmbio, combustível) e o veículo do catálogo do portal: cada portal só aceita anúncio de um veículo que exista no catálogo dele.$t$,
  $t$Resolver o problema na mesma hora em que ele aparece, sem sair da tela e sem precisar saber em qual aba ele fica escondido. A janela tenta mapear sozinha (no caso da NaPista, ela baixa o catálogo da marca se estiver vazio ou desatualizado) e só pede a sua ajuda quando precisa de uma escolha. Depois de mapeado, o sistema reenvia o veículo para a plataforma automaticamente.$t$,
  'Menu lateral → Estoque/Portais → Portais (/admin/portais) e Revisão de Pendências (/admin/portais/revisao)',
  $t$Quando você publicar um veículo (botão de publicar do card, ou "Sincronizar Selecionados") e a Webmotors ou a NaPista devolver erro de mapeamento de catálogo. Também quando, em Revisão de Pendências, aparecer o botão "Resolver mapeamento" no lugar de "Reprocessar".$t$,
  $t$1. Publique o veículo normalmente em Portais. Se for erro de mapeamento, a janela "Resolver mapeamento" abre sozinha ao publicar pelo card do veículo. Se você usou "Sincronizar Selecionados", aparece a lista "Falhas na Sincronização" e, em cada falha de mapeamento, o botão "Resolver mapeamento agora".
2. A janela mostra "Buscando o catálogo ... e tentando mapear sozinho". Aguarde alguns segundos: muitas vezes ela resolve sem pedir nada e já reenvia o veículo (aparece o aviso "Publicado na ...!").
3. Se precisar de uma escolha, a janela mostra uma lista com a porcentagem de semelhança. Clique no modelo correto e depois, se pedir, na versão correta.
4. Quando o mapeamento fecha, o sistema reenvia o veículo para a plataforma sozinho e atualiza o card.
5. Se a janela avisar que o modelo não existe no catálogo do portal, o portal ainda não cadastrou aquele modelo: o veículo fica de fora dessa plataforma até lá. Se o nome do modelo estiver escrito diferente no cadastro, corrija o veículo e clique em "Tentar de novo".
6. Se avisar que a marca ou a cor, o câmbio ou o combustível não têm equivalente, ajuste esses campos no cadastro do veículo e clique em "Tentar de novo".
7. "Fechar (resolvo depois)" apenas fecha a janela: o veículo continua pendente e aparece em Revisão de Pendências com o botão "Resolver mapeamento".
Observação: o Mercado Livre não usa esse mapeamento de catálogo.$t$,
  $t$O veículo precisa estar salvo e com marca, modelo, versão, cor, câmbio e combustível preenchidos. É preciso ter acesso ao menu Estoque/Portais. Os portais precisam estar conectados (Webmotors e NaPista) para o catálogo ser consultado.$t$,
  false,
  '91be7040-6a3a-425c-9f01-01e2b04900d4',
  'operacional'
WHERE NOT EXISTS (
  SELECT 1 FROM public.ajuda_conteudos
  WHERE titulo = 'Resolver erro de mapeamento ao publicar (Webmotors e NaPista)'
);

-- Atualiza o artigo da janela de confirmação do cadastro: desde 01/10/2026 ela
-- aparece SEMPRE que o veículo ainda não teve o mapeamento confirmado por uma
-- pessoa, mostrando o que o sistema escolheu sozinho ("Está certo" ou "Trocar").
UPDATE public.ajuda_conteudos
SET
  o_que_e = $t$Uma janela que aparece logo depois de salvar um veículo, uma plataforma por vez (primeiro Webmotors, depois NaPista). Ela mostra com qual veículo do catálogo da plataforma o sistema casou o seu cadastro (marca, modelo e versão) para você conferir. Se o sistema não conseguiu casar sozinho, a mesma janela já pede a sua escolha.$t$,
  para_que_serve = $t$Garantir que o anúncio saia com o veículo certo. Um mapeamento errado e silencioso publicaria o carro trocado (já aconteceu com um Volvo XC60 publicado como XC40). Sem o mapeamento confirmado o veículo também fica bloqueado e não é publicado naquela plataforma.$t$,
  quando_utilizar = $t$Sempre que salvar um veículo novo (ou um veículo que ainda não teve o mapeamento confirmado). Depois que você clica em "Está certo" ou escolhe com "Trocar", a janela não volta a perguntar quando você só editar preço, fotos ou outros dados.$t$,
  como_utilizar = $t$1. Preencha o cadastro e clique em "Validar e Salvar".
2. Abre a janela "Confirmar veículo na Webmotors". Se o sistema já mapeou, aparece o nome do catálogo (Marca › Modelo e a Versão). Compare com o veículo.
3. Se estiver certo, clique em "Está certo". Se não estiver, clique em "Trocar", procure o modelo pelo nome na lista e depois escolha a versão (na NaPista a versão aparece logo após escolher o modelo).
4. Se o sistema não conseguiu casar sozinho, a janela mostra as opções mais parecidas com a porcentagem de semelhança. Escolha a correta. Se a plataforma não tiver o modelo, a janela avisa; o veículo fica de fora dela até o catálogo ser atualizado.
5. Em seguida abre a mesma janela para a NaPista. Repita o passo 3.
6. Em veículo NOVO a confirmação é obrigatória: não existe "Pular" e a janela não fecha sozinha. O veículo fica gravado como Rascunho e só vira Disponível depois de confirmado nas duas plataformas.
7. Se a janela pedir algo que só se corrige no cadastro (marca, cor, câmbio, combustível), clique em "Voltar e corrigir o cadastro": o veículo continua como Rascunho, você ajusta e clica em "Validar e Salvar" de novo.
8. Se a plataforma realmente não tiver o veículo no catálogo dela, aparece o botão "Seguir sem a Webmotors/NaPista": o veículo é liberado e só não será publicado naquela plataforma.
9. Em veículo que já existia, a janela ainda tem "Pular (confirmo depois)": o veículo fica como está e você resolve depois em Portais ou em Revisão de Pendências, pelo botão "Resolver mapeamento".
10. Quando as duas plataformas forem tratadas, o formulário fecha e o veículo está liberado para publicar.$t$
WHERE titulo = 'Confirmar mapeamento de catálogo (Webmotors e NaPista)';

-- Nota no artigo de cadastro: cor padronizada, conferência antes de gravar e
-- fluxo rascunho -> mapeamento -> disponível (01/10/2026). Não repete se rodar
-- de novo (a condição olha se a nota já está lá).
UPDATE public.ajuda_conteudos
SET como_utilizar = como_utilizar || E'\n\nAtualização de 01/10/2026 — Cor, conferência dos portais e mapeamento:\n- A Cor é uma lista fechada, sempre no masculino (Branco, Preto, Prata, Cinza, Vermelho, Azul...). Nunca "Branca" ou "Preta". A Consulta de Placa já converte (BRANCA vira Branco); se não reconhecer a cor, escolha na lista.\n- "Validar e Salvar" agora confere, antes de gravar qualquer coisa, se Cor, Câmbio e Combustível existem nos catálogos da Webmotors e da NaPista (Câmbio é obrigatório) e mostra o que ajustar.\n- Veículo novo é gravado como Rascunho, abre a janela obrigatória "Confirmar veículo na Webmotors/NaPista" (botões "Está certo" e "Trocar") e só vira Disponível depois de confirmar. Detalhes nos artigos "Confirmar mapeamento de catálogo (Webmotors e NaPista)" e "Resolver erro de mapeamento ao publicar (Webmotors e NaPista)".'
WHERE titulo = 'Cadastrar um veículo novo no Estoque'
  AND como_utilizar NOT LIKE '%Atualização de 01/10/2026%';
