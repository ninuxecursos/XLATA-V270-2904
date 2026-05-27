-- Restaurar o estoque do notebook que foi decrementado incorretamente
UPDATE shop_products 
SET stock_quantity = 1 
WHERE id = '96530bfc-a604-46b7-922d-4422d612eeb7';

-- Cancelar o pedido pendente
UPDATE shop_orders 
SET status = 'cancelled'
WHERE id = 'a88628a1-2094-4aea-9b03-543562038abe' 
  AND status = 'pending';