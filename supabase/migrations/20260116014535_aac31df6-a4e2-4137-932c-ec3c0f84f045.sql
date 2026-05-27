-- Criar bucket para vídeos da landing page
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'landing-videos',
  'landing-videos',
  true,
  52428800,
  ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Política de leitura pública
CREATE POLICY "Acesso público leitura landing-videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'landing-videos');

-- Política de upload para usuários autenticados
CREATE POLICY "Upload autenticado landing-videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'landing-videos'
  AND auth.role() = 'authenticated'
);

-- Política de update para usuários autenticados
CREATE POLICY "Update autenticado landing-videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'landing-videos'
  AND auth.role() = 'authenticated'
);

-- Política de deleção para usuários autenticados
CREATE POLICY "Deleção autenticado landing-videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'landing-videos'
  AND auth.role() = 'authenticated'
);