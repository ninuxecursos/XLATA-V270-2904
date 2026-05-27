-- Adicionar campo view_count para contagem de visualizações do produto
ALTER TABLE public.shop_products 
ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;