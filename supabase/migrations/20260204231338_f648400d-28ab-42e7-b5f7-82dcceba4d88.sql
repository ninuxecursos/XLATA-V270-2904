-- =====================================================
-- Tabela: telegram_wizard_sessions
-- Gerencia sessões de wizard conversacional por chat_id
-- =====================================================

CREATE TABLE IF NOT EXISTS public.telegram_wizard_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id BIGINT NOT NULL UNIQUE,
  step TEXT NOT NULL DEFAULT 'idle',
  sale_type TEXT CHECK (sale_type IN ('normal', 'interactive')),
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '1 hour')
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_wizard_sessions_chat_id ON public.telegram_wizard_sessions(chat_id);
CREATE INDEX IF NOT EXISTS idx_wizard_sessions_expires_at ON public.telegram_wizard_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_wizard_sessions_step ON public.telegram_wizard_sessions(step);

-- Enable RLS
ALTER TABLE public.telegram_wizard_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all sessions (for CMS admin)
CREATE POLICY "Authenticated users can read wizard sessions" 
  ON public.telegram_wizard_sessions 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can delete sessions
CREATE POLICY "Authenticated users can delete wizard sessions" 
  ON public.telegram_wizard_sessions 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Policy: Service role full access (for edge functions)
CREATE POLICY "Service role has full access to wizard sessions" 
  ON public.telegram_wizard_sessions 
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- Função: get_or_create_wizard_session
-- Busca ou cria sessão com lock para evitar race conditions
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_or_create_wizard_session(p_chat_id BIGINT)
RETURNS public.telegram_wizard_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.telegram_wizard_sessions;
BEGIN
  -- Tentar buscar sessão existente com lock
  SELECT * INTO v_session
  FROM public.telegram_wizard_sessions
  WHERE chat_id = p_chat_id
  FOR UPDATE SKIP LOCKED;
  
  IF FOUND THEN
    -- Verificar se expirou
    IF v_session.expires_at < now() THEN
      -- Reset da sessão expirada
      UPDATE public.telegram_wizard_sessions
      SET step = 'idle',
          sale_type = NULL,
          data = '{}'::jsonb,
          updated_at = now(),
          expires_at = now() + interval '1 hour'
      WHERE id = v_session.id
      RETURNING * INTO v_session;
    END IF;
    
    RETURN v_session;
  END IF;
  
  -- Criar nova sessão se não existir
  INSERT INTO public.telegram_wizard_sessions (chat_id, step, data)
  VALUES (p_chat_id, 'idle', '{}'::jsonb)
  ON CONFLICT (chat_id) DO UPDATE SET updated_at = now()
  RETURNING * INTO v_session;
  
  RETURN v_session;
END;
$$;

-- =====================================================
-- Função: update_wizard_session
-- Atualiza sessão com novos dados
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_wizard_session(
  p_chat_id BIGINT,
  p_step TEXT,
  p_sale_type TEXT DEFAULT NULL,
  p_data JSONB DEFAULT NULL
)
RETURNS public.telegram_wizard_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.telegram_wizard_sessions;
BEGIN
  UPDATE public.telegram_wizard_sessions
  SET 
    step = p_step,
    sale_type = COALESCE(p_sale_type, sale_type),
    data = COALESCE(p_data, data),
    updated_at = now(),
    expires_at = now() + interval '1 hour'
  WHERE chat_id = p_chat_id
  RETURNING * INTO v_session;
  
  RETURN v_session;
END;
$$;

-- =====================================================
-- Função: append_photo_to_wizard
-- Adiciona foto ao array de fotos da sessão
-- =====================================================

CREATE OR REPLACE FUNCTION public.append_photo_to_wizard(
  p_chat_id BIGINT,
  p_file_id TEXT
)
RETURNS public.telegram_wizard_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.telegram_wizard_sessions;
  v_photos JSONB;
BEGIN
  -- Buscar sessão atual
  SELECT data->'photos' INTO v_photos
  FROM public.telegram_wizard_sessions
  WHERE chat_id = p_chat_id;
  
  -- Inicializar array se não existir
  IF v_photos IS NULL THEN
    v_photos := '[]'::jsonb;
  END IF;
  
  -- Verificar limite de 10 fotos
  IF jsonb_array_length(v_photos) >= 10 THEN
    -- Retornar sessão sem modificar
    SELECT * INTO v_session
    FROM public.telegram_wizard_sessions
    WHERE chat_id = p_chat_id;
    RETURN v_session;
  END IF;
  
  -- Adicionar nova foto
  UPDATE public.telegram_wizard_sessions
  SET 
    data = jsonb_set(
      data, 
      '{photos}', 
      v_photos || to_jsonb(p_file_id)
    ),
    updated_at = now(),
    expires_at = now() + interval '1 hour'
  WHERE chat_id = p_chat_id
  RETURNING * INTO v_session;
  
  RETURN v_session;
END;
$$;

-- =====================================================
-- Função: cleanup_expired_wizard_sessions
-- Remove sessões expiradas (para cron job)
-- =====================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_wizard_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM public.telegram_wizard_sessions
  WHERE expires_at < now();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;