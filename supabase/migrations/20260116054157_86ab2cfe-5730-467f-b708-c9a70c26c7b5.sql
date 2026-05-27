-- Atualizar função handle_new_user para aceitar UUID ou ref_key como indicador_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_indicador_id UUID;
  v_ref_key TEXT;
  v_user_name TEXT;
  v_indicador_input TEXT;
BEGIN
  -- Buscar nome do usuário
  v_user_name := COALESCE(
    NEW.raw_user_meta_data->>'name', 
    NEW.raw_user_meta_data->>'full_name', 
    split_part(NEW.email, '@', 1)
  );
  
  -- Buscar indicador_id dos metadados (pode ser UUID ou ref_key)
  v_indicador_input := NEW.raw_user_meta_data->>'indicador_id';
  
  IF v_indicador_input IS NOT NULL AND v_indicador_input != '' THEN
    -- Tentar converter como UUID primeiro
    BEGIN
      v_indicador_id := v_indicador_input::UUID;
      
      -- Validar se o indicador existe na tabela profiles
      IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_indicador_id) THEN
        v_indicador_id := NULL;
      END IF;
    EXCEPTION WHEN invalid_text_representation THEN
      -- Se não é UUID válido, buscar por ref_key na tabela profiles
      SELECT id INTO v_indicador_id 
      FROM public.profiles 
      WHERE ref_key = v_indicador_input;
    END;
  END IF;
  
  -- Gerar ref_key para o novo usuário
  v_ref_key := public.generate_ref_key(v_user_name);
  
  -- Inserir ou atualizar profile
  INSERT INTO public.profiles (
    id, email, name, phone, company, status, whatsapp,
    indicador_id, ref_key
  )
  VALUES (
    NEW.id, NEW.email, v_user_name,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'company',
    COALESCE((NEW.raw_user_meta_data->>'status')::user_status, 'user'::user_status),
    NEW.raw_user_meta_data->>'whatsapp',
    v_indicador_id, v_ref_key
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    whatsapp = COALESCE(EXCLUDED.whatsapp, profiles.whatsapp),
    indicador_id = COALESCE(profiles.indicador_id, EXCLUDED.indicador_id),
    ref_key = COALESCE(profiles.ref_key, EXCLUDED.ref_key),
    updated_at = now();
    
  RETURN NEW;
END;
$$;