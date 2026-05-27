
-- Pinterest Config table
CREATE TABLE public.pinterest_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  app_id text,
  app_secret text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  is_enabled boolean NOT NULL DEFAULT false,
  default_board_id text,
  boards_cache jsonb DEFAULT '[]'::jsonb,
  delay_minutes integer NOT NULL DEFAULT 5,
  max_pins_per_product integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pinterest_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read pinterest_config"
  ON public.pinterest_config FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert pinterest_config"
  ON public.pinterest_config FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update pinterest_config"
  ON public.pinterest_config FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete pinterest_config"
  ON public.pinterest_config FOR DELETE
  USING (auth.uid() IS NOT NULL);

CREATE TRIGGER update_pinterest_config_updated_at
  BEFORE UPDATE ON public.pinterest_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Pinterest Pins Log table
CREATE TABLE public.pinterest_pins_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES public.shop_products(id) ON DELETE CASCADE,
  pin_id text,
  board_id text,
  pin_url text,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  title text,
  description text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pinterest_pins_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read pinterest_pins_log"
  ON public.pinterest_pins_log FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert pinterest_pins_log"
  ON public.pinterest_pins_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update pinterest_pins_log"
  ON public.pinterest_pins_log FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete pinterest_pins_log"
  ON public.pinterest_pins_log FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Pinterest Category Boards mapping
CREATE TABLE public.pinterest_category_boards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id uuid REFERENCES public.shop_categories(id) ON DELETE CASCADE,
  board_id text NOT NULL,
  board_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pinterest_category_boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage pinterest_category_boards"
  ON public.pinterest_category_boards FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Index for faster lookups
CREATE INDEX idx_pinterest_pins_log_product_id ON public.pinterest_pins_log(product_id);
CREATE INDEX idx_pinterest_pins_log_status ON public.pinterest_pins_log(status);
CREATE INDEX idx_pinterest_category_boards_category_id ON public.pinterest_category_boards(category_id);
