-- create blog_comments
CREATE TABLE IF NOT EXISTS public.blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  autor_nome TEXT NOT NULL,
  autor_email TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  publicado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_public_insert_comments" ON public.blog_comments;
CREATE POLICY "allow_public_insert_comments" ON public.blog_comments FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "allow_public_read_published_comments" ON public.blog_comments;
CREATE POLICY "allow_public_read_published_comments" ON public.blog_comments FOR SELECT TO public USING (publicado = true);

DROP POLICY IF EXISTS "allow_auth_all_comments" ON public.blog_comments;
CREATE POLICY "allow_auth_all_comments" ON public.blog_comments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger to mark vehicle as sold
CREATE OR REPLACE FUNCTION public.update_veiculo_status_on_nf()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'Emitida' AND NEW.veiculo_id IS NOT NULL THEN
    UPDATE public.veiculos SET status = 'vendido' WHERE id = NEW.veiculo_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_veiculo_status ON public.notas_fiscais;
CREATE TRIGGER trg_update_veiculo_status
  AFTER INSERT OR UPDATE ON public.notas_fiscais
  FOR EACH ROW EXECUTE FUNCTION public.update_veiculo_status_on_nf();
