-- Criar tabela para buffer de produtos via Telegram (Modo Bloco Único)
CREATE TABLE public.telegram_product_buffer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id BIGINT NOT NULL UNIQUE,
  
  -- Mensagens acumuladas (array de textos)
  messages JSONB DEFAULT '[]'::jsonb,
  
  -- File IDs das fotos do Telegram
  photo_file_ids JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours'),
  
  -- Produto criado (para fase de confirmação)
  draft_product_id UUID REFERENCES public.shop_products(id) ON DELETE SET NULL,
  
  -- Status do buffer
  status TEXT DEFAULT 'collecting' CHECK (status IN ('collecting', 'awaiting_confirm', 'completed', 'cancelled'))
);

-- Índices
CREATE INDEX idx_telegram_product_buffer_chat_id ON public.telegram_product_buffer(chat_id);
CREATE INDEX idx_telegram_product_buffer_status ON public.telegram_product_buffer(status);
CREATE INDEX idx_telegram_product_buffer_expires ON public.telegram_product_buffer(expires_at);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_telegram_product_buffer_updated_at
  BEFORE UPDATE ON public.telegram_product_buffer
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.telegram_product_buffer ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso via service role (edge functions)
CREATE POLICY "Service role full access to telegram_product_buffer"
  ON public.telegram_product_buffer
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Função RPC: Adicionar texto ou foto ao buffer
CREATE OR REPLACE FUNCTION public.append_to_telegram_buffer(
  p_chat_id BIGINT,
  p_message_text TEXT DEFAULT NULL,
  p_photo_file_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_buffer_id UUID;
  v_messages JSONB;
  v_photos JSONB;
BEGIN
  -- Verificar se já existe buffer para este chat
  SELECT id, messages, photo_file_ids 
  INTO v_buffer_id, v_messages, v_photos
  FROM public.telegram_product_buffer
  WHERE chat_id = p_chat_id AND status = 'collecting'
  FOR UPDATE;
  
  IF v_buffer_id IS NULL THEN
    -- Criar novo buffer
    INSERT INTO public.telegram_product_buffer (chat_id, messages, photo_file_ids)
    VALUES (
      p_chat_id,
      CASE WHEN p_message_text IS NOT NULL THEN jsonb_build_array(p_message_text) ELSE '[]'::jsonb END,
      CASE WHEN p_photo_file_id IS NOT NULL THEN jsonb_build_array(p_photo_file_id) ELSE '[]'::jsonb END
    )
    RETURNING id INTO v_buffer_id;
  ELSE
    -- Adicionar ao buffer existente
    IF p_message_text IS NOT NULL AND jsonb_array_length(v_messages) < 50 THEN
      v_messages := v_messages || jsonb_build_array(p_message_text);
    END IF;
    
    IF p_photo_file_id IS NOT NULL AND jsonb_array_length(v_photos) < 10 THEN
      v_photos := v_photos || jsonb_build_array(p_photo_file_id);
    END IF;
    
    UPDATE public.telegram_product_buffer
    SET 
      messages = v_messages,
      photo_file_ids = v_photos,
      updated_at = now(),
      expires_at = now() + interval '24 hours'
    WHERE id = v_buffer_id;
  END IF;
  
  RETURN v_buffer_id;
END;
$$;

-- Função RPC: Obter buffer de um chat
CREATE OR REPLACE FUNCTION public.get_telegram_buffer(p_chat_id BIGINT)
RETURNS TABLE (
  id UUID,
  chat_id BIGINT,
  messages JSONB,
  photo_file_ids JSONB,
  draft_product_id UUID,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.chat_id,
    b.messages,
    b.photo_file_ids,
    b.draft_product_id,
    b.status,
    b.created_at,
    b.updated_at
  FROM public.telegram_product_buffer b
  WHERE b.chat_id = p_chat_id
  ORDER BY b.updated_at DESC
  LIMIT 1;
END;
$$;

-- Função RPC: Atualizar status do buffer
CREATE OR REPLACE FUNCTION public.update_telegram_buffer_status(
  p_chat_id BIGINT,
  p_status TEXT,
  p_draft_product_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.telegram_product_buffer
  SET 
    status = p_status,
    draft_product_id = COALESCE(p_draft_product_id, draft_product_id),
    updated_at = now()
  WHERE chat_id = p_chat_id AND status IN ('collecting', 'awaiting_confirm');
  
  RETURN FOUND;
END;
$$;

-- Função RPC: Limpar buffer de um chat
CREATE OR REPLACE FUNCTION public.clear_telegram_buffer(p_chat_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.telegram_product_buffer
  WHERE chat_id = p_chat_id;
  
  RETURN FOUND;
END;
$$;

-- Função RPC: Limpar buffers expirados
CREATE OR REPLACE FUNCTION public.cleanup_expired_telegram_buffers()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM public.telegram_product_buffer
  WHERE expires_at < now() AND status = 'collecting';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;