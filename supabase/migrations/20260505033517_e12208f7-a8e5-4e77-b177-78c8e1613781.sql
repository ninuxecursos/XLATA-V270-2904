
-- 1) IndexNow key em shop_seo_settings
ALTER TABLE public.shop_seo_settings
  ADD COLUMN IF NOT EXISTS indexnow_key TEXT;

-- Gera chave para o registro existente (se nulo)
UPDATE public.shop_seo_settings
SET indexnow_key = replace(gen_random_uuid()::text, '-', '')
WHERE indexnow_key IS NULL;

-- Garante auto_ping ativo
UPDATE public.shop_seo_settings
SET auto_ping_enabled = true
WHERE auto_ping_enabled IS DISTINCT FROM true;

-- 2) Defaults de SEO em shop_products
ALTER TABLE public.shop_products
  ALTER COLUMN allow_indexing SET DEFAULT true;

ALTER TABLE public.shop_products
  ALTER COLUMN sitemap_priority SET DEFAULT 0.8;

ALTER TABLE public.shop_products
  ALTER COLUMN sitemap_changefreq SET DEFAULT 'weekly';

-- Backfill de produtos existentes
UPDATE public.shop_products
SET allow_indexing = true
WHERE allow_indexing IS NULL;

UPDATE public.shop_products
SET sitemap_priority = 0.8
WHERE sitemap_priority IS NULL;

UPDATE public.shop_products
SET sitemap_changefreq = 'weekly'
WHERE sitemap_changefreq IS NULL;
