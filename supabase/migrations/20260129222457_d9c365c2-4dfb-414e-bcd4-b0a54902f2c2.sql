-- Adicionar coluna condition à tabela shop_products
ALTER TABLE shop_products 
ADD COLUMN condition TEXT DEFAULT 'usado' 
CHECK (condition IN ('novo', 'usado', 'no_estado'));