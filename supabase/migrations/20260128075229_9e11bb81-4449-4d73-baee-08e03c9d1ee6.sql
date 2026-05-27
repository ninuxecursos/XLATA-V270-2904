-- Add gemini_api_key column to ai_automation_config table
ALTER TABLE public.ai_automation_config 
ADD COLUMN IF NOT EXISTS gemini_api_key TEXT DEFAULT NULL;