-- Importa para a Central de Redes Sociais o histórico do Instagram que chegou ao webhook e foi descartado (04/10/2026):
--  * mensagens diretas (entry.messaging) -> social_conversas / social_mensagens
--  * comentários (changes.field = 'comments') -> social_comments
-- Só insere (nunca apaga) e é repetível: reexecutar não duplica (mid e comment_id únicos). Não gera avisos nem leads.

-- 1) Mensagens diretas
CREATE TEMP TABLE _dm ON COMMIT DROP AS
SELECT DISTINCT ON (mid)
  mid, contato, direcao, origem, texto, quando
FROM (
  SELECT
    m->'message'->>'mid' AS mid,
    CASE WHEN (m->'message'->>'is_echo') = 'true' THEN m->'recipient'->>'id' ELSE m->'sender'->>'id' END AS contato,
    CASE WHEN (m->'message'->>'is_echo') = 'true' THEN 'saida' ELSE 'entrada' END AS direcao,
    CASE WHEN (m->'message'->>'is_echo') = 'true' THEN 'equipe_app' ELSE 'cliente' END AS origem,
    COALESCE(
      NULLIF(btrim(m->'message'->>'text'), ''),
      CASE WHEN jsonb_array_length(COALESCE(m->'message'->'attachments', '[]'::jsonb)) > 0 THEN '[enviou: anexo]' END
    ) AS texto,
    COALESCE(
      CASE WHEN (m->>'timestamp') ~ '^[0-9]{13}$' THEN to_timestamp((m->>'timestamp')::bigint / 1000.0) END,
      l.created_at
    ) AS quando,
    e->>'id' AS loja_id
  FROM public.meta_webhook_logs l
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(l.payload->'entry', '[]'::jsonb)) e
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(e->'messaging', '[]'::jsonb)) m
  WHERE l.payload->>'object' = 'instagram'
    AND m->'message' IS NOT NULL
    AND COALESCE(m->'message'->>'is_deleted', 'false') <> 'true'
) x
WHERE mid IS NOT NULL AND contato IS NOT NULL AND contato <> loja_id AND texto IS NOT NULL
ORDER BY mid, quando;

INSERT INTO public.social_conversas (plataforma, contato_id, ultima_mensagem, ultima_mensagem_em, ultima_do_cliente_em, nao_lidas)
SELECT
  'instagram',
  d.contato,
  (SELECT d2.texto FROM _dm d2 WHERE d2.contato = d.contato ORDER BY d2.quando DESC LIMIT 1),
  max(d.quando),
  max(d.quando) FILTER (WHERE d.direcao = 'entrada'),
  -- só marca como não lida o que chegou nos últimos 7 dias e a equipe ainda não respondeu
  count(*) FILTER (
    WHERE d.direcao = 'entrada'
      AND d.quando > now() - interval '7 days'
      AND d.quando > COALESCE((SELECT max(d3.quando) FROM _dm d3 WHERE d3.contato = d.contato AND d3.direcao = 'saida'), '-infinity'::timestamptz)
  )
FROM _dm d
GROUP BY d.contato
ON CONFLICT (plataforma, contato_id) DO NOTHING;

INSERT INTO public.social_mensagens (conversa_id, direcao, origem, texto, mid, criado_em)
SELECT c.id, d.direcao, d.origem, d.texto, d.mid, d.quando
FROM _dm d
JOIN public.social_conversas c ON c.plataforma = 'instagram' AND c.contato_id = d.contato
ON CONFLICT DO NOTHING;

-- 2) Comentários do Instagram (inclusive em anúncios). Os da própria loja não entram como comentário,
-- mas marcam como respondido o comentário a que responderam (parent_id).
CREATE TEMP TABLE _cm ON COMMIT DROP AS
SELECT DISTINCT ON (cid) cid, post_id, from_id, from_nome, texto, quando, propria, parent_id
FROM (
  SELECT
    ch->'value'->>'id' AS cid,
    ch->'value'->'media'->>'id' AS post_id,
    ch->'value'->'from'->>'id' AS from_id,
    COALESCE(ch->'value'->'from'->>'username', 'Instagram') AS from_nome,
    ch->'value'->>'text' AS texto,
    l.created_at AS quando,
    (ch->'value'->'from'->>'id') = (e->>'id') AS propria,
    ch->'value'->>'parent_id' AS parent_id
  FROM public.meta_webhook_logs l
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(l.payload->'entry', '[]'::jsonb)) e
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(e->'changes', '[]'::jsonb)) ch
  WHERE l.payload->>'object' = 'instagram' AND ch->>'field' = 'comments'
) y
WHERE cid IS NOT NULL AND texto IS NOT NULL
ORDER BY cid, quando;

INSERT INTO public.social_comments (post_id, comment_id, from_id, from_name, message, platform, is_replied, created_at)
SELECT COALESCE(post_id, ''), cid, COALESCE(from_id, ''), from_nome, texto, 'instagram', false, quando
FROM _cm
WHERE NOT propria
  AND NOT EXISTS (SELECT 1 FROM public.social_comments s WHERE s.comment_id = _cm.cid);

UPDATE public.social_comments s
SET is_replied = true
WHERE s.platform = 'instagram' AND NOT s.is_replied
  AND s.comment_id IN (SELECT parent_id FROM _cm WHERE propria AND parent_id IS NOT NULL);

-- 3) Selo de interesse nos comentários (mesmo critério do webhook, em regex do Postgres)
UPDATE public.social_comments
SET demonstra_interesse = true
WHERE NOT demonstra_interesse
  AND message ~* '(^|[^[:alnum:]])(valor(es)?|pre[cç]o|quan[tyg]o|quero (um|uma|esse|essa|comprar|saber|ver)|compro|interess[[:alpha:]]*|troc[[:alpha:]]*|pix|financ[[:alpha:]]*|entrada|parcela[[:alpha:]]*|simula[[:alpha:]]*|aceita|ainda (tem|est[aá]|dispon[[:alpha:]]*)|dispon[ií]vel|whats[[:alpha:]]*|zap|contato|telefone|me chama|chama (no|pelo)|como (compro|fa[cç]o))($|[^[:alnum:]])';
