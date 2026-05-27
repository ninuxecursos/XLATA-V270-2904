
-- Fix 3 glossary duplicates: noindex and set canonical to primary term
UPDATE glossary_terms SET allow_indexing = false, canonical_url = 'https://xlata.site/glossario/pdv' WHERE id = '865b2fee-d629-42e2-ba7f-80b096796e87';
UPDATE glossary_terms SET allow_indexing = false, canonical_url = 'https://xlata.site/glossario/pet' WHERE id = '5ac377ac-3315-421f-884d-e3483e5d6b59';
UPDATE glossary_terms SET allow_indexing = false, canonical_url = 'https://xlata.site/glossario/tara' WHERE id = 'be6a1376-51e1-4821-a3b9-e577c5856262';

-- Fix blog cannibalization: noindex weaker posts and canonical to stronger ones

-- Erros: keep erros-comuns (8326 chars), noindex 10-erros-comuns (2675 chars)
UPDATE blog_posts SET allow_indexing = false, canonical_url = 'https://xlata.site/blog/erros-comuns-gestao-ferro-velho' WHERE id = '2c7d4be8-8610-4a60-bc52-d8a86b48ca36';

-- Controle de Caixa: keep como-controlar (7872 chars), noindex the other 2
UPDATE blog_posts SET allow_indexing = false, canonical_url = 'https://xlata.site/blog/como-controlar-caixa-ferro-velho-corretamente' WHERE id = 'da7a1242-9ca3-43db-9aa1-c9cd14047eb5';
UPDATE blog_posts SET allow_indexing = false, canonical_url = 'https://xlata.site/blog/como-controlar-caixa-ferro-velho-corretamente' WHERE id = '8a49545e-12bb-4300-ba33-1098ce553887';

-- Como Organizar: keep como-organizar-deposito (1451 chars), noindex estoque (1307 chars)
UPDATE blog_posts SET allow_indexing = false, canonical_url = 'https://xlata.site/blog/como-organizar-deposito-reciclagem' WHERE id = 'f20b4b1a-7fce-495f-a6d1-0f91ce4aa4e5';

-- Como Abrir Depósito: keep legalizado (8721 chars), noindex guia-completo (3088 chars)
UPDATE blog_posts SET allow_indexing = false, canonical_url = 'https://xlata.site/blog/como-abrir-deposito-reciclagem-legalizado' WHERE id = 'e9ed3bd3-9870-41cf-9cf2-53dc53c546f0';

-- Preço Materiais: keep tabela (1586 chars), noindex acompanhar (695 chars)
UPDATE blog_posts SET allow_indexing = false, canonical_url = 'https://xlata.site/blog/tabela-preco-materiais-reciclaveis' WHERE id = '02b30506-9380-4b31-8f2f-f0194d8b5c85';
