-- Tabela para rastrear progresso de vídeos assistidos
CREATE TABLE public.user_video_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.guide_videos(id) ON DELETE CASCADE,
  watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_completed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- Índices para performance
CREATE INDEX idx_user_video_progress_user_id ON public.user_video_progress(user_id);
CREATE INDEX idx_user_video_progress_video_id ON public.user_video_progress(video_id);

-- Habilitar RLS
ALTER TABLE public.user_video_progress ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own video progress" 
ON public.user_video_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own video progress" 
ON public.user_video_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own video progress" 
ON public.user_video_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own video progress" 
ON public.user_video_progress 
FOR DELETE 
USING (auth.uid() = user_id);