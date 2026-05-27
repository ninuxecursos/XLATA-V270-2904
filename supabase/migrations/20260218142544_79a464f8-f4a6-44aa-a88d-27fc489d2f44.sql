
-- Create ai_usage_log table to track AI API usage
CREATE TABLE public.ai_usage_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usage_type TEXT NOT NULL,
  ai_provider TEXT NOT NULL DEFAULT 'google_gemini',
  ai_model TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
  tokens_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated user to read usage logs
CREATE POLICY "Authenticated users can read ai_usage_log"
ON public.ai_usage_log FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Allow service role to insert (edge functions use service role)
-- For anon/authenticated inserts from edge functions using service key, no policy needed
-- Service role bypasses RLS. But let's also allow authenticated users to insert.
CREATE POLICY "Authenticated users can insert ai_usage_log"
ON public.ai_usage_log FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Create index for daily usage queries
CREATE INDEX idx_ai_usage_log_created_at ON public.ai_usage_log (created_at DESC);
CREATE INDEX idx_ai_usage_log_type_date ON public.ai_usage_log (usage_type, created_at);
