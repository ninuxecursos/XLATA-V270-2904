
-- Article keywords mapping
CREATE TABLE IF NOT EXISTS public.article_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES public.blog_posts(id) ON DELETE CASCADE NOT NULL,
  keyword text NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(article_id, keyword)
);

ALTER TABLE public.article_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access article_keywords" ON public.article_keywords
  FOR ALL USING (public.is_admin());

-- Ranking tracking history
CREATE TABLE IF NOT EXISTS public.ranking_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES public.blog_posts(id) ON DELETE CASCADE NOT NULL,
  keyword text NOT NULL,
  position integer,
  url text,
  device text DEFAULT 'desktop' CHECK (device IN ('desktop', 'mobile')),
  checked_at timestamptz DEFAULT now(),
  previous_position integer,
  position_change integer GENERATED ALWAYS AS (
    CASE WHEN previous_position IS NOT NULL AND position IS NOT NULL 
    THEN previous_position - position ELSE NULL END
  ) STORED
);

ALTER TABLE public.ranking_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access ranking_tracking" ON public.ranking_tracking
  FOR ALL USING (public.is_admin());

-- Ranking alerts
CREATE TABLE IF NOT EXISTS public.ranking_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES public.blog_posts(id) ON DELETE CASCADE NOT NULL,
  keyword text NOT NULL,
  alert_type text NOT NULL, -- 'entered_top10', 'dropped', 'lost_ranking', 'opportunity'
  old_position integer,
  new_position integer,
  message text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ranking_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access ranking_alerts" ON public.ranking_alerts
  FOR ALL USING (public.is_admin());

-- Indexes for performance
CREATE INDEX idx_ranking_tracking_article ON public.ranking_tracking(article_id, checked_at DESC);
CREATE INDEX idx_ranking_tracking_keyword ON public.ranking_tracking(keyword, checked_at DESC);
CREATE INDEX idx_article_keywords_article ON public.article_keywords(article_id);
CREATE INDEX idx_ranking_alerts_unread ON public.ranking_alerts(is_read, created_at DESC);
