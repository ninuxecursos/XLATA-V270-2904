-- Adicionar campos para upload de vídeo e alinhamento na tabela landing_videos
ALTER TABLE public.landing_videos ADD COLUMN IF NOT EXISTS video_file_url TEXT;
ALTER TABLE public.landing_videos ADD COLUMN IF NOT EXISTS column_position INTEGER DEFAULT 2;
ALTER TABLE public.landing_videos ADD COLUMN IF NOT EXISTS video_type TEXT DEFAULT 'url';

-- Adicionar constraints
ALTER TABLE public.landing_videos DROP CONSTRAINT IF EXISTS landing_videos_column_position_check;
ALTER TABLE public.landing_videos ADD CONSTRAINT landing_videos_column_position_check CHECK (column_position BETWEEN 1 AND 3);

ALTER TABLE public.landing_videos DROP CONSTRAINT IF EXISTS landing_videos_video_type_check;
ALTER TABLE public.landing_videos ADD CONSTRAINT landing_videos_video_type_check CHECK (video_type IN ('url', 'upload'));

-- Comentários
COMMENT ON COLUMN public.landing_videos.video_file_url IS 'URL do arquivo de vídeo uploadado';
COMMENT ON COLUMN public.landing_videos.column_position IS 'Posição na coluna (1, 2 ou 3) em desktop';
COMMENT ON COLUMN public.landing_videos.video_type IS 'Tipo de vídeo: url (YouTube/Vimeo) ou upload (arquivo direto)';