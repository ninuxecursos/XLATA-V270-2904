-- =====================================================
-- PORTAL DE CONTEÚDO: TABELAS E RLS POLICIES
-- =====================================================

-- Enum para status de conteúdo
CREATE TYPE content_status AS ENUM ('draft', 'published');

-- Enum para módulos do sistema (ajuda)
CREATE TYPE system_module AS ENUM (
  'caixa', 
  'despesas', 
  'compra', 
  'venda', 
  'estoque', 
  'relatorios', 
  'transacoes', 
  'assinatura', 
  'geral'
);

-- =====================================================
-- TABELA: blog_categories
-- =====================================================
CREATE TABLE public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_blog_categories_updated_at
  BEFORE UPDATE ON public.blog_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view blog categories"
  ON public.blog_categories FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage blog categories"
  ON public.blog_categories FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================================================
-- TABELA: blog_posts
-- =====================================================
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content_md TEXT,
  content_html TEXT,
  category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  status content_status NOT NULL DEFAULT 'draft',
  is_featured BOOLEAN DEFAULT false,
  pillar_page_slug TEXT,
  published_at TIMESTAMPTZ,
  seo_title TEXT,
  seo_description TEXT,
  og_image TEXT,
  view_count INTEGER DEFAULT 0,
  reading_time_minutes INTEGER DEFAULT 0,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_posts_category ON public.blog_posts(category_id);
CREATE INDEX idx_blog_posts_published_at ON public.blog_posts(published_at DESC);

-- Trigger para updated_at
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published blog posts"
  ON public.blog_posts FOR SELECT
  USING (status = 'published' OR is_admin());

CREATE POLICY "Only admins can manage blog posts"
  ON public.blog_posts FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================================================
-- TABELA: help_categories
-- =====================================================
CREATE TABLE public.help_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  module system_module DEFAULT 'geral',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_help_categories_updated_at
  BEFORE UPDATE ON public.help_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.help_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view help categories"
  ON public.help_categories FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage help categories"
  ON public.help_categories FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================================================
-- TABELA: help_articles
-- =====================================================
CREATE TABLE public.help_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content_md TEXT,
  content_html TEXT,
  category_id UUID REFERENCES public.help_categories(id) ON DELETE SET NULL,
  module system_module DEFAULT 'geral',
  status content_status NOT NULL DEFAULT 'draft',
  seo_title TEXT,
  seo_description TEXT,
  og_image TEXT,
  view_count INTEGER DEFAULT 0,
  reading_time_minutes INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_help_articles_slug ON public.help_articles(slug);
CREATE INDEX idx_help_articles_status ON public.help_articles(status);
CREATE INDEX idx_help_articles_category ON public.help_articles(category_id);
CREATE INDEX idx_help_articles_module ON public.help_articles(module);

-- Trigger para updated_at
CREATE TRIGGER update_help_articles_updated_at
  BEFORE UPDATE ON public.help_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published help articles"
  ON public.help_articles FOR SELECT
  USING (status = 'published' OR is_admin());

CREATE POLICY "Only admins can manage help articles"
  ON public.help_articles FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================================================
-- TABELA: pillar_pages
-- =====================================================
CREATE TABLE public.pillar_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  headline TEXT NOT NULL,
  subheadline TEXT,
  hero_image TEXT,
  intro_text TEXT,
  sections JSONB DEFAULT '[]',
  features JSONB DEFAULT '[]',
  how_it_works JSONB DEFAULT '[]',
  benefits JSONB DEFAULT '[]',
  faq JSONB DEFAULT '[]',
  testimonials JSONB DEFAULT '[]',
  seo_title TEXT,
  seo_description TEXT,
  og_image TEXT,
  cta_primary_text TEXT DEFAULT 'Começar teste grátis 7 dias',
  cta_primary_url TEXT DEFAULT '/teste-gratis',
  cta_secondary_text TEXT DEFAULT 'Ver planos',
  cta_secondary_url TEXT DEFAULT '/planos',
  status content_status NOT NULL DEFAULT 'draft',
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_pillar_pages_slug ON public.pillar_pages(slug);
CREATE INDEX idx_pillar_pages_status ON public.pillar_pages(status);

-- Trigger para updated_at
CREATE TRIGGER update_pillar_pages_updated_at
  BEFORE UPDATE ON public.pillar_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.pillar_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published pillar pages"
  ON public.pillar_pages FOR SELECT
  USING (status = 'published' OR is_admin());

CREATE POLICY "Only admins can manage pillar pages"
  ON public.pillar_pages FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================================================
-- TABELA: glossary_terms
-- =====================================================
CREATE TABLE public.glossary_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_definition TEXT NOT NULL,
  long_definition TEXT,
  examples TEXT,
  related_links JSONB DEFAULT '[]',
  related_terms TEXT[] DEFAULT '{}',
  seo_title TEXT,
  seo_description TEXT,
  status content_status NOT NULL DEFAULT 'draft',
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_glossary_terms_slug ON public.glossary_terms(slug);
CREATE INDEX idx_glossary_terms_status ON public.glossary_terms(status);
CREATE INDEX idx_glossary_terms_term ON public.glossary_terms(term);

-- Trigger para updated_at
CREATE TRIGGER update_glossary_terms_updated_at
  BEFORE UPDATE ON public.glossary_terms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.glossary_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published glossary terms"
  ON public.glossary_terms FOR SELECT
  USING (status = 'published' OR is_admin());

CREATE POLICY "Only admins can manage glossary terms"
  ON public.glossary_terms FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================================================
-- FUNÇÃO: Incrementar view_count
-- =====================================================
CREATE OR REPLACE FUNCTION public.increment_view_count(
  table_name TEXT,
  record_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE format(
    'UPDATE public.%I SET view_count = view_count + 1 WHERE id = $1',
    table_name
  ) USING record_id;
END;
$$;