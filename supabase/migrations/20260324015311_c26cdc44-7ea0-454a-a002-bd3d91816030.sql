
CREATE TABLE IF NOT EXISTS public.article_revenue_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  views integer DEFAULT 0,
  clicks_cta integer DEFAULT 0,
  signups integer DEFAULT 0,
  paying_customers integer DEFAULT 0,
  revenue_generated numeric DEFAULT 0,
  conversion_rate numeric DEFAULT 0,
  revenue_per_visitor numeric DEFAULT 0,
  classification text DEFAULT 'low_performance',
  insight text,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(article_id)
);

ALTER TABLE public.article_revenue_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage article_revenue_tracking"
  ON public.article_revenue_tracking FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Public read article_revenue_tracking"
  ON public.article_revenue_tracking FOR SELECT TO anon USING (true);

CREATE TABLE IF NOT EXISTS public.user_attribution (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_article_id uuid REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  source_url text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  referrer text,
  first_page text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_attribution ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage user_attribution"
  ON public.user_attribution FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Users can insert own attribution"
  ON public.user_attribution FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.conversion_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id text,
  event_type text NOT NULL,
  article_id uuid REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}',
  revenue_value numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read conversion_events"
  ON public.conversion_events FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Anyone can insert conversion_events"
  ON public.conversion_events FOR INSERT TO anon, authenticated
  WITH CHECK (true);
