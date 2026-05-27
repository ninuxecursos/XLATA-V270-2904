-- Remove is_required restriction from all system categories
-- This allows all categories to be activated/deactivated

UPDATE material_categories 
SET is_required = false 
WHERE is_system = true;

-- Also update the function to not set is_required on new categories
CREATE OR REPLACE FUNCTION create_default_categories_and_materials(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category_id UUID;
  v_category_name TEXT;
  v_category_color TEXT;
  v_category_hex TEXT;
  v_order INT;
  v_categories JSONB := '[
    {"name": "Metais Ferrosos", "color": "blue", "hex": "#3B82F6", "order": 0},
    {"name": "Metais Não-Ferrosos", "color": "amber", "hex": "#F59E0B", "order": 1},
    {"name": "Alumínio", "color": "cyan", "hex": "#06B6D4", "order": 2},
    {"name": "Cobre", "color": "orange", "hex": "#EA580C", "order": 3},
    {"name": "Plásticos", "color": "green", "hex": "#22C55E", "order": 4},
    {"name": "Papel/Papelão", "color": "yellow", "hex": "#EAB308", "order": 5},
    {"name": "Vidro", "color": "purple", "hex": "#A855F7", "order": 6},
    {"name": "Eletrônicos", "color": "indigo", "hex": "#6366F1", "order": 7},
    {"name": "Baterias", "color": "red", "hex": "#EF4444", "order": 8},
    {"name": "Outros", "color": "slate", "hex": "#64748B", "order": 9}
  ]'::jsonb;
  v_cat JSONB;
  v_materials JSONB := '[
    {"name": "Ferro", "category": "Metais Ferrosos"},
    {"name": "Ferro fundido", "category": "Metais Ferrosos"},
    {"name": "Ferro leve", "category": "Metais Ferrosos"},
    {"name": "Ferro pesado", "category": "Metais Ferrosos"},
    {"name": "Vergalhão", "category": "Metais Ferrosos"},
    {"name": "Inox 304", "category": "Metais Não-Ferrosos"},
    {"name": "Bronze", "category": "Metais Não-Ferrosos"},
    {"name": "Metal", "category": "Metais Não-Ferrosos"},
    {"name": "Alum chap", "category": "Alumínio"},
    {"name": "Alum perfil", "category": "Alumínio"},
    {"name": "Latinha", "category": "Alumínio"},
    {"name": "Panela limpa", "category": "Alumínio"},
    {"name": "Panela suja", "category": "Alumínio"},
    {"name": "Papel alum", "category": "Alumínio"},
    {"name": "Radiador alum", "category": "Alumínio"},
    {"name": "Bloco limpo", "category": "Alumínio"},
    {"name": "Bloco misto", "category": "Alumínio"},
    {"name": "Bloco sujo", "category": "Alumínio"},
    {"name": "Roda", "category": "Alumínio"},
    {"name": "Cobre 1", "category": "Cobre"},
    {"name": "Cobre 2", "category": "Cobre"},
    {"name": "Cobre 3", "category": "Cobre"},
    {"name": "Radiador cobre", "category": "Cobre"},
    {"name": "Fio inst", "category": "Cobre"},
    {"name": "Fio pp", "category": "Cobre"},
    {"name": "Fio off-set", "category": "Cobre"},
    {"name": "Cavaco", "category": "Cobre"},
    {"name": "Plástico", "category": "Plásticos"},
    {"name": "Plástico pvc", "category": "Plásticos"},
    {"name": "Plástico ps", "category": "Plásticos"},
    {"name": "Plástico pead", "category": "Plásticos"},
    {"name": "Garrafa pet", "category": "Plásticos"},
    {"name": "Papelão", "category": "Papel/Papelão"},
    {"name": "Vidro", "category": "Vidro"},
    {"name": "Eletrônico", "category": "Eletrônicos"},
    {"name": "Televisão", "category": "Eletrônicos"},
    {"name": "Chumbo mole", "category": "Baterias"},
    {"name": "Chumbo duro", "category": "Baterias"},
    {"name": "Aerosol", "category": "Outros"},
    {"name": "Torneira", "category": "Outros"}
  ]'::jsonb;
  v_mat JSONB;
  v_mat_category_id UUID;
BEGIN
  -- Create categories
  FOR v_cat IN SELECT * FROM jsonb_array_elements(v_categories)
  LOOP
    v_category_name := v_cat->>'name';
    v_category_color := v_cat->>'color';
    v_category_hex := v_cat->>'hex';
    v_order := (v_cat->>'order')::INT;
    
    -- Check if category already exists
    SELECT id INTO v_category_id 
    FROM material_categories 
    WHERE user_id = p_user_id AND name = v_category_name;
    
    IF v_category_id IS NULL THEN
      INSERT INTO material_categories (
        user_id, name, color, hex_color, display_order, is_active, is_system, is_required
      ) VALUES (
        p_user_id, v_category_name, v_category_color, v_category_hex, v_order, true, true, false
      );
    END IF;
  END LOOP;
  
  -- Create materials with category links
  FOR v_mat IN SELECT * FROM jsonb_array_elements(v_materials)
  LOOP
    -- Find the category ID
    SELECT id INTO v_mat_category_id
    FROM material_categories
    WHERE user_id = p_user_id AND name = (v_mat->>'category');
    
    -- Check if material already exists
    IF NOT EXISTS (
      SELECT 1 FROM materials 
      WHERE user_id = p_user_id AND LOWER(name) = LOWER(v_mat->>'name')
    ) THEN
      INSERT INTO materials (
        user_id, name, price, sale_price, unit, category_id
      ) VALUES (
        p_user_id, v_mat->>'name', 0, 0, 'kg', v_mat_category_id
      );
    END IF;
  END LOOP;
END;
$$;