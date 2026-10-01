-- Conteúdo > Artigos agora publica de verdade no blog (01/10/2026, pedido da Adriana).
-- Antes: o editor gravava só em `articles`, e o blog público lê só `blog_posts` — publicar
-- no painel não colocava nada no site. Agora cada INSERT/UPDATE/DELETE em `articles` é
-- espelhado em `blog_posts` por gatilho. O editor continua usando `articles` (que tem os
-- campos de SEO e o histórico de versões que `blog_posts` não tem).

-- 1) Função de espelhamento. SECURITY DEFINER pra não depender das regras de acesso de
--    blog_posts de quem está salvando.
CREATE OR REPLACE FUNCTION public.sync_article_para_blog_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_autor text;
  v_tags text[];
  v_leitura text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- Apagar no painel tira o post do site, mas mantém o registro (e os comentários dele).
    UPDATE public.blog_posts SET published = false, updated_at = now() WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  SELECT u.nome INTO v_autor FROM public.usuarios u WHERE u.id = NEW.autor_id;
  v_autor := COALESCE(NULLIF(NEW.autor_convidado, ''), v_autor, 'Carro e Cia Veículos');

  IF NEW.tags IS NOT NULL AND jsonb_typeof(NEW.tags) = 'array' THEN
    v_tags := ARRAY(SELECT jsonb_array_elements_text(NEW.tags));
  ELSE
    v_tags := ARRAY[]::text[];
  END IF;

  v_leitura := COALESCE(
    NEW.tempo_leitura::text,
    GREATEST(1, CEIL(COALESCE(array_length(regexp_split_to_array(trim(COALESCE(NEW.conteudo, '')), '\s+'), 1), 0) / 200.0))::int::text
  ) || ' min';

  INSERT INTO public.blog_posts (
    id, title, slug, category, meta_description, content, image_url, author, read_time, tags,
    published, created_at, updated_at, keyword, url_path, image_prompt, ia_confidence,
    ia_generated, requires_review
  ) VALUES (
    NEW.id, NEW.titulo, NEW.slug, NEW.categoria, NEW.meta_description, COALESCE(NEW.conteudo, ''),
    NEW.imagem_destaque_url, v_autor, v_leitura, v_tags,
    NEW.status_publicacao = 'Publicado', COALESCE(NEW.criado_em, now()), now(), NEW.keyword,
    NEW.url_path, NEW.image_prompt, NEW.ia_confidence, COALESCE(NEW.ia_generated, false),
    COALESCE(NEW.requires_review, false)
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    slug = EXCLUDED.slug,
    category = EXCLUDED.category,
    meta_description = EXCLUDED.meta_description,
    content = EXCLUDED.content,
    image_url = EXCLUDED.image_url,
    author = EXCLUDED.author,
    read_time = EXCLUDED.read_time,
    tags = EXCLUDED.tags,
    published = EXCLUDED.published,
    updated_at = now(),
    keyword = EXCLUDED.keyword,
    url_path = EXCLUDED.url_path,
    image_prompt = EXCLUDED.image_prompt,
    ia_confidence = EXCLUDED.ia_confidence,
    ia_generated = EXCLUDED.ia_generated,
    requires_review = EXCLUDED.requires_review;

  RETURN NEW;
END;
$$;

-- 2) Traz pro editor os posts que já estão no blog (mesmo id, pra edição futura cair no
--    mesmo post). Feito ANTES de criar o gatilho, pra não reescrever os posts no ar.
INSERT INTO public.articles (
  id, titulo, slug, categoria, tags, meta_title, meta_description, h1_artigo, conteudo,
  imagem_destaque_url, og_title, og_description, og_image_url, autor_convidado, tempo_leitura,
  status_publicacao, keyword, url_path, image_prompt, ia_confidence, ia_generated,
  requires_review, criado_em, atualizado_em
)
SELECT
  b.id, b.title, b.slug, b.category, to_jsonb(COALESCE(b.tags, ARRAY[]::text[])), b.title,
  b.meta_description, b.title, b.content, b.image_url, b.title, b.meta_description, b.image_url,
  b.author, NULLIF(regexp_replace(COALESCE(b.read_time, ''), '\D', '', 'g'), '')::int,
  CASE WHEN b.published THEN 'Publicado' ELSE 'Rascunho' END, b.keyword, b.url_path,
  b.image_prompt, b.ia_confidence, COALESCE(b.ia_generated, false),
  COALESCE(b.requires_review, false), b.created_at, b.updated_at
FROM public.blog_posts b
WHERE NOT EXISTS (SELECT 1 FROM public.articles a WHERE a.id = b.id OR a.slug = b.slug);

-- 3) Gatilho
DROP TRIGGER IF EXISTS sync_article_para_blog_post_trg ON public.articles;
CREATE TRIGGER sync_article_para_blog_post_trg
  AFTER INSERT OR UPDATE OR DELETE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.sync_article_para_blog_post();
