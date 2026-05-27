-- Sector-based AI configuration
CREATE TABLE IF NOT EXISTS public.ai_sector_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_key text NOT NULL UNIQUE,
  sector_label text NOT NULL,
  sector_icon text DEFAULT 'bot',
  api_key text,
  ai_model text DEFAULT 'gemini-2.5-flash',
  is_active boolean DEFAULT true,
  use_global_key boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_sector_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage ai_sector_config"
ON public.ai_sector_config FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.ai_sector_config (sector_key, sector_label, sector_icon, ai_model) VALUES
  ('blog_generation', 'Geração de Artigos', 'file-text', 'gemini-2.5-flash'),
  ('seo_optimizer', 'Otimizador SEO', 'search', 'gemini-2.5-flash'),
  ('seo_local', 'SEO Local', 'map-pin', 'gemini-2.5-flash'),
  ('keyword_discovery', 'Descoberta de Keywords', 'key', 'gemini-2.5-flash'),
  ('content_scaler', 'Escalador de Conteúdo', 'trending-up', 'gemini-2.5-flash'),
  ('smart_audit', 'Auditoria IA', 'brain', 'gemini-2.5-flash'),
  ('growth_engine', 'Motor de Crescimento', 'rocket', 'gemini-2.5-flash'),
  ('copy_adaptive', 'Copy Adaptativa', 'pen-tool', 'gemini-2.5-flash'),
  ('article_estimator', 'Estimador de Potencial', 'bar-chart', 'gemini-2.5-flash'),
  ('article_reconstructor', 'Reconstrutor', 'refresh-cw', 'gemini-2.5-flash'),
  ('telegram_product', 'Telegram/Produtos', 'shopping-bag', 'gemini-2.5-flash'),
  ('image_studio', 'Image Studio', 'image', 'gemini-2.0-flash')
ON CONFLICT (sector_key) DO NOTHING;