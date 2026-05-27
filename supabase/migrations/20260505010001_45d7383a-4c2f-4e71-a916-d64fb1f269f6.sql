ALTER TABLE public.shop_products
  ADD COLUMN IF NOT EXISTS description_about text,
  ADD COLUMN IF NOT EXISTS description_condition text,
  ADD COLUMN IF NOT EXISTS description_highlights jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS specs jsonb DEFAULT '[]'::jsonb;