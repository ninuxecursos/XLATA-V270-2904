-- Adicionar coluna para registrar ajuste de preço (desconto ou acréscimo) por kg
-- Valores negativos = desconto, valores positivos = acréscimo
-- original_price = preço original do cadastro no momento da transação
-- price_adjustment = diferença entre preço praticado e preço original

ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS original_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_adjustment numeric DEFAULT 0;

-- Comentários para documentação
COMMENT ON COLUMN public.order_items.original_price IS 'Preço original do material no cadastro no momento da transação';
COMMENT ON COLUMN public.order_items.price_adjustment IS 'Ajuste de preço por kg: negativo = desconto, positivo = acréscimo';

-- Índice para consultas de ajustes
CREATE INDEX IF NOT EXISTS idx_order_items_price_adjustment 
ON public.order_items(user_id, price_adjustment) 
WHERE price_adjustment != 0;