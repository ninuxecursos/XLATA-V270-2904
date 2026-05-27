
-- Adicionar campo indicador_id na tabela profiles para rastrear quem indicou
ALTER TABLE public.profiles 
ADD COLUMN indicador_id UUID REFERENCES public.profiles(id);

-- Criar tabela para rastrear recompensas de indicação
CREATE TABLE public.recompensas_indicacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  indicado_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plano_ativado TEXT NOT NULL CHECK (plano_ativado IN ('monthly', 'quarterly', 'annual')),
  dias_creditados INTEGER NOT NULL,
  data_credito TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, indicado_id, plano_ativado)
);

-- Habilitar RLS na nova tabela
ALTER TABLE public.recompensas_indicacao ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem suas próprias recompensas
CREATE POLICY "Users can view their own rewards"
  ON public.recompensas_indicacao
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para admins verem todas as recompensas
CREATE POLICY "Admins can manage all rewards"
  ON public.recompensas_indicacao
  FOR ALL
  USING (is_admin());

-- Política para sistema inserir recompensas
CREATE POLICY "System can insert rewards"
  ON public.recompensas_indicacao
  FOR INSERT
  WITH CHECK (true);

-- Função para aplicar recompensa automaticamente quando plano for ativado
CREATE OR REPLACE FUNCTION public.aplicar_recompensa_indicacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  indicador_subscription RECORD;
  dias_recompensa INTEGER;
BEGIN
  -- Verificar se o usuário foi indicado e se o plano está sendo ativado
  IF NEW.is_active = true AND OLD.is_active = false AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = NEW.user_id AND indicador_id IS NOT NULL
  ) THEN
    
    -- Obter o indicador
    SELECT p.indicador_id INTO indicador_subscription
    FROM public.profiles p
    WHERE p.id = NEW.user_id;
    
    -- Determinar dias de recompensa baseado no tipo de plano
    CASE NEW.plan_type
      WHEN 'monthly' THEN dias_recompensa := 7;
      WHEN 'quarterly' THEN dias_recompensa := 14;
      WHEN 'annual' THEN dias_recompensa := 30;
      ELSE dias_recompensa := 0;
    END CASE;
    
    -- Aplicar recompensa se ainda não foi aplicada
    IF dias_recompensa > 0 AND NOT EXISTS (
      SELECT 1 FROM public.recompensas_indicacao 
      WHERE user_id = indicador_subscription.indicador_id 
      AND indicado_id = NEW.user_id 
      AND plano_ativado = NEW.plan_type
    ) THEN
      
      -- Inserir registro da recompensa
      INSERT INTO public.recompensas_indicacao (
        user_id, 
        indicado_id, 
        plano_ativado, 
        dias_creditados
      ) VALUES (
        indicador_subscription.indicador_id,
        NEW.user_id,
        NEW.plan_type,
        dias_recompensa
      );
      
      -- Estender a assinatura do indicador
      UPDATE public.user_subscriptions
      SET expires_at = expires_at + (dias_recompensa || ' days')::INTERVAL
      WHERE user_id = indicador_subscription.indicador_id
      AND is_active = true;
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para aplicar recompensa automaticamente
CREATE TRIGGER trigger_aplicar_recompensa_indicacao
  AFTER UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.aplicar_recompensa_indicacao();

-- Função para obter indicações de um usuário
CREATE OR REPLACE FUNCTION public.get_user_referrals(user_uuid UUID)
RETURNS TABLE(
  indicado_id UUID,
  indicado_name TEXT,
  indicado_email TEXT,
  plan_type TEXT,
  is_active BOOLEAN,
  dias_recompensa INTEGER,
  data_recompensa TIMESTAMP WITH TIME ZONE
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
    ri.data_credito as data_recompensa
  FROM public.profiles p
  LEFT JOIN public.user_subscriptions us ON p.id = us.user_id
  LEFT JOIN public.recompensas_indicacao ri ON (p.id = ri.indicado_id AND ri.user_id = user_uuid)
  WHERE p.indicador_id = user_uuid
  ORDER BY p.created_at DESC;
$$;
