-- Fecha a brecha: hoje "auth_all_ai_prompts_config" dá ALL (select/insert/
-- update/delete) pra qualquer usuário autenticado, mesmo sem acesso à tela
-- /admin/prompts-ia (que já é restrita a admin_master / setor "Desenvolvedor
-- e TI" via rotaLiberada() no frontend -- só o frontend checava, o banco
-- não). Investigado em 19/09/2026: nenhuma function do sistema escreve em
-- ai_prompts_config (as 9 que usam essa tabela só fazem select), então
-- apertar só a escrita é seguro pra elas.

drop policy if exists "auth_all_ai_prompts_config" on public.ai_prompts_config;

create policy authenticated_select_ai_prompts_config
  on public.ai_prompts_config for select
  to authenticated
  using (true);

create policy admin_ti_write_ai_prompts_config
  on public.ai_prompts_config for all
  to authenticated
  using (
    public.usuario_tem_nivel(array['admin_master'])
    or public.usuario_em_setor('Desenvolvedor e TI')
  )
  with check (
    public.usuario_tem_nivel(array['admin_master'])
    or public.usuario_em_setor('Desenvolvedor e TI')
  );
