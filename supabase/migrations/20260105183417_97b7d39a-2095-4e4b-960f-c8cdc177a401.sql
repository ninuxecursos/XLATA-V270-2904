-- Add advanced SEO fields to landing_page_settings table
ALTER TABLE public.landing_page_settings 
ADD COLUMN IF NOT EXISTS og_image text,
ADD COLUMN IF NOT EXISTS og_title text,
ADD COLUMN IF NOT EXISTS og_description text,
ADD COLUMN IF NOT EXISTS twitter_card text DEFAULT 'summary_large_image',
ADD COLUMN IF NOT EXISTS canonical_url text DEFAULT 'https://xlata.site',
ADD COLUMN IF NOT EXISTS robots_directive text DEFAULT 'index, follow',
ADD COLUMN IF NOT EXISTS favicon_url text,
ADD COLUMN IF NOT EXISTS author text DEFAULT 'XLata.site',
ADD COLUMN IF NOT EXISTS json_ld_data text;

-- Add comment for documentation
COMMENT ON COLUMN public.landing_page_settings.og_image IS 'Open Graph image URL for social sharing';
COMMENT ON COLUMN public.landing_page_settings.og_title IS 'Open Graph title for social sharing';
COMMENT ON COLUMN public.landing_page_settings.og_description IS 'Open Graph description for social sharing';
COMMENT ON COLUMN public.landing_page_settings.twitter_card IS 'Twitter card type (summary, summary_large_image)';
COMMENT ON COLUMN public.landing_page_settings.canonical_url IS 'Canonical URL for SEO';
COMMENT ON COLUMN public.landing_page_settings.robots_directive IS 'Robots meta tag directive';
COMMENT ON COLUMN public.landing_page_settings.favicon_url IS 'Custom favicon URL';
COMMENT ON COLUMN public.landing_page_settings.author IS 'Site author for meta tags';
COMMENT ON COLUMN public.landing_page_settings.json_ld_data IS 'Custom JSON-LD structured data';