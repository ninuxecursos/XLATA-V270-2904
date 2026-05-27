
-- Adicionar campo ref_key na tabela profiles para a chave única de referência
ALTER TABLE public.profiles 
ADD COLUMN ref_key TEXT UNIQUE;

-- Criar índice para performance
CREATE INDEX idx_profiles_ref_key ON public.profiles(ref_key);

-- Função para gerar chave de referência única
CREATE OR REPLACE FUNCTION public.generate_ref_key(user_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  clean_name TEXT;
  base_key TEXT;
  final_key TEXT;
  counter INTEGER := 0;
BEGIN
  -- Limpar nome para criar chave
  clean_name := LOWER(TRIM(REGEXP_REPLACE(user_name, '[^a-zA-Z0-9]', '', 'g')));
  
  -- Se nome muito curto, usar prefixo padrão
  IF LENGTH(clean_name) < 3 THEN
    clean_name := 'user';
  END IF;
  
  -- Limitar tamanho
  IF LENGTH(clean_name) > 10 THEN
    clean_name := SUBSTRING(clean_name, 1, 10);
  END IF;
  
  base_key := clean_name;
  final_key := base_key;
  
  -- Verificar se já existe e adicionar número se necessário
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE ref_key = final_key) LOOP
    counter := counter + 1;
    final_key := base_key || counter::TEXT;
  END LOOP;
  
  RETURN final_key;
END;
$$;

-- Função para processar indicação no cadastro
CREATE OR REPLACE FUNCTION public.process_referral_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  referrer_id UUID;
BEGIN
  -- Se não há indicador_id, nada a fazer
  IF NEW.indicador_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Buscar o ID do usuário pela ref_key
  SELECT id INTO referrer_id 
  FROM public.profiles 
  WHERE ref_key = NEW.indicador_id;
  
  -- Se encontrou o indicador, atualizar
  IF referrer_id IS NOT NULL THEN
    NEW.indicador_id := referrer_id::TEXT;
  ELSE
    -- Se não encontrou, limpar o campo
    NEW.indicador_id := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para processar indicação
CREATE TRIGGER trigger_process_referral_signup
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.process_referral_signup();

-- Função para gerar chave automaticamente se não existir
CREATE OR REPLACE FUNCTION public.ensure_ref_key()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Se não tem ref_key, gerar uma
  IF NEW.ref_key IS NULL THEN
    NEW.ref_key := public.generate_ref_key(COALESCE(NEW.name, 'user'));
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para garantir ref_key
CREATE TRIGGER trigger_ensure_ref_key
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_ref_key();

-- Atualizar função get_user_referrals para usar ref_key
CREATE OR REPLACE FUNCTION public.get_user_referrals(user_uuid UUID)
RETURNS TABLE(
  indicado_id UUID,
  indicado_name TEXT,
  indicado_email TEXT,
  plan_type TEXT,
  is_active BOOLEAN,
  dias_recompensa INTEGER,
  data_recompensa TIMESTAMP WITH TIME ZONE,
  ref_key_used TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    p.id as indicado_id,
    p.name as indicado_name,
    p.email as indicado_email,
    us.plan_type,
    us.is_active,
    ri.dias_creditados as dias_recompensa,
    ri.data_credito as data_recompensa,
    p.indicador_id as ref_key_used
  FROM public.profiles p
  LEFT JOIN public.user_subscriptions us ON p.id = us.user_id
  LEFT JOIN public.recompensas_indicacao ri ON (p.id = ri.indicado_id AND ri.user_id = user_uuid)
  WHERE p.indicador_id = (
    SELECT ref_key FROM public.profiles WHERE id = user_uuid
  )
  ORDER BY p.created_at DESC;
$$;

-- Função para obter estatísticas de indicação
CREATE OR REPLACE FUNCTION public.get_referral_stats(user_uuid UUID)
RETURNS TABLE(
  total_referrals INTEGER,
  active_referrals INTEGER,
  total_bonus_days INTEGER,
  ref_key TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH user_ref AS (
    SELECT ref_key FROM public.profiles WHERE id = user_uuid
  ),
  referral_data AS (
    SELECT 
      COUNT(*) as total_refs,
      COUNT(CASE WHEN us.is_active = true THEN 1 END) as active_refs,
      COALESCE(SUM(ri.dias_creditados), 0) as total_days
    FROM public.profiles p
    LEFT JOIN public.user_subscriptions us ON p.id = us.user_id
    LEFT JOIN public.recompensas_indicacao ri ON p.id = ri.indicado_id
    WHERE p.indicador_id = (SELECT ref_key FROM user_ref)
  )
  SELECT 
    rd.total_refs::INTEGER,
    rd.active_refs::INTEGER,
    rd.total_days::INTEGER,
    ur.ref_key
  FROM referral_data rd
  CROSS JOIN user_ref ur;
$$;
