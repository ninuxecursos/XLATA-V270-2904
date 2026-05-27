-- Config for the autonomous growth engine
CREATE TABLE public.growth_engine_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode text NOT NULL DEFAULT 'manual' CHECK (mode IN ('manual', 'semi_auto', 'auto')),
  max_actions_per_day integer NOT NULL DEFAULT 5,
  max_rewrites_per_day integer NOT NULL DEFAULT 2,
  max_new_articles_per_day integer NOT NULL DEFAULT 1,
  protect_top5 boolean NOT NULL DEFAULT true,
  protect_high_conversion boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT false,
  last_run_at timestamptz,
  next_run_at timestamptz,
  run_interval_hours integer NOT NULL DEFAULT 24,
  total_actions_executed integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.growth_engine_config (mode) VALUES ('manual');

CREATE TABLE public.growth_engine_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  article_title text,
  action_type text NOT NULL,
  action_reason text,
  priority text DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'executing', 'success', 'failed', 'rolled_back', 'skipped')),
  result_summary text,
  error_message text,
  ranking_before integer,
  ranking_after integer,
  views_before integer,
  views_after integer,
  executed_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.content_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  action_id uuid REFERENCES public.growth_engine_actions(id) ON DELETE SET NULL,
  content_html text,
  content_md text,
  title text,
  seo_title text,
  seo_description text,
  tags text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.growth_engine_learnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('positive', 'negative', 'neutral')),
  details text,
  article_id uuid REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  metric_changed text,
  metric_before numeric,
  metric_after numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.growth_engine_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_engine_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_engine_learnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on growth_engine_config" ON public.growth_engine_config FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin full access on growth_engine_actions" ON public.growth_engine_actions FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin full access on content_snapshots" ON public.content_snapshots FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin full access on growth_engine_learnings" ON public.growth_engine_learnings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER update_growth_engine_config_updated_at BEFORE UPDATE ON public.growth_engine_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();