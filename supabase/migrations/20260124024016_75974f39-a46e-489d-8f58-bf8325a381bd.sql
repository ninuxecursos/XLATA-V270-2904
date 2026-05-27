-- Criar tabela de histórico de preços dos materiais
CREATE TABLE IF NOT EXISTS material_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  material_id uuid REFERENCES materials(id) ON DELETE CASCADE NOT NULL,
  material_name text NOT NULL,
  
  -- Valores anteriores
  old_price numeric,
  old_sale_price numeric,
  
  -- Novos valores
  new_price numeric NOT NULL,
  new_sale_price numeric NOT NULL,
  
  -- Metadados
  changed_at timestamptz DEFAULT now() NOT NULL,
  change_type text DEFAULT 'manual'
);

-- Índices para consultas performáticas
CREATE INDEX idx_price_history_material ON material_price_history(material_id);
CREATE INDEX idx_price_history_user ON material_price_history(user_id);
CREATE INDEX idx_price_history_date ON material_price_history(changed_at DESC);

-- RLS
ALTER TABLE material_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own price history"
  ON material_price_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own price history"
  ON material_price_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);