-- Replace the function with corrected categories and materials for recycling business
CREATE OR REPLACE FUNCTION create_default_categories_and_materials(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category_id UUID;
BEGIN

  -- 1. FERROSO (gray - iron and ferrous metals)
  INSERT INTO material_categories (user_id, name, color, hex_color, display_order, is_system, is_required, is_active, system_key)
  VALUES (p_user_id, 'Ferroso', 'gray', '#374151', 0, true, true, true, 'ferroso')
  ON CONFLICT (user_id, system_key) WHERE system_key IS NOT NULL DO NOTHING
  RETURNING id INTO v_category_id;
  
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

  -- 2. METAIS NÃO FERROSO (slate - non-ferrous metals)
  INSERT INTO material_categories (user_id, name, color, hex_color, display_order, is_system, is_required, is_active, system_key)
  VALUES (p_user_id, 'Metais Não Ferroso', 'slate', '#64748B', 1, true, true, true, 'nao_ferroso')
  ON CONFLICT (user_id, system_key) WHERE system_key IS NOT NULL DO NOTHING
  RETURNING id INTO v_category_id;
  
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

  -- 3. COBRE (orange - copper materials, WITHOUT Cavaco)
  INSERT INTO material_categories (user_id, name, color, hex_color, display_order, is_system, is_required, is_active, system_key)
  VALUES (p_user_id, 'Cobre', 'orange', '#EA580C', 2, true, true, true, 'cobre')
  ON CONFLICT (user_id, system_key) WHERE system_key IS NOT NULL DO NOTHING
  RETURNING id INTO v_category_id;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO materials (user_id, name, price, sale_price, unit, category_id, is_default)
    VALUES 
      (p_user_id, 'Cobre Mel', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Cobre Misto', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Cobre Queimado', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Radiador Cobre', 0, 0, 'kg', v_category_id, true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 4. ALUMÍNIO (sky blue - aluminum, includes Aerosol)
  INSERT INTO material_categories (user_id, name, color, hex_color, display_order, is_system, is_required, is_active, system_key)
  VALUES (p_user_id, 'Alumínio', 'sky', '#0EA5E9', 3, true, true, true, 'aluminio')
  ON CONFLICT (user_id, system_key) WHERE system_key IS NOT NULL DO NOTHING
  RETURNING id INTO v_category_id;
  
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

  -- 5. VIDRO (green - glass materials)
  INSERT INTO material_categories (user_id, name, color, hex_color, display_order, is_system, is_required, is_active, system_key)
  VALUES (p_user_id, 'Vidro', 'green', '#22C55E', 4, true, true, true, 'vidro')
  ON CONFLICT (user_id, system_key) WHERE system_key IS NOT NULL DO NOTHING
  RETURNING id INTO v_category_id;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO materials (user_id, name, price, sale_price, unit, category_id, is_default)
    VALUES 
      (p_user_id, 'Garrafas', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Vidros', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Vidro Misto', 0, 0, 'kg', v_category_id, true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 6. ELETRÔNICOS (purple - electronics)
  INSERT INTO material_categories (user_id, name, color, hex_color, display_order, is_system, is_required, is_active, system_key)
  VALUES (p_user_id, 'Eletrônicos', 'purple', '#A855F7', 5, true, true, true, 'eletronicos')
  ON CONFLICT (user_id, system_key) WHERE system_key IS NOT NULL DO NOTHING
  RETURNING id INTO v_category_id;
  
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

  -- 7. PLÁSTICOS (blue - plastics)
  INSERT INTO material_categories (user_id, name, color, hex_color, display_order, is_system, is_required, is_active, system_key)
  VALUES (p_user_id, 'Plásticos', 'blue', '#3B82F6', 6, true, true, true, 'plasticos')
  ON CONFLICT (user_id, system_key) WHERE system_key IS NOT NULL DO NOTHING
  RETURNING id INTO v_category_id;
  
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

  -- 8. PAPEL E PAPELÃO (amber/brown - paper and cardboard)
  INSERT INTO material_categories (user_id, name, color, hex_color, display_order, is_system, is_required, is_active, system_key)
  VALUES (p_user_id, 'Papel e Papelão', 'amber', '#D97706', 7, true, true, true, 'papel')
  ON CONFLICT (user_id, system_key) WHERE system_key IS NOT NULL DO NOTHING
  RETURNING id INTO v_category_id;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO materials (user_id, name, price, sale_price, unit, category_id, is_default)
    VALUES 
      (p_user_id, 'Papelão', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Papel Branco', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Papel Misto', 0, 0, 'kg', v_category_id, true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 9. FIOS E CABOS (yellow - wires and cables)
  INSERT INTO material_categories (user_id, name, color, hex_color, display_order, is_system, is_required, is_active, system_key)
  VALUES (p_user_id, 'Fios e Cabos', 'yellow', '#EAB308', 8, true, false, true, 'fios_cabos')
  ON CONFLICT (user_id, system_key) WHERE system_key IS NOT NULL DO NOTHING
  RETURNING id INTO v_category_id;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO materials (user_id, name, price, sale_price, unit, category_id, is_default)
    VALUES 
      (p_user_id, 'Fio Instalação', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Fio PP', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Fio Off-Set', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Chicotes', 0, 0, 'kg', v_category_id, true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 10. BATERIAS E CHUMBO (red - batteries and lead)
  INSERT INTO material_categories (user_id, name, color, hex_color, display_order, is_system, is_required, is_active, system_key)
  VALUES (p_user_id, 'Baterias e Chumbo', 'red', '#DC2626', 9, true, false, true, 'baterias')
  ON CONFLICT (user_id, system_key) WHERE system_key IS NOT NULL DO NOTHING
  RETURNING id INTO v_category_id;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO materials (user_id, name, price, sale_price, unit, category_id, is_default)
    VALUES 
      (p_user_id, 'Baterias Automotivas', 0, 0, 'un', v_category_id, true),
      (p_user_id, 'Chumbo Mole', 0, 0, 'kg', v_category_id, true),
      (p_user_id, 'Chumbo Duro', 0, 0, 'kg', v_category_id, true)
    ON CONFLICT DO NOTHING;
  END IF;

END;
$$;