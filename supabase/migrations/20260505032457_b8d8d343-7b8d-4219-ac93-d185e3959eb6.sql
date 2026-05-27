
ALTER TABLE public.shop_products
  ADD COLUMN IF NOT EXISTS allow_indexing boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sitemap_priority numeric(2,1) DEFAULT 0.7,
  ADD COLUMN IF NOT EXISTS sitemap_changefreq text DEFAULT 'weekly',
  ADD COLUMN IF NOT EXISTS canonical_url text,
  ADD COLUMN IF NOT EXISTS og_image text;

CREATE INDEX IF NOT EXISTS idx_shop_products_indexable
  ON public.shop_products (allow_indexing, is_active, is_visible);

CREATE TABLE IF NOT EXISTS public.shop_seo_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_url text NOT NULL DEFAULT 'https://xlata.site',
  default_priority numeric(2,1) NOT NULL DEFAULT 0.7,
  default_changefreq text NOT NULL DEFAULT 'weekly',
  auto_ping_enabled boolean NOT NULL DEFAULT true,
  last_ping_at timestamptz,
  last_sitemap_generated_at timestamptz,
  default_og_image text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_seo_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read shop seo settings" ON public.shop_seo_settings;
CREATE POLICY "Anyone can read shop seo settings"
  ON public.shop_seo_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage shop seo settings" ON public.shop_seo_settings;
CREATE POLICY "Admins manage shop seo settings"
  ON public.shop_seo_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.shop_seo_settings (base_url)
SELECT 'https://xlata.site'
WHERE NOT EXISTS (SELECT 1 FROM public.shop_seo_settings);

CREATE TABLE IF NOT EXISTS public.shop_seo_ping_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.shop_products(id) ON DELETE SET NULL,
  search_engine text NOT NULL,
  status text NOT NULL,
  status_code int,
  response_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_seo_ping_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read ping log" ON public.shop_seo_ping_log;
CREATE POLICY "Admins read ping log"
  ON public.shop_seo_ping_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Service role insert ping log" ON public.shop_seo_ping_log;
CREATE POLICY "Service role insert ping log"
  ON public.shop_seo_ping_log FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_shop_seo_settings_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_shop_seo_settings_updated_at ON public.shop_seo_settings;
CREATE TRIGGER trg_shop_seo_settings_updated_at
  BEFORE UPDATE ON public.shop_seo_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_shop_seo_settings_updated_at();
