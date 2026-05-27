
-- Add testimonials column to landing_page_settings table
ALTER TABLE public.landing_page_settings 
ADD COLUMN testimonials TEXT DEFAULT '[]';
