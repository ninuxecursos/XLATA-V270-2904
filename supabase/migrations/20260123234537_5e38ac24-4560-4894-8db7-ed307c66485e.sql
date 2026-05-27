-- =====================================================
-- CORREÇÃO CRÍTICA: Prevenir exclusão em cascata de order_items
-- =====================================================

-- 1. Remover a constraint atual que tem ON DELETE CASCADE
ALTER TABLE order_items 
  DROP CONSTRAINT IF EXISTS order_items_material_id_fkey;

-- 2. Garantir que material_id pode ser NULL (para preservar registros)
ALTER TABLE order_items 
  ALTER COLUMN material_id DROP NOT NULL;

-- 3. Recriar constraint com ON DELETE SET NULL
-- Isso preserva os order_items quando um material é excluído,
-- apenas setando material_id para NULL
ALTER TABLE order_items 
  ADD CONSTRAINT order_items_material_id_fkey 
  FOREIGN KEY (material_id) 
  REFERENCES materials(id) 
  ON DELETE SET NULL;

-- 4. Adicionar comentário explicativo
COMMENT ON CONSTRAINT order_items_material_id_fkey ON order_items IS 
  'SET NULL ao excluir material para preservar histórico de transações';