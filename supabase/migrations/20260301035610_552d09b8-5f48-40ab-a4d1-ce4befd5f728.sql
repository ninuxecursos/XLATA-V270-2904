-- Phase 1: Fix published_at for 10 posts with NULL
UPDATE blog_posts SET published_at = created_at WHERE published_at IS NULL;

-- Phase 1: Assign categories to uncategorized posts
-- Financeiro/Lucro → Gestão de Ferro Velho e Reciclagem
UPDATE blog_posts SET category_id = '22d33807-9ec6-4857-a9be-8652087cfef0' 
WHERE id IN (
  'd0503032-9b40-4618-8145-3e384aadaca4', -- Como Calcular o Lucro
  '5a8cf66b-e162-4614-ae2f-e68f61658cb4', -- Planilha de Ferro Velho
  'da7a1242-9ca3-43db-9aa1-c9cd14047eb5', -- Controle de Caixa
  '74afcb7d-a099-4c51-bb2f-63141f43064e'  -- Margem de Lucro
);

-- Materiais/Operacional → Guias
UPDATE blog_posts SET category_id = 'd11d8874-0092-4f09-9ad4-e727f86d15c8'
WHERE id IN (
  '0543e465-a0a4-472b-b96d-8bf81ed4ec8b', -- Tabela de Preço
  '1dedaa31-fe84-4d0c-8982-14ff41c4c780', -- Como Montar Depósito
  '53ba71f9-3e53-4396-a6bb-da0e9eb77c36', -- Diferença Tipos Alumínio
  '4c6cf6aa-6931-4683-b76f-d98290f3c04b', -- Como Pesar Material
  'f20b4b1a-7fce-495f-a6d1-0f91ce4aa4e5'  -- Como Organizar Estoque
);

-- Tutoriais
UPDATE blog_posts SET category_id = 'f4aeeb60-9afe-4731-8f72-7203beaadb20'
WHERE id = 'f1989218-4f9d-4292-befc-7797507b4c5c'; -- Como Imprimir Recibo

-- Phase 3: Fix Landing Page SEO
UPDATE global_landing_settings 
SET seo_description = 'Sistema completo para gestão de ferro velho, depósito de reciclagem e sucata. Controle de estoque, caixa, compras e vendas. Teste grátis por 7 dias!',
    seo_title = 'XLata - Sistema para Ferro Velho, Reciclagem e Sucata | Gestão Completa'
WHERE id = '915361aa-4bc3-41ad-8b06-1b5d8f7d63d6';