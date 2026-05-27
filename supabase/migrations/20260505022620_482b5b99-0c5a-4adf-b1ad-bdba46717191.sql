ALTER TABLE public.ai_usage_log
  ADD COLUMN IF NOT EXISTS input_tokens INTEGER,
  ADD COLUMN IF NOT EXISTS output_tokens INTEGER,
  ADD COLUMN IF NOT EXISTS estimated_cost_usd NUMERIC(10,6),
  ADD COLUMN IF NOT EXISTS feature_label TEXT,
  ADD COLUMN IF NOT EXISTS reference_id TEXT;

CREATE INDEX IF NOT EXISTS idx_ai_usage_log_usage_type_created ON public.ai_usage_log (usage_type, created_at DESC);