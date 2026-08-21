-- Pivo de escopo (21/08/2026): o que está aprovado de verdade no app da
-- Adriana é "Share on LinkedIn" (w_member_social) + "Sign In with OpenID
-- Connect" -- posta em nome de um MEMBRO autenticado, não da página da
-- empresa (w_organization_social exige revisão manual do LinkedIn, 1-4
-- semanas, não solicitado). Renomeia as colunas pra refletir isso.
alter table public.linkedin_integracao rename column organization_urn to author_urn;
alter table public.linkedin_integracao rename column organization_nome to author_nome;
