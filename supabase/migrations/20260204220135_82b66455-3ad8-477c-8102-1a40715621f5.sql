-- =====================================================
-- TELEGRAM PRODUCT REGISTRATION SYSTEM
-- Enterprise-grade implementation with all 12 adjustments
-- =====================================================

-- 1. Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('shop-product-images', 'shop-product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage policies
CREATE POLICY "Public read access for shop product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'shop-product-images');

CREATE POLICY "Service role can manage shop product images"
ON storage.objects FOR ALL
USING (bucket_id = 'shop-product-images');

-- 3. Telegram bot configuration table
CREATE TABLE IF NOT EXISTS public.telegram_bot_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_token text NOT NULL,
  allowed_chat_ids bigint[] DEFAULT '{}',
  default_category_id uuid REFERENCES shop_categories(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  webhook_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.telegram_bot_config ENABLE ROW LEVEL SECURITY;

-- Only admins can manage bot config
CREATE POLICY "Admins can manage telegram bot config"
ON public.telegram_bot_config FOR ALL
USING (public.is_admin());

-- 4. Telegram product pending table (AJUSTE A: photos as array of objects)
CREATE TABLE IF NOT EXISTS public.telegram_product_pending (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_group_id text UNIQUE NOT NULL,
  chat_id bigint NOT NULL,
  
  -- AJUSTE A: Array of objects instead of parallel arrays
  -- Format: [{"message_id": 12345, "file_id": "AgACAgI..."}]
  photos jsonb DEFAULT '[]',
  
  -- AJUSTE 1 + 6: Accumulated text and AI response
  raw_user_text text DEFAULT '',
  ai_parsed_data jsonb,
  
  -- Storage and product
  temp_image_urls jsonb DEFAULT '[]',
  product_id uuid REFERENCES shop_products(id) ON DELETE SET NULL,
  
  -- Status machine
  status text DEFAULT 'collecting' 
    CHECK (status IN ('collecting', 'processing', 'pending_approval', 'approved', 'rejected', 'expired')),
  
  -- Flow control
  preview_message_id bigint,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '24 hours')
);

ALTER TABLE public.telegram_product_pending ENABLE ROW LEVEL SECURITY;

-- Service role access for edge functions
CREATE POLICY "Service role can manage telegram pending"
ON public.telegram_product_pending FOR ALL
USING (true);

-- Optimized indexes
CREATE INDEX IF NOT EXISTS idx_telegram_pending_debounce
ON telegram_product_pending(status, updated_at)
WHERE status = 'collecting';

CREATE INDEX IF NOT EXISTS idx_telegram_pending_media_group 
ON telegram_product_pending(media_group_id);

CREATE INDEX IF NOT EXISTS idx_telegram_pending_expires 
ON telegram_product_pending(expires_at, status)
WHERE status = 'pending_approval';

CREATE INDEX IF NOT EXISTS idx_telegram_pending_preview_msg
ON telegram_product_pending(preview_message_id, chat_id)
WHERE preview_message_id IS NOT NULL;

-- 5. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_telegram_pending_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS telegram_pending_updated_at ON telegram_product_pending;
CREATE TRIGGER telegram_pending_updated_at
  BEFORE UPDATE ON telegram_product_pending
  FOR EACH ROW
  EXECUTE FUNCTION update_telegram_pending_timestamp();

-- 6. RPC for UPSERT with object array (AJUSTE A + 5 + 6)
CREATE OR REPLACE FUNCTION upsert_telegram_pending(
  p_media_group_id text,
  p_chat_id bigint,
  p_message_id bigint,
  p_photo_file_id text,
  p_caption text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_photo jsonb;
BEGIN
  -- AJUSTE A: Create object {message_id, file_id}
  IF p_photo_file_id IS NOT NULL THEN
    new_photo := jsonb_build_object(
      'message_id', p_message_id,
      'file_id', p_photo_file_id
    );
  END IF;

  INSERT INTO telegram_product_pending (
    media_group_id,
    chat_id,
    photos,
    raw_user_text,
    status,
    updated_at
  ) VALUES (
    p_media_group_id,
    p_chat_id,
    CASE WHEN new_photo IS NOT NULL 
         THEN jsonb_build_array(new_photo) 
         ELSE '[]'::jsonb END,
    COALESCE(p_caption, ''),
    'collecting',
    now()
  )
  ON CONFLICT (media_group_id) DO UPDATE SET
    -- AJUSTE A + 5: Deduplicate by message_id within object
    photos = CASE 
      WHEN new_photo IS NOT NULL THEN (
        SELECT COALESCE(
          jsonb_agg(photo ORDER BY (photo->>'message_id')::bigint),
          '[]'::jsonb
        )
        FROM (
          SELECT DISTINCT ON ((elem->>'message_id')::bigint) elem AS photo
          FROM jsonb_array_elements(
            telegram_product_pending.photos || jsonb_build_array(new_photo)
          ) AS elem
          ORDER BY (elem->>'message_id')::bigint
        ) subq
      )
      ELSE telegram_product_pending.photos
    END,
    -- AJUSTE 6: Text accumulation
    raw_user_text = CASE 
      WHEN p_caption IS NOT NULL AND p_caption != '' THEN
        CASE 
          WHEN telegram_product_pending.raw_user_text = '' THEN p_caption
          ELSE telegram_product_pending.raw_user_text || E'\n' || p_caption
        END
      ELSE telegram_product_pending.raw_user_text
    END,
    updated_at = now();
END;
$$;

-- 7. RPC for Enterprise Lock (AJUSTE 2)
CREATE OR REPLACE FUNCTION lock_ready_telegram_groups()
RETURNS SETOF telegram_product_pending
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  UPDATE telegram_product_pending
  SET status = 'processing'
  WHERE id IN (
    SELECT id
    FROM telegram_product_pending
    WHERE status = 'collecting'
    AND updated_at < now() - interval '5 seconds'
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
END;
$$;

-- 8. RPC for expired cleanup (AJUSTE 7)
CREATE OR REPLACE FUNCTION cleanup_expired_telegram_pending()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  affected_count integer;
BEGIN
  -- Mark as expired
  UPDATE telegram_product_pending
  SET status = 'expired'
  WHERE status = 'pending_approval'
  AND expires_at < now();
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  
  -- Delete very old records (more than 7 days)
  DELETE FROM telegram_product_pending
  WHERE status IN ('expired', 'rejected', 'approved')
  AND updated_at < now() - interval '7 days';
  
  RETURN affected_count;
END;
$$;