ALTER TABLE public.user_scale_configs
ADD COLUMN IF NOT EXISTS pdv_input_mode TEXT NOT NULL DEFAULT 'manual'
CHECK (pdv_input_mode IN ('manual', 'automatic'));