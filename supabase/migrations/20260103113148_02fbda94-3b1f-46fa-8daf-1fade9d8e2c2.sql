-- Criar bucket para imagens de artigos geradas por IA
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('article-images', 'article-images', true, 5242880)
ON CONFLICT (id) DO NOTHING;

-- Policy de acesso público para leitura
CREATE POLICY "Public access to article images"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-images');

-- Policy para upload de imagens por usuários autenticados
CREATE POLICY "Authenticated users can upload article images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'article-images');

-- Policy para deletar imagens por usuários autenticados
CREATE POLICY "Authenticated users can delete article images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'article-images');

-- Policy para atualizar imagens por usuários autenticados
CREATE POLICY "Authenticated users can update article images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'article-images');