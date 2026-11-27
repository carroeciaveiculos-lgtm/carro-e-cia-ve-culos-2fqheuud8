-- 26/11/2026: correção da r2_referencias_urls (achada no 1º ensaio, antes de qualquer arquivo ser apagado).
-- Os nomes das fotos têm parênteses ("20260813_082514(1).jpg") e o padrão anterior parava no ")",
-- cortando a URL: o inventário marcava foto em uso como "sem uso" e a proteção do modo real poderia
-- não reconhecer foto usada em outro lugar. Agora a URL só termina em aspas, espaço, barra invertida,
-- < > , { } (separadores de JSON, texto e array do Postgres).
create or replace function public.r2_referencias_urls()
returns table (url text, tabela text, coluna text, veiculo_id uuid, status_linha text)
language plpgsql
security definer
set search_path = public
as $$
declare
  c record;
  tem_veiculo boolean;
  tem_status boolean;
begin
  for c in
    select col.table_name, col.column_name
      from information_schema.columns col
      join information_schema.tables t
        on t.table_schema = col.table_schema and t.table_name = col.table_name and t.table_type = 'BASE TABLE'
     where col.table_schema = 'public'
       and col.data_type in ('text', 'character varying', 'jsonb', 'json', 'ARRAY')
       and col.table_name not in ('r2_limpeza_fila', 'r2_limpeza_execucoes')
  loop
    tem_veiculo := exists (select 1 from information_schema.columns
                            where table_schema = 'public' and table_name = c.table_name and column_name = 'veiculo_id');
    tem_status := exists (select 1 from information_schema.columns
                           where table_schema = 'public' and table_name = c.table_name and column_name = 'status');
    return query execute format(
      'select distinct m[1], %L::text, %L::text, %s, %s
         from public.%I, regexp_matches(%I::text, %L, %L) m
        where %I::text like %L',
      c.table_name, c.column_name,
      case when c.table_name = 'veiculos' then 'id' when tem_veiculo then 'veiculo_id' else 'null::uuid' end,
      case when tem_status then 'status::text' else 'null::text' end,
      c.table_name, c.column_name,
      'https://imagens\.carroeciamotors\.com\.br/[^"''\s\\<>,{}]+', 'g',
      c.column_name, '%imagens.carroeciamotors.com.br%'
    );
  end loop;
end;
$$;

revoke all on function public.r2_referencias_urls() from public, anon, authenticated;
grant execute on function public.r2_referencias_urls() to service_role;
