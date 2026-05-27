ALTER TABLE public.seo_topic_bank
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_seo_topic_bank_scheduled_for
  ON public.seo_topic_bank(scheduled_for)
  WHERE scheduled_for IS NOT NULL AND is_used = false;