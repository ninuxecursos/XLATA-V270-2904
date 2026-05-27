-- =============================================================
-- 1. ai_prompts
-- =============================================================
CREATE TABLE IF NOT EXISTS public.ai_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL DEFAULT '',
  user_prompt_template TEXT NOT NULL DEFAULT '',
  placeholders JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view ai_prompts"
  ON public.ai_prompts FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert ai_prompts"
  ON public.ai_prompts FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update ai_prompts"
  ON public.ai_prompts FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete ai_prompts"
  ON public.ai_prompts FOR DELETE
  USING (public.is_admin());

CREATE TRIGGER trg_ai_prompts_updated_at
  BEFORE UPDATE ON public.ai_prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================
-- 2. article_jobs
-- =============================================================
CREATE TABLE IF NOT EXISTS public.article_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','generating','completed','error','cancelled')),
  progress INTEGER NOT NULL DEFAULT 0
    CHECK (progress >= 0 AND progress <= 100),
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  blog_post_id UUID,
  topic_id UUID,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_article_jobs_status_sched
  ON public.article_jobs (status, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_article_jobs_created_at
  ON public.article_jobs (created_at DESC);

ALTER TABLE public.article_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view article_jobs"
  ON public.article_jobs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert article_jobs"
  ON public.article_jobs FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update article_jobs"
  ON public.article_jobs FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete article_jobs"
  ON public.article_jobs FOR DELETE
  USING (public.is_admin());

CREATE TRIGGER trg_article_jobs_updated_at
  BEFORE UPDATE ON public.article_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'article_jobs'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.article_jobs';
  END IF;
END $$;