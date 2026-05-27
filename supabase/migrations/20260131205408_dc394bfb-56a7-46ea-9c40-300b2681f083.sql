-- 1. Adicionar colunas de custo na tabela shop_products
ALTER TABLE shop_products 
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS final_cost NUMERIC(10,2) DEFAULT 0;

-- 2. Adicionar colunas de reativação na tabela shop_interactive_events
ALTER TABLE shop_interactive_events 
  ADD COLUMN IF NOT EXISTS reactivate_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS reactivation_initial_value NUMERIC(10,2);

-- Comentários para documentação
COMMENT ON COLUMN shop_products.cost_price IS 'Custo unitário do produto';
COMMENT ON COLUMN shop_products.final_cost IS 'Custo final incluindo tributos, frete e despesas';
COMMENT ON COLUMN shop_interactive_events.reactivate_at IS 'Data para reativar o produto após cooldown de 3 dias';
COMMENT ON COLUMN shop_interactive_events.reactivation_initial_value IS 'Valor inicial para usar na reativação automática';