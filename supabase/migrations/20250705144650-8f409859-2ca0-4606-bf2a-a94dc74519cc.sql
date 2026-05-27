

-- Atualizar a função para gerar chaves de referência mais curtas e amigáveis
CREATE OR REPLACE FUNCTION public.generate_ref_key(user_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  clean_name TEXT;
  first_three_chars TEXT;
  current_datetime TIMESTAMP;
  day_part TEXT;
  month_part TEXT;
  hour_part TEXT;
  minute_part TEXT;
  base_key TEXT;
  final_key TEXT;
  counter INTEGER := 1;
BEGIN
  -- Obter data/hora atual
  current_datetime := NOW();
  
  -- Extrair componentes da data/hora
  day_part := LPAD(EXTRACT(DAY FROM current_datetime)::TEXT, 2, '0');
  month_part := LPAD(EXTRACT(MONTH FROM current_datetime)::TEXT, 2, '0');
  hour_part := LPAD(EXTRACT(HOUR FROM current_datetime)::TEXT, 2, '0');
  minute_part := LPAD(EXTRACT(MINUTE FROM current_datetime)::TEXT, 2, '0');
  
  -- Limpar nome para criar chave (remover acentos e caracteres especiais)
  clean_name := UPPER(TRIM(REGEXP_REPLACE(user_name, '[^a-zA-ZÀ-ÿ ]', '', 'g')));
  
  -- Substituir caracteres acentuados
  clean_name := TRANSLATE(clean_name, 
    'ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖòóôõöÙÚÛÜùúûüÇç',
    'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCc'
  );
  
  -- Pegar as primeiras 3 letras do nome (ou completar com X se necessário)
  first_three_chars := SUBSTRING(REGEXP_REPLACE(clean_name, '[^A-Z]', '', 'g'), 1, 3);
  
  -- Se não conseguir 3 caracteres, completar com X
  WHILE LENGTH(first_three_chars) < 3 LOOP
    first_three_chars := first_three_chars || 'X';
  END LOOP;
  
  -- Montar chave base: 3 letras + dia + mês + hora + minuto
  base_key := first_three_chars || day_part || month_part || hour_part || minute_part;
  final_key := base_key;
  
  -- Verificar se já existe e adicionar número se necessário
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE ref_key = final_key) LOOP
    final_key := base_key || counter::TEXT;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_key;
END;
$$;

-- Função para regenerar chaves existentes (opcional, para usuários que já têm chaves longas)
CREATE OR REPLACE FUNCTION public.regenerate_all_ref_keys()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_record RECORD;
  new_key TEXT;
  updated_count INTEGER := 0;
BEGIN
  -- Regenerar chaves para todos os usuários que têm chaves muito longas (mais de 15 caracteres)
  FOR profile_record IN 
    SELECT id, name, created_at 
    FROM public.profiles 
    WHERE ref_key IS NOT NULL AND LENGTH(ref_key) > 15
  LOOP
    -- Gerar nova chave baseada no nome do usuário
    new_key := public.generate_ref_key(COALESCE(profile_record.name, 'Usuario'));
    
    -- Atualizar a chave
    UPDATE public.profiles 
    SET ref_key = new_key 
    WHERE id = profile_record.id;
    
    updated_count := updated_count + 1;
  END LOOP;
  
  RETURN updated_count;
END;
$$;

