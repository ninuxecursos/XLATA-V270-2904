-- Populate canonical_url for all content tables with proper absolute URLs

-- Blog posts
UPDATE blog_posts 
SET canonical_url = 'https://xlata.site/blog/' || slug 
WHERE canonical_url IS NULL AND slug IS NOT NULL;

-- Pillar pages (solutions)
UPDATE pillar_pages 
SET canonical_url = 'https://xlata.site/solucoes/' || slug 
WHERE canonical_url IS NULL AND slug IS NOT NULL;

-- Static pages SEO
UPDATE static_pages_seo 
SET canonical_url = 'https://xlata.site' || path 
WHERE canonical_url IS NULL AND path IS NOT NULL;

-- Glossary terms
UPDATE glossary_terms 
SET canonical_url = 'https://xlata.site/glossario/' || slug 
WHERE canonical_url IS NULL AND slug IS NOT NULL;

-- Help articles
UPDATE help_articles 
SET canonical_url = 'https://xlata.site/ajuda/artigo/' || slug 
WHERE canonical_url IS NULL AND slug IS NOT NULL;