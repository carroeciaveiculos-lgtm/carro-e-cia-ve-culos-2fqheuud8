-- Central de Ajuda: corrige a frase sobre o botao "Proximos" no artigo de Agendamentos (conferida contra Agendamentos.tsx).
update public.ajuda_conteudos
set como_utilizar = replace(
  como_utilizar,
  $t$"Próximos" esconde o que já passou e o que foi cancelado; para ver esses, use "Todos".$t$,
  $t$"Próximos" mostra de hoje em diante, mais as visitas antigas que ainda estão sem resultado; para ver as que já passaram, use "Todos".$t$
)
where titulo = 'Acompanhar e Marcar Resultado de Visitas Agendadas'
  and categoria = 'Agendamentos';
