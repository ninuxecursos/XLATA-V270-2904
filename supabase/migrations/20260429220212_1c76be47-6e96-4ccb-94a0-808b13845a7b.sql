CREATE TABLE IF NOT EXISTS public.seo_optimizer_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  articles_per_day INTEGER NOT NULL DEFAULT 5,
  hours_interval INTEGER NOT NULL DEFAULT 4,
  min_score INTEGER NOT NULL DEFAULT 50,
  last_run_at TIMESTAMPTZ,
  last_article_id UUID,
  articles_today INTEGER NOT NULL DEFAULT 0,
  reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_optimizer_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage seo optimizer config"
ON public.seo_optimizer_config
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

INSERT INTO public.seo_optimizer_config (enabled, articles_per_day, hours_interval, min_score)
SELECT false, 5, 4, 50
WHERE NOT EXISTS (SELECT 1 FROM public.seo_optimizer_config);