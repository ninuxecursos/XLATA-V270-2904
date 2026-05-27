-- Add hero image fields to landing_page_settings
ALTER TABLE landing_page_settings
ADD COLUMN IF NOT EXISTS hero_image_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS hero_image_size_desktop TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS hero_image_size_tablet TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS hero_image_size_mobile TEXT DEFAULT 'small',
ADD COLUMN IF NOT EXISTS hero_image_alt TEXT DEFAULT 'Imagem do Hero';