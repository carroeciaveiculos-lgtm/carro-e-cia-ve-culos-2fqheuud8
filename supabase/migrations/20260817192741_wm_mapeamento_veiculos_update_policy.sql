-- Faltava política de UPDATE pra usuário autenticado em
-- wm_mapeamento_veiculos — só existia SELECT. Sem isso, o seletor de
-- modalidade real (17/08/2026) não conseguia gravar a mudança, só ler.
-- Mesmo padrão permissivo já usado em estoque_publicacoes (proteção real
-- é o gate de setor na rota /admin/portais, não RLS fino por linha).
create policy "auth_update_wm_mapeamento_veiculos"
  on wm_mapeamento_veiculos
  for update
  to authenticated
  using (true)
  with check (true);
