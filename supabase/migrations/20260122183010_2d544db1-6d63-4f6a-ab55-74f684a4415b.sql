-- Update the function to always retrieve category ID even if category exists
CREATE OR REPLACE FUNCTION public.create_default_categories_and_materials(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category_id UUID;
BEGIN

  -- 1. FERROSO
  INSERT INTO material_categories (user_id, name, color, hex_color, display_order, is_system, is_required, is_active, system_key)
  VALUES (p_user_id, 'Ferroso', 'gray', '#374151', 0, true, true, true, 'ferroso')
  ON CONFLICT (user_id, system_key) WHERE system_key IS NOT NULL 
  DO UPDATE SET updated_at = now()
  RETURNING id INTO v_category_id;
  
  IF v_category_id IS NULL THEN
    SELECT id INTO v_category_id FROM material_categories 
    WHERE user_id = p_user_id AND system_key = 'ferroso';
  END IF;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO materials (user_id, name, price, sale_price, unit, category_id, is_default)
    VALUES 
      (p_user_id, 'Ferro', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Ferro Fundido', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Ferro Leve', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Ferro Pesado', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Vergalhão', 0, 0, 'kg', v_category_id, true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 2. METAIS NÃO FERROSO
  INSERT INTO material_categories (user_id, name, color, hex_color, display_order, is_system, is_required, is_active, system_key)
  VALUES (p_user_id, 'Metais Não Ferroso', 'purple', '#7c3aed', 1, true, true, true, 'nao_ferroso')
  ON CONFLICT (user_id, system_key) WHERE system_key IS NOT NULL 
  DO UPDATE SET updated_at = now()
  RETURNING id INTO v_category_id;
  
  IF v_category_id IS NULL THEN
    SELECT id INTO v_category_id FROM material_categories 
    WHERE user_id = p_user_id AND system_key = 'nao_ferroso';
  END IF;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO materials (user_id, name, price, sale_price, unit, category_id, is_default)
    VALUES 
      (p_user_id, 'Bronze', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Inox 304', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Metal', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Torneira', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Latão', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Zinco', 0, 0, 'kg', v_category_id, true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 3. COBRE
  INSERT INTO material_categories (user_id, name, color, hex_color, display_order, is_system, is_required, is_active, system_key)
  VALUES (p_user_id, 'Cobre', 'orange', '#ea580c', 2, true, true, true, 'cobre')
  ON CONFLICT (user_id, system_key) WHERE system_key IS NOT NULL 
  DO UPDATE SET updated_at = now()
  RETURNING id INTO v_category_id;
  
  IF v_category_id IS NULL THEN
    SELECT id INTO v_category_id FROM material_categories 
    WHERE user_id = p_user_id AND system_key = 'cobre';
  END IF;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO materials (user_id, name, price, sale_price, unit, category_id, is_default)
    VALUES 
      (p_user_id, 'Cobre Mel', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Cobre Misto', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Cobre Queimado', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Radiador Cobre', 0, 0, 'kg', v_category_id, true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 4. ALUMÍNIO
  INSERT INTO material_categories (user_id, name, color, hex_color, display_order, is_system, is_required, is_active, system_key)
  VALUES (p_user_id, 'Alumínio', 'sky', '#0ea5e9', 3, true, true, true, 'aluminio')
  ON CONFLICT (user_id, system_key) WHERE system_key IS NOT NULL 
  DO UPDATE SET updated_at = now()
  RETURNING id INTO v_category_id;
  
  IF v_category_id IS NULL THEN
    SELECT id INTO v_category_id FROM material_categories 
    WHERE user_id = p_user_id AND system_key = 'aluminio';
  END IF;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO materials (user_id, name, price, sale_price, unit, category_id, is_default)
    VALUES 
      (p_user_id, 'Alumínio', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Alumínio Lata', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Alumínio Perfil', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Alumínio Chapa', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Aerosol', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Radiador Alumínio', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Panela Limpa', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Panela Suja', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Roda', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Papel Alumínio', 0, 0, 'kg', v_category_id, true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 5. VIDRO
  INSERT INTO material_categories (user_id, name, color, hex_color, display_order, is_system, is_required, is_active, system_key)
  VALUES (p_user_id, 'Vidro', 'blue', '#3b82f6', 4, true, false, true, 'vidro')
  ON CONFLICT (user_id, system_key) WHERE system_key IS NOT NULL 
  DO UPDATE SET updated_at = now()
  RETURNING id INTO v_category_id;
  
  IF v_category_id IS NULL THEN
    SELECT id INTO v_category_id FROM material_categories 
    WHERE user_id = p_user_id AND system_key = 'vidro';
  END IF;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO materials (user_id, name, price, sale_price, unit, category_id, is_default)
    VALUES 
      (p_user_id, 'Garrafas', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Vidros', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Vidro Misto', 0, 0, 'kg', v_category_id, true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 6. ELETRÔNICOS
  INSERT INTO material_categories (user_id, name, color, hex_color, display_order, is_system, is_required, is_active, system_key)
  VALUES (p_user_id, 'Eletrônicos', 'yellow', '#eab308', 5, true, false, true, 'eletronicos')
  ON CONFLICT (user_id, system_key) WHERE system_key IS NOT NULL 
  DO UPDATE SET updated_at = now()
  RETURNING id INTO v_category_id;
  
  IF v_category_id IS NULL THEN
    SELECT id INTO v_category_id FROM material_categories 
    WHERE user_id = p_user_id AND system_key = 'eletronicos';
  END IF;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO materials (user_id, name, price, sale_price, unit, category_id, is_default)
    VALUES 
      (p_user_id, 'Eletrônico', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Televisão', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Memória Ram', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Processador', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Placa Mãe', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Celulares', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Cabos', 0, 0, 'kg', v_category_id, true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 7. PLÁSTICOS
  INSERT INTO material_categories (user_id, name, color, hex_color, display_order, is_system, is_required, is_active, system_key)
  VALUES (p_user_id, 'Plásticos', 'pink', '#ec4899', 6, true, false, true, 'plasticos')
  ON CONFLICT (user_id, system_key) WHERE system_key IS NOT NULL 
  DO UPDATE SET updated_at = now()
  RETURNING id INTO v_category_id;
  
  IF v_category_id IS NULL THEN
    SELECT id INTO v_category_id FROM material_categories 
    WHERE user_id = p_user_id AND system_key = 'plasticos';
  END IF;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO materials (user_id, name, price, sale_price, unit, category_id, is_default)
    VALUES 
      (p_user_id, 'PET', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Garrafa PET', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'PEAD', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'PP', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'PS', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'PVC', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Plástico Misto', 0, 0, 'kg', v_category_id, true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 8. PAPEL E PAPELÃO
  INSERT INTO material_categories (user_id, name, color, hex_color, display_order, is_system, is_required, is_active, system_key)
  VALUES (p_user_id, 'Papel e Papelão', 'brown', '#92400e', 7, true, false, true, 'papel')
  ON CONFLICT (user_id, system_key) WHERE system_key IS NOT NULL 
  DO UPDATE SET updated_at = now()
  RETURNING id INTO v_category_id;
  
  IF v_category_id IS NULL THEN
    SELECT id INTO v_category_id FROM material_categories 
    WHERE user_id = p_user_id AND system_key = 'papel';
  END IF;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO materials (user_id, name, price, sale_price, unit, category_id, is_default)
    VALUES 
      (p_user_id, 'Papelão', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Papel Branco', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Papel Misto', 0, 0, 'kg', v_category_id, true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 9. FIOS E CABOS
  INSERT INTO material_categories (user_id, name, color, hex_color, display_order, is_system, is_required, is_active, system_key)
  VALUES (p_user_id, 'Fios e Cabos', 'red', '#dc2626', 8, true, false, true, 'fios')
  ON CONFLICT (user_id, system_key) WHERE system_key IS NOT NULL 
  DO UPDATE SET updated_at = now()
  RETURNING id INTO v_category_id;
  
  IF v_category_id IS NULL THEN
    SELECT id INTO v_category_id FROM material_categories 
    WHERE user_id = p_user_id AND system_key = 'fios';
  END IF;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO materials (user_id, name, price, sale_price, unit, category_id, is_default)
    VALUES 
      (p_user_id, 'Fio Instalação', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Fio PP', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Fio Off-Set', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Chicotes', 0, 0, 'kg', v_category_id, true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 10. BATERIAS E CHUMBO
  INSERT INTO material_categories (user_id, name, color, hex_color, display_order, is_system, is_required, is_active, system_key)
  VALUES (p_user_id, 'Baterias e Chumbo', 'black', '#1f2937', 9, true, false, true, 'baterias')
  ON CONFLICT (user_id, system_key) WHERE system_key IS NOT NULL 
  DO UPDATE SET updated_at = now()
  RETURNING id INTO v_category_id;
  
  IF v_category_id IS NULL THEN
    SELECT id INTO v_category_id FROM material_categories 
    WHERE user_id = p_user_id AND system_key = 'baterias';
  END IF;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO materials (user_id, name, price, sale_price, unit, category_id, is_default)
    VALUES 
      (p_user_id, 'Baterias Automotivas', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Chumbo Mole', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Chumbo Duro', 0, 0, 'kg', v_category_id, true)
    ON CONFLICT DO NOTHING;
  END IF;

END;
$$;