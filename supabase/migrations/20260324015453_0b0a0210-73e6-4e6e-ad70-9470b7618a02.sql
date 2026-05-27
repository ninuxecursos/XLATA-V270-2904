
CREATE TABLE IF NOT EXISTS public.content_scaler_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  max_articles_per_day integer DEFAULT 3,
  min_revenue_threshold numeric DEFAULT 50,
  min_conversion_rate numeric DEFAULT 0.5,
  min_views_threshold integer DEFAULT 50,
  variation_types text[] DEFAULT ARRAY['city','material','problem','question','comparative'],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.content_scaler_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage content_scaler_config"
  ON public.content_scaler_config FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.scaled_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_article_id uuid REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  generated_article_id uuid REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  variation_type text NOT NULL,
  variation_keyword text,
  source_keyword text,
  status text DEFAULT 'pending',
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.scaled_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage scaled_articles"
  ON public.scaled_articles FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.content_scaler_config (max_articles_per_day, min_revenue_threshold, min_conversion_rate, min_views_threshold)
VALUES (3, 50, 0.5, 50)
ON CONFLICT DO NOTHING;
