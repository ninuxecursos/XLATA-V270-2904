-- Atualizar ref_keys existentes para usar nome (com tratamento de duplicatas)
DO $$
DECLARE
  profile_record RECORD;
  new_key TEXT;
BEGIN
  FOR profile_record IN 
    SELECT id, name 
    FROM public.profiles 
    WHERE ref_key IS NULL OR ref_key ~ '^[A-Z]{3}[0-9]+$'
  LOOP
    new_key := public.generate_ref_key(COALESCE(profile_record.name, 'usuario'));
    
    UPDATE public.profiles 
    SET ref_key = new_key 
    WHERE id = profile_record.id;
  END LOOP;
END $$;