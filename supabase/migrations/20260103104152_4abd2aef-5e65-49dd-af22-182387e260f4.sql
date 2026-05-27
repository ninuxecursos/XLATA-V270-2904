-- =====================================================
-- CORREÇÃO COMPLETA DO SISTEMA DE INDICAÇÕES
-- =====================================================

-- 1. Adicionar coluna ref_key na tabela profiles (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'ref_key'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN ref_key TEXT UNIQUE;
  END IF;
END $$;

-- 2. Criar índice para ref_key
CREATE INDEX IF NOT EXISTS idx_profiles_ref_key ON public.profiles(ref_key);

-- 3. Adicionar coluna tipo_bonus na tabela recompensas_indicacao
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'recompensas_indicacao' 
    AND column_name = 'tipo_bonus'
  ) THEN
    ALTER TABLE public.recompensas_indicacao ADD COLUMN tipo_bonus TEXT DEFAULT 'primeira_ativacao';
  END IF;
END $$;

-- 4. Adicionar coluna plano_valor para rastrear renovações
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'recompensas_indicacao' 
    AND column_name = 'numero_renovacao'
  ) THEN
    ALTER TABLE public.recompensas_indicacao ADD COLUMN numero_renovacao INTEGER DEFAULT 1;
  END IF;
END $$;

-- 5. Função para calcular bônus baseado no plano
CREATE OR REPLACE FUNCTION public.calcular_bonus_indicacao(p_plan_type TEXT, p_is_renewal BOOLEAN DEFAULT FALSE)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  dias_bonus INTEGER;
BEGIN
  -- Calcular bônus base pelo tipo de plano
  CASE p_plan_type
    WHEN 'trial' THEN dias_bonus := 3;
    WHEN 'promotional' THEN dias_bonus := 5;
    WHEN 'monthly' THEN dias_bonus := 7;
    WHEN 'quarterly' THEN dias_bonus := 15;
    WHEN 'biannual' THEN dias_bonus := 30;
    WHEN 'annual' THEN dias_bonus := 45;
    WHEN 'triennial' THEN dias_bonus := 90;
    ELSE dias_bonus := 7; -- Default para planos não mapeados
  END CASE;
  
  -- Se for renovação, aplica 50% do bônus
  IF p_is_renewal THEN
    dias_bonus := GREATEST(CEIL(dias_bonus * 0.5)::INTEGER, 1);
  END IF;
  
  RETURN dias_bonus;
END;
$$;

-- 6. Atualizar trigger para aplicar recompensas (suporta renovações)
CREATE OR REPLACE FUNCTION public.aplicar_recompensa_indicacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_indicador_id UUID;
  v_dias_recompensa INTEGER;
  v_is_renewal BOOLEAN := FALSE;
  v_numero_renovacao INTEGER := 1;
  v_tipo_bonus TEXT := 'primeira_ativacao';
BEGIN
  -- Verifica se a assinatura foi ativada
  IF NEW.is_active = true AND (OLD.is_active = false OR OLD.is_active IS NULL) THEN
    
    -- Busca o indicador do usuário
    SELECT indicador_id INTO v_indicador_id
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    -- Se não tem indicador, sai
    IF v_indicador_id IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Verifica se é renovação (já existe recompensa anterior para este indicado)
    SELECT COUNT(*) + 1, 
           CASE WHEN COUNT(*) > 0 THEN TRUE ELSE FALSE END
    INTO v_numero_renovacao, v_is_renewal
    FROM public.recompensas_indicacao
    WHERE indicado_id = NEW.user_id
    AND user_id = v_indicador_id;
    
    -- Define tipo de bônus
    IF v_is_renewal THEN
      v_tipo_bonus := 'renovacao';
    END IF;
    
    -- Calcula os dias de bônus
    v_dias_recompensa := public.calcular_bonus_indicacao(NEW.plan_type, v_is_renewal);
    
    -- Insere a recompensa
    INSERT INTO public.recompensas_indicacao (
      user_id,
      indicado_id,
      plano_ativado,
      dias_creditados,
      tipo_bonus,
      numero_renovacao
    ) VALUES (
      v_indicador_id,
      NEW.user_id,
      NEW.plan_type,
      v_dias_recompensa,
      v_tipo_bonus,
      v_numero_renovacao
    );
    
    -- Atualiza a assinatura do indicador
    UPDATE public.user_subscriptions
    SET expires_at = expires_at + (v_dias_recompensa || ' days')::INTERVAL
    WHERE user_id = v_indicador_id
    AND is_active = true;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- 7. Recriar o trigger
DROP TRIGGER IF EXISTS trigger_aplicar_recompensa_indicacao ON public.user_subscriptions;
CREATE TRIGGER trigger_aplicar_recompensa_indicacao
  AFTER UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.aplicar_recompensa_indicacao();

-- 8. Trigger para INSERT também (primeira ativação)
DROP TRIGGER IF EXISTS trigger_aplicar_recompensa_indicacao_insert ON public.user_subscriptions;
CREATE TRIGGER trigger_aplicar_recompensa_indicacao_insert
  AFTER INSERT ON public.user_subscriptions
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION public.aplicar_recompensa_indicacao();

-- 9. Atualizar handle_new_user para salvar indicador_id e gerar ref_key
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
BEGIN
  -- Buscar nome do usuário
  v_user_name := COALESCE(
    NEW.raw_user_meta_data->>'name', 
    NEW.raw_user_meta_data->>'full_name', 
    split_part(NEW.email, '@', 1)
  );
  
  -- Buscar indicador_id dos metadados
  IF NEW.raw_user_meta_data->>'indicador_id' IS NOT NULL THEN
    v_indicador_id := (NEW.raw_user_meta_data->>'indicador_id')::UUID;
    
    -- Validar se o indicador existe
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_indicador_id) THEN
      v_indicador_id := NULL;
    END IF;
  END IF;
  
  -- Gerar ref_key
  v_ref_key := public.generate_ref_key(v_user_name);
  
  -- Inserir ou atualizar profile
  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    phone, 
    company, 
    status, 
    whatsapp,
    indicador_id,
    ref_key
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_user_name,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'company',
    COALESCE((NEW.raw_user_meta_data->>'status')::user_status, 'user'::user_status),
    NEW.raw_user_meta_data->>'whatsapp',
    v_indicador_id,
    v_ref_key
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

-- 10. Função para buscar estatísticas de indicações
CREATE OR REPLACE FUNCTION public.get_referral_stats(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_indicados', (
      SELECT COUNT(*) 
      FROM public.profiles 
      WHERE indicador_id = p_user_id
    ),
    'indicados_ativos', (
      SELECT COUNT(DISTINCT p.id)
      FROM public.profiles p
      INNER JOIN public.user_subscriptions us ON p.id = us.user_id
      WHERE p.indicador_id = p_user_id
      AND us.is_active = true
      AND us.expires_at > now()
    ),
    'total_dias_bonus', (
      SELECT COALESCE(SUM(dias_creditados), 0)
      FROM public.recompensas_indicacao
      WHERE user_id = p_user_id
    ),
    'bonus_primeira_ativacao', (
      SELECT COALESCE(SUM(dias_creditados), 0)
      FROM public.recompensas_indicacao
      WHERE user_id = p_user_id
      AND tipo_bonus = 'primeira_ativacao'
    ),
    'bonus_renovacoes', (
      SELECT COALESCE(SUM(dias_creditados), 0)
      FROM public.recompensas_indicacao
      WHERE user_id = p_user_id
      AND tipo_bonus = 'renovacao'
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- 11. Gerar ref_key para usuários existentes que não têm
UPDATE public.profiles
SET ref_key = public.generate_ref_key(COALESCE(name, 'Usuario'))
WHERE ref_key IS NULL;