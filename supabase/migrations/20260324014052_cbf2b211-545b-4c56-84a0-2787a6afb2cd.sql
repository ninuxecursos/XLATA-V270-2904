
-- SEO optimization scores and suggestions
CREATE TABLE IF NOT EXISTS public.seo_optimization_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES public.blog_posts(id) ON DELETE CASCADE NOT NULL UNIQUE,
  opportunity_score integer DEFAULT 0, -- 0-100
  ranking_score integer DEFAULT 0,
  freshness_score integer DEFAULT 0,
  content_score integer DEFAULT 0,
  cta_score integer DEFAULT 0,
  interlinking_score integer DEFAULT 0,
  best_keyword text,
  best_position integer,
  position_trend text DEFAULT 'stable', -- rising, falling, stable
  days_since_update integer DEFAULT 0,
  word_count integer DEFAULT 0,
  has_ctas boolean DEFAULT false,
  internal_links_count integer DEFAULT 0,
  suggestions jsonb DEFAULT '[]'::jsonb,
  priority text DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
  last_analyzed timestamptz,
  last_optimized timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.seo_optimization_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access seo_optimization_scores" ON public.seo_optimization_scores
  FOR ALL USING (public.is_admin());

CREATE INDEX idx_seo_scores_opportunity ON public.seo_optimization_scores(opportunity_score DESC);
CREATE INDEX idx_seo_scores_priority ON public.seo_optimization_scores(priority);
