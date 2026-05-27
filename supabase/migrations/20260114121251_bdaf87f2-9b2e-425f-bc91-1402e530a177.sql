-- Add SEO control columns to blog_posts
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS allow_indexing BOOLEAN DEFAULT true;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS canonical_url TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS sitemap_priority DECIMAL(2,1) DEFAULT 0.7;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS sitemap_changefreq TEXT DEFAULT 'weekly';

-- Add SEO control columns to help_articles
ALTER TABLE help_articles ADD COLUMN IF NOT EXISTS allow_indexing BOOLEAN DEFAULT true;
ALTER TABLE help_articles ADD COLUMN IF NOT EXISTS canonical_url TEXT;
ALTER TABLE help_articles ADD COLUMN IF NOT EXISTS sitemap_priority DECIMAL(2,1) DEFAULT 0.6;
ALTER TABLE help_articles ADD COLUMN IF NOT EXISTS sitemap_changefreq TEXT DEFAULT 'monthly';

-- Add SEO control columns to pillar_pages
ALTER TABLE pillar_pages ADD COLUMN IF NOT EXISTS allow_indexing BOOLEAN DEFAULT true;
ALTER TABLE pillar_pages ADD COLUMN IF NOT EXISTS canonical_url TEXT;
ALTER TABLE pillar_pages ADD COLUMN IF NOT EXISTS sitemap_priority DECIMAL(2,1) DEFAULT 0.8;
ALTER TABLE pillar_pages ADD COLUMN IF NOT EXISTS sitemap_changefreq TEXT DEFAULT 'weekly';

-- Add SEO control columns to glossary_terms
ALTER TABLE glossary_terms ADD COLUMN IF NOT EXISTS allow_indexing BOOLEAN DEFAULT true;
ALTER TABLE glossary_terms ADD COLUMN IF NOT EXISTS canonical_url TEXT;
ALTER TABLE glossary_terms ADD COLUMN IF NOT EXISTS sitemap_priority DECIMAL(2,1) DEFAULT 0.5;
ALTER TABLE glossary_terms ADD COLUMN IF NOT EXISTS sitemap_changefreq TEXT DEFAULT 'monthly';

-- Create static_pages_seo table for controlling static page SEO
CREATE TABLE IF NOT EXISTS static_pages_seo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL UNIQUE,
  page_name TEXT NOT NULL,
  allow_indexing BOOLEAN DEFAULT true,
  include_in_sitemap BOOLEAN DEFAULT true,
  canonical_url TEXT,
  seo_title TEXT,
  seo_description TEXT,
  og_image TEXT,
  sitemap_priority DECIMAL(2,1) DEFAULT 0.5,
  sitemap_changefreq TEXT DEFAULT 'monthly',
  is_protected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE static_pages_seo ENABLE ROW LEVEL SECURITY;

-- Create policies for static_pages_seo using correct admin_role values
CREATE POLICY "Admins can manage static pages SEO"
ON static_pages_seo
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin_master', 'admin_operacional')
  )
);

CREATE POLICY "Public can read indexable static pages"
ON static_pages_seo
FOR SELECT
USING (true);

-- Insert default static pages
INSERT INTO static_pages_seo (path, page_name, allow_indexing, include_in_sitemap, sitemap_priority, sitemap_changefreq, is_protected) VALUES
('/', 'Página Inicial', true, true, 1.0, 'daily', false),
('/landing', 'Landing Page', true, true, 1.0, 'daily', false),
('/planos', 'Planos e Preços', true, true, 0.9, 'weekly', false),
('/blog', 'Blog', true, true, 0.9, 'daily', false),
('/ajuda', 'Central de Ajuda', true, true, 0.9, 'weekly', false),
('/solucoes', 'Soluções', true, true, 0.9, 'weekly', false),
('/glossario', 'Glossário', true, true, 0.8, 'weekly', false),
('/termos-de-uso', 'Termos de Uso', true, true, 0.5, 'monthly', false),
('/login', 'Login', false, false, 0.0, 'never', true),
('/register', 'Cadastro', false, false, 0.0, 'never', true),
('/admin', 'Painel Admin', false, false, 0.0, 'never', true),
('/covildomal', 'CMS Admin', false, false, 0.0, 'never', true),
('/dashboard', 'Dashboard', false, false, 0.0, 'never', true),
('/materiais', 'Materiais', false, false, 0.0, 'never', true),
('/configuracoes', 'Configurações', false, false, 0.0, 'never', true),
('/clientes', 'Clientes', false, false, 0.0, 'never', true),
('/funcionarios', 'Funcionários', false, false, 0.0, 'never', true),
('/transacoes', 'Transações', false, false, 0.0, 'never', true),
('/estoque', 'Estoque', false, false, 0.0, 'never', true),
('/vendas', 'Vendas', false, false, 0.0, 'never', true),
('/compras', 'Compras', false, false, 0.0, 'never', true),
('/despesas', 'Despesas', false, false, 0.0, 'never', true),
('/fluxo-caixa', 'Fluxo de Caixa', false, false, 0.0, 'never', true),
('/adicoes-caixa', 'Adições de Caixa', false, false, 0.0, 'never', true),
('/indicacoes', 'Sistema de Indicações', false, false, 0.0, 'never', true),
('/guia-completo', 'Guia Completo', false, false, 0.0, 'never', true),
('/relatar-erro', 'Relatar Erro', false, false, 0.0, 'never', true)
ON CONFLICT (path) DO NOTHING;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_static_pages_seo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_static_pages_seo_timestamp ON static_pages_seo;
CREATE TRIGGER update_static_pages_seo_timestamp
  BEFORE UPDATE ON static_pages_seo
  FOR EACH ROW
  EXECUTE FUNCTION update_static_pages_seo_updated_at();