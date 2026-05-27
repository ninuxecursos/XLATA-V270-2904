
-- Criar tabela para rastrear presença de usuários
CREATE TABLE IF NOT EXISTS public.user_presence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_online BOOLEAN NOT NULL DEFAULT true,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, session_id)
);

-- Habilitar RLS
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas suas próprias presenças ou admins verem todas
CREATE POLICY "Users can view presence data" ON public.user_presence
  FOR SELECT USING (
    auth.uid() = user_id OR 
    public.get_user_status() = 'admin'::user_status
  );

-- Política para usuários atualizarem apenas suas próprias presenças
CREATE POLICY "Users can manage their own presence" ON public.user_presence
  FOR ALL USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_user_presence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_presence_updated_at
  BEFORE UPDATE ON public.user_presence
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_presence_updated_at();

-- Função para limpar presenças antigas (usuários offline há mais de 5 minutos)
CREATE OR REPLACE FUNCTION public.cleanup_old_presence()
RETURNS void AS $$
BEGIN
  UPDATE public.user_presence 
  SET is_online = false 
  WHERE last_seen_at < now() - interval '5 minutes' 
  AND is_online = true;
  
  DELETE FROM public.user_presence 
  WHERE last_seen_at < now() - interval '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter usuários online
CREATE OR REPLACE FUNCTION public.get_online_users()
RETURNS TABLE(user_id UUID, last_seen_at TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
  -- Limpar presenças antigas primeiro
  PERFORM public.cleanup_old_presence();
  
  -- Retornar usuários online
  RETURN QUERY
  SELECT DISTINCT up.user_id, up.last_seen_at
  FROM public.user_presence up
  WHERE up.is_online = true 
  AND up.last_seen_at > now() - interval '5 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Habilitar realtime na tabela
ALTER TABLE public.user_presence REPLICA IDENTITY FULL;
