-- Adicionar colunas na tabela material_categories
ALTER TABLE material_categories
ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_required BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS hex_color TEXT,
ADD COLUMN IF NOT EXISTS system_key TEXT;

-- Criar índice único para system_key por usuário
CREATE UNIQUE INDEX IF NOT EXISTS idx_material_categories_system_key_user 
ON material_categories(user_id, system_key) 
WHERE system_key IS NOT NULL;

-- Adicionar coluna is_default na tabela materials
ALTER TABLE materials
ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT false;

-- Função para criar categorias e materiais padrão para um usuário
CREATE OR REPLACE FUNCTION create_default_categories_and_materials(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category_id UUID;
BEGIN
  -- 1. METAIS (obrigatório)
  INSERT INTO material_categories (user_id, name, color, hex_color, display_order, is_system, is_required, is_active, system_key)
  VALUES (p_user_id, 'Metais', 'gray', '#4B4B4B', 0, true, true, true, 'metais')
  ON CONFLICT (user_id, system_key) WHERE system_key IS NOT NULL DO NOTHING
  RETURNING id INTO v_category_id;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO materials (user_id, name, price, sale_price, unit, category_id, is_default)
    VALUES 
      (p_user_id, 'Ferro', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Aço', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Alumínio', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Alumínio Lata', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Alumínio Perfil', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Cobre Mel', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Cobre Misto', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Cobre Queimado', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Latão', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Bronze', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Inox', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Zinco', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Chumbo', 0, 0, 'kg', v_category_id, true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 2. PLÁSTICOS (obrigatório)
  INSERT INTO material_categories (user_id, name, color, hex_color, display_order, is_system, is_required, is_active, system_key)
  VALUES (p_user_id, 'Plásticos', 'blue', '#1E88E5', 1, true, true, true, 'plasticos')
  ON CONFLICT (user_id, system_key) WHERE system_key IS NOT NULL DO NOTHING
  RETURNING id INTO v_category_id;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO materials (user_id, name, price, sale_price, unit, category_id, is_default)
    VALUES 
      (p_user_id, 'PET', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'PEAD (HDPE)', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'PEBD (LDPE)', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'PP', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'PS', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'PVC', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Plástico Misto', 0, 0, 'kg', v_category_id, true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 3. PAPEL E PAPELÃO (obrigatório)
  INSERT INTO material_categories (user_id, name, color, hex_color, display_order, is_system, is_required, is_active, system_key)
  VALUES (p_user_id, 'Papel e Papelão', 'brown', '#8D6E63', 2, true, true, true, 'papel_papelao')
  ON CONFLICT (user_id, system_key) WHERE system_key IS NOT NULL DO NOTHING
  RETURNING id INTO v_category_id;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO materials (user_id, name, price, sale_price, unit, category_id, is_default)
    VALUES 
      (p_user_id, 'Papelão', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Papel Branco', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Papel Misto', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Jornal / Revista', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Caixa Longa Vida', 0, 0, 'kg', v_category_id, true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 4. VIDRO (obrigatório)
  INSERT INTO material_categories (user_id, name, color, hex_color, display_order, is_system, is_required, is_active, system_key)
  VALUES (p_user_id, 'Vidro', 'green', '#2E7D32', 3, true, true, true, 'vidro')
  ON CONFLICT (user_id, system_key) WHERE system_key IS NOT NULL DO NOTHING
  RETURNING id INTO v_category_id;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO materials (user_id, name, price, sale_price, unit, category_id, is_default)
    VALUES 
      (p_user_id, 'Vidro Incolor', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Vidro Verde', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Vidro Marrom', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Vidro Misto', 0, 0, 'kg', v_category_id, true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 5. ELETRÔNICOS (obrigatório)
  INSERT INTO material_categories (user_id, name, color, hex_color, display_order, is_system, is_required, is_active, system_key)
  VALUES (p_user_id, 'Eletrônicos (E-lixo)', 'purple', '#6A1B9A', 4, true, true, true, 'eletronicos')
  ON CONFLICT (user_id, system_key) WHERE system_key IS NOT NULL DO NOTHING
  RETURNING id INTO v_category_id;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO materials (user_id, name, price, sale_price, unit, category_id, is_default)
    VALUES 
      (p_user_id, 'Placas Eletrônicas', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Computadores', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Celulares', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Cabos', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Fontes', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Eletrodomésticos Pequenos', 0, 0, 'kg', v_category_id, true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 6. SUCATA AUTOMOTIVA (opcional)
  INSERT INTO material_categories (user_id, name, color, hex_color, display_order, is_system, is_required, is_active, system_key)
  VALUES (p_user_id, 'Sucata Automotiva', 'red', '#C62828', 5, true, false, true, 'sucata_automotiva')
  ON CONFLICT (user_id, system_key) WHERE system_key IS NOT NULL DO NOTHING
  RETURNING id INTO v_category_id;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO materials (user_id, name, price, sale_price, unit, category_id, is_default)
    VALUES 
      (p_user_id, 'Baterias Automotivas', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Radiadores', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Motores', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Alternadores', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Chicotes', 0, 0, 'kg', v_category_id, true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 7. BORRACHA (opcional)
  INSERT INTO material_categories (user_id, name, color, hex_color, display_order, is_system, is_required, is_active, system_key)
  VALUES (p_user_id, 'Borracha', 'black', '#212121', 6, true, false, true, 'borracha')
  ON CONFLICT (user_id, system_key) WHERE system_key IS NOT NULL DO NOTHING
  RETURNING id INTO v_category_id;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO materials (user_id, name, price, sale_price, unit, category_id, is_default)
    VALUES 
      (p_user_id, 'Pneus', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Borracha Industrial', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Correias', 0, 0, 'kg', v_category_id, true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 8. MADEIRA (opcional)
  INSERT INTO material_categories (user_id, name, color, hex_color, display_order, is_system, is_required, is_active, system_key)
  VALUES (p_user_id, 'Madeira', 'beige', '#D7CCC8', 7, true, false, true, 'madeira')
  ON CONFLICT (user_id, system_key) WHERE system_key IS NOT NULL DO NOTHING
  RETURNING id INTO v_category_id;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO materials (user_id, name, price, sale_price, unit, category_id, is_default)
    VALUES 
      (p_user_id, 'Paletes', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Caixotes', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Madeira Mista', 0, 0, 'kg', v_category_id, true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 9. TÊXTIL (opcional)
  INSERT INTO material_categories (user_id, name, color, hex_color, display_order, is_system, is_required, is_active, system_key)
  VALUES (p_user_id, 'Têxtil', 'pink', '#EC407A', 8, true, false, true, 'textil')
  ON CONFLICT (user_id, system_key) WHERE system_key IS NOT NULL DO NOTHING
  RETURNING id INTO v_category_id;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO materials (user_id, name, price, sale_price, unit, category_id, is_default)
    VALUES 
      (p_user_id, 'Roupas', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Retalhos', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Tecidos Industriais', 0, 0, 'kg', v_category_id, true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 10. ÓLEO E RESÍDUOS ESPECIAIS (opcional)
  INSERT INTO material_categories (user_id, name, color, hex_color, display_order, is_system, is_required, is_active, system_key)
  VALUES (p_user_id, 'Óleo e Resíduos Especiais', 'orange', '#FB8C00', 9, true, false, true, 'oleo_residuos')
  ON CONFLICT (user_id, system_key) WHERE system_key IS NOT NULL DO NOTHING
  RETURNING id INTO v_category_id;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO materials (user_id, name, price, sale_price, unit, category_id, is_default)
    VALUES 
      (p_user_id, 'Óleo Usado', 0, 0, 'l', v_category_id, true),
      (p_user_id, 'Graxa', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Filtros', 0, 0, 'kg', v_category_id, true)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;

-- Função RPC para seed de categorias (chamada pelo frontend)
CREATE OR REPLACE FUNCTION seed_default_categories_for_current_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM create_default_categories_and_materials(auth.uid());
END;
$$;