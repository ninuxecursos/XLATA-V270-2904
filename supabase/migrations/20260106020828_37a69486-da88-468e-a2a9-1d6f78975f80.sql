-- Adicionar políticas RLS para admins acessarem system_settings de todos os usuários

-- Política para admin visualizar todas as configurações
CREATE POLICY "Admins can view all system_settings"
ON public.system_settings
FOR SELECT
USING (public.is_admin());

-- Política para admin atualizar qualquer configuração
CREATE POLICY "Admins can update all system_settings"
ON public.system_settings
FOR UPDATE
USING (public.is_admin());

-- Política para admin inserir configurações para qualquer usuário
CREATE POLICY "Admins can insert any system_settings"
ON public.system_settings
FOR INSERT
WITH CHECK (public.is_admin());

-- Política para admin deletar configurações
CREATE POLICY "Admins can delete any system_settings"
ON public.system_settings
FOR DELETE
USING (public.is_admin());

-- Política para admin atualizar qualquer perfil de usuário
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (public.is_admin());