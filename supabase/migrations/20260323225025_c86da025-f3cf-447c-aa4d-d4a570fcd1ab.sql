DO $$ 
DECLARE 
  _articles jsonb;
  _article jsonb;
BEGIN
  -- We'll update articles one by one using direct UPDATE statements
  -- Article 1
  UPDATE blog_posts SET reading_time_minutes = 10, updated_at = now() WHERE id = 'fc77690a-bb9d-4e34-a11a-8856988c6b05';
  UPDATE blog_posts SET reading_time_minutes = 9, updated_at = now() WHERE id = '393063fe-6304-4c38-ba1f-780f29d63827';
  UPDATE blog_posts SET reading_time_minutes = 9, updated_at = now() WHERE id = '02b30506-9380-4b31-8f2f-f0194d8b5c85';
  UPDATE blog_posts SET reading_time_minutes = 9, updated_at = now() WHERE id = 'd5d36a46-c001-4875-b4c8-dceaaa7c7180';
  UPDATE blog_posts SET reading_time_minutes = 8, updated_at = now() WHERE id = 'f6ca7393-371c-4b60-b08d-a9b63075a12b';
  UPDATE blog_posts SET reading_time_minutes = 9, updated_at = now() WHERE id = '98563819-0cee-4f64-ac3e-394e804e2e7f';
  UPDATE blog_posts SET reading_time_minutes = 10, updated_at = now() WHERE id = 'cc82e8e0-dd75-44ab-8732-990d8f9d6377';
  UPDATE blog_posts SET reading_time_minutes = 8, updated_at = now() WHERE id = '8a49545e-12bb-4300-ba33-1098ce553887';
  UPDATE blog_posts SET reading_time_minutes = 9, updated_at = now() WHERE id = 'efe598cd-63e4-47e7-97d5-a516b5f2a747';
  UPDATE blog_posts SET reading_time_minutes = 8, updated_at = now() WHERE id = '003ff353-2f86-4ead-b586-fcb8036e39f2';
END $$;