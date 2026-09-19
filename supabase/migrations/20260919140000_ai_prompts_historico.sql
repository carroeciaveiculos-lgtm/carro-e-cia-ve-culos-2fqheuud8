-- Histórico de versões do prompt_text de ai_prompts_config (19/09/2026,
-- parte do plano de "prompt único e seguro" da Clara). Antes, a única forma
-- de desfazer uma edição errada era o Claude restaurar manualmente via SQL.
-- Agora cada alteração de prompt_text vira uma linha aqui, e a tela
-- /admin/prompts-ia ganha um botão de restaurar direto.

-- Helper análogo ao usuario_tem_nivel já existente (17/08/2026), pra checar
-- vínculo de setor sem recursão de RLS.
create or replace function public.usuario_em_setor(nome_setor text)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1
    from public.usuario_setores us
    join public.setores s on s.id = us.setor_id
    where us.usuario_id = auth.uid() and s.nome = nome_setor
  );
$$;

create table public.ai_prompts_historico (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  prompt_text_anterior text not null,
  alterado_por uuid references public.usuarios(id),
  alterado_em timestamptz not null default now()
);

create index ai_prompts_historico_slug_idx
  on public.ai_prompts_historico (slug, alterado_em desc);

alter table public.ai_prompts_historico enable row level security;

-- Leitura só pra quem já pode editar prompts hoje (mesma regra da tela).
create policy admin_ti_select_ai_prompts_historico
  on public.ai_prompts_historico for select
  to authenticated
  using (
    public.usuario_tem_nivel(array['admin_master'])
    or public.usuario_em_setor('Desenvolvedor e TI')
  );

-- Grava a versão anterior sempre que prompt_text mudar de verdade (ignora
-- updates que só tocam outras colunas, tipo rodape_fixo). SECURITY DEFINER
-- porque quem chama o UPDATE é a sessão comum da Adriana (via tela), que não
-- tem policy de INSERT nesta tabela nova -- só o gatilho grava aqui.
create or replace function public.registrar_historico_ai_prompt()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if OLD.prompt_text is distinct from NEW.prompt_text then
    insert into public.ai_prompts_historico (slug, prompt_text_anterior, alterado_por)
    values (OLD.slug, OLD.prompt_text, auth.uid());
  end if;
  return NEW;
end;
$$;

drop trigger if exists trigger_registrar_historico_ai_prompt on public.ai_prompts_config;
create trigger trigger_registrar_historico_ai_prompt
  before update on public.ai_prompts_config
  for each row execute function public.registrar_historico_ai_prompt();

-- Conserta o botão "Restaurar Padrão" do sdr_whatsapp: default_prompt hoje
-- é um stub quebrado de 121 caracteres. Copia o prompt_text atual (texto
-- real em produção) pra virar a base do restaurar.
update public.ai_prompts_config
set default_prompt = prompt_text
where slug = 'sdr_whatsapp';
