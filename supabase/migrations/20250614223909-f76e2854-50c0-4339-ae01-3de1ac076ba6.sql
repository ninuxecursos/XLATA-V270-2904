
-- Create storage bucket for landing page images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'landing-images',
  'landing-images', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
);

-- Create policy to allow authenticated users to upload images
CREATE POLICY "Users can upload landing images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'landing-images' AND
  auth.role() = 'authenticated'
);

-- Create policy to allow public read access to landing images
CREATE POLICY "Anyone can view landing images" ON storage.objects
FOR SELECT USING (bucket_id = 'landing-images');

-- Create policy to allow authenticated users to update their uploaded images
CREATE POLICY "Users can update landing images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'landing-images' AND
  auth.role() = 'authenticated'
);

-- Create policy to allow authenticated users to delete landing images
CREATE POLICY "Users can delete landing images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'landing-images' AND
  auth.role() = 'authenticated'
);
