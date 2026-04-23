-- Migration to mark duplicate blog posts as unpublished based on user prompt specifications
-- It keeps 1 original article per subject block

UPDATE public.blog_posts
SET published = false
WHERE title ILIKE '%Golpes%' AND id NOT IN (
  SELECT id FROM public.blog_posts WHERE title ILIKE '%Golpes%' ORDER BY created_at ASC LIMIT 1
);

UPDATE public.blog_posts
SET published = false
WHERE title ILIKE '%FIPE%' AND id NOT IN (
  SELECT id FROM public.blog_posts WHERE title ILIKE '%FIPE%' ORDER BY created_at ASC LIMIT 1
);

UPDATE public.blog_posts
SET published = false
WHERE title ILIKE '%Vender rápido%' AND id NOT IN (
  SELECT id FROM public.blog_posts WHERE title ILIKE '%Vender rápido%' ORDER BY created_at ASC LIMIT 1
);

UPDATE public.blog_posts
SET published = false
WHERE title ILIKE '%Compra segura%' AND id NOT IN (
  SELECT id FROM public.blog_posts WHERE title ILIKE '%Compra segura%' ORDER BY created_at ASC LIMIT 1
);
