
-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view their own realtime messages" ON public.admin_realtime_messages;
DROP POLICY IF EXISTS "Users can mark their own messages as read" ON public.admin_realtime_messages;
DROP POLICY IF EXISTS "Admins can create realtime messages" ON public.admin_realtime_messages;
DROP POLICY IF EXISTS "Admins can view all realtime messages" ON public.admin_realtime_messages;
DROP POLICY IF EXISTS "Admins can update all realtime messages" ON public.admin_realtime_messages;

-- Habilitar RLS na tabela admin_realtime_messages (caso não esteja habilitado)
ALTER TABLE public.admin_realtime_messages ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas suas próprias mensagens
CREATE POLICY "Users can view their own realtime messages" 
  ON public.admin_realtime_messages 
  FOR SELECT 
  USING (target_user_id = auth.uid());

-- Política para permitir que usuários marquem suas próprias mensagens como lidas
CREATE POLICY "Users can mark their own messages as read" 
  ON public.admin_realtime_messages 
  FOR UPDATE 
  USING (target_user_id = auth.uid())
  WITH CHECK (target_user_id = auth.uid());

-- Política para permitir que admins criem mensagens para qualquer usuário
CREATE POLICY "Admins can create realtime messages" 
  ON public.admin_realtime_messages 
  FOR INSERT 
  WITH CHECK (public.get_user_status() = 'admin'::user_status);

-- Política para permitir que admins vejam todas as mensagens
CREATE POLICY "Admins can view all realtime messages" 
  ON public.admin_realtime_messages 
  FOR SELECT 
  USING (public.get_user_status() = 'admin'::user_status);

-- Política para permitir que admins atualizem qualquer mensagem
CREATE POLICY "Admins can update all realtime messages" 
  ON public.admin_realtime_messages 
  FOR UPDATE 
  USING (public.get_user_status() = 'admin'::user_status);
