CREATE TABLE public.keyword_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL,
  variations text[] DEFAULT '{}',
  category text NOT NULL DEFAULT 'informacional' CHECK (category IN ('comercial', 'informacional', 'local', 'problema_dor')),
  intent text DEFAULT 'informacional' CHECK (intent IN ('compra', 'informacional', 'navegacional', 'transacional')),
  opportunity_score integer DEFAULT 0 CHECK (opportunity_score >= 0 AND opportunity_score <= 100),
  traffic_potential integer DEFAULT 50,
  competition_level integer DEFAULT 50,
  purchase_intent integer DEFAULT 50,
  suggested_title text,
  suggested_slug text,
  source text DEFAULT 'ai_discovery',
  has_existing_article boolean DEFAULT false,
  existing_article_id uuid REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  is_added_to_bank boolean DEFAULT false,
  added_to_bank_at timestamptz,
  topic_bank_id uuid REFERENCES public.seo_topic_bank(id) ON DELETE SET NULL,
  status text DEFAULT 'new' CHECK (status IN ('new', 'approved', 'rejected', 'added_to_bank')),
  notes text,
  discovered_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.keyword_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage keyword_opportunities"
  ON public.keyword_opportunities FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_user_roles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_user_roles WHERE user_id = auth.uid())
  );

CREATE INDEX idx_keyword_opportunities_score ON public.keyword_opportunities(opportunity_score DESC);
CREATE INDEX idx_keyword_opportunities_category ON public.keyword_opportunities(category);
CREATE INDEX idx_keyword_opportunities_status ON public.keyword_opportunities(status);
CREATE UNIQUE INDEX idx_keyword_opportunities_keyword ON public.keyword_opportunities(keyword);