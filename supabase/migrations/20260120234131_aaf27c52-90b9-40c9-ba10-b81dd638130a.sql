-- Atualizar função calcular_bonus_indicacao para usar configurações dinâmicas
CREATE OR REPLACE FUNCTION public.calcular_bonus_indicacao(p_plan_type TEXT, p_is_renewal BOOLEAN DEFAULT FALSE)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_bonus_days INTEGER;
  v_renewal_percentage INTEGER;
BEGIN
  -- Buscar configuração dinâmica da tabela referral_settings
  SELECT bonus_days, renewal_percentage 
  INTO v_bonus_days, v_renewal_percentage
  FROM public.referral_settings
  WHERE plan_type = p_plan_type AND is_active = true;
  
  -- Fallback se não encontrar configuração
  IF v_bonus_days IS NULL THEN
    v_bonus_days := 7;
    v_renewal_percentage := 50;
  END IF;
  
  -- Se for renovação, aplica porcentagem configurada
  IF p_is_renewal THEN
    v_bonus_days := GREATEST(CEIL(v_bonus_days * v_renewal_percentage / 100.0)::INTEGER, 1);
  END IF;
  
  RETURN v_bonus_days;
END;
$$;