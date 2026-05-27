CREATE TABLE public.article_traffic_estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  keyword_primary text,
  keyword_type text DEFAULT 'informacional' CHECK (keyword_type IN ('comercial', 'informacional', 'local', 'problema_dor')),
  search_volume text DEFAULT 'medio' CHECK (search_volume IN ('baixo', 'medio', 'alto')),
  ranking_difficulty text DEFAULT 'medio' CHECK (ranking_difficulty IN ('facil', 'medio', 'dificil')),
  current_position integer,
  estimated_monthly_visits integer DEFAULT 0,
  purchase_intent text DEFAULT 'media' CHECK (purchase_intent IN ('baixa', 'media', 'alta')),
  estimated_conversion_rate numeric(5,2) DEFAULT 0,
  estimated_monthly_clients integer DEFAULT 0,
  estimated_monthly_value numeric(10,2) DEFAULT 0,
  value_score integer DEFAULT 0 CHECK (value_score >= 0 AND value_score <= 100),
  classification text DEFAULT 'medio' CHECK (classification IN ('alto', 'medio', 'baixo')),
  visitor_profile text DEFAULT 'curioso' CHECK (visitor_profile IN ('curioso', 'pesquisador', 'comprador')),
  ai_analysis_summary text,
  analyzed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(article_id)
);

ALTER TABLE public.article_traffic_estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage article_traffic_estimates"
  ON public.article_traffic_estimates FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_user_roles WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_user_roles WHERE user_id = auth.uid()));

CREATE INDEX idx_article_traffic_value_score ON public.article_traffic_estimates(value_score DESC);
CREATE INDEX idx_article_traffic_classification ON public.article_traffic_estimates(classification);