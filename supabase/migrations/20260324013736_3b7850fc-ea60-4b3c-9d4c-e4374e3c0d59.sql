
-- Index tracking table
CREATE TABLE IF NOT EXISTS public.index_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL UNIQUE,
  page_type text DEFAULT 'blog', -- blog, page, local_seo
  status text DEFAULT 'unknown' CHECK (status IN ('indexed', 'not_indexed', 'unknown')),
  priority text DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'low')),
  first_detected timestamptz DEFAULT now(),
  last_checked timestamptz,
  last_indexed_at timestamptz,
  check_attempts integer DEFAULT 0,
  days_without_index integer DEFAULT 0,
  needs_action boolean DEFAULT false,
  action_taken text,
  article_id uuid REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.index_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access index_tracking" ON public.index_tracking
  FOR ALL USING (public.is_admin());

-- Index alerts
CREATE TABLE IF NOT EXISTS public.index_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  alert_type text NOT NULL, -- 'not_indexed_3d', 'not_indexed_7d', 'lost_index', 'newly_indexed'
  message text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.index_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access index_alerts" ON public.index_alerts
  FOR ALL USING (public.is_admin());

CREATE INDEX idx_index_tracking_status ON public.index_tracking(status);
CREATE INDEX idx_index_tracking_needs_action ON public.index_tracking(needs_action) WHERE needs_action = true;
CREATE INDEX idx_index_alerts_unread ON public.index_alerts(is_read, created_at DESC);
