
-- Primeiro, adicionar a coluna ref_key na tabela profiles se ela não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'ref_key') THEN
        ALTER TABLE public.profiles ADD COLUMN ref_key TEXT UNIQUE;
        CREATE INDEX IF NOT EXISTS idx_profiles_ref_key ON public.profiles(ref_key);
    END IF;
END $$;

-- Atualizar a função get_user_referrals para usar ref_key corretamente
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

-- Criar a função get_referral_stats que estava faltando
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
