-- Políticas RLS para admin gerenciar receipt_format_settings
CREATE POLICY "Admins can view all receipt settings"
ON public.receipt_format_settings
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can update all receipt settings"
ON public.receipt_format_settings
FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can insert all receipt settings"
ON public.receipt_format_settings
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete all receipt settings"
ON public.receipt_format_settings
FOR DELETE
USING (public.is_admin());

-- Políticas RLS para admin_access_logs
CREATE POLICY "Users can insert own access logs"
ON public.admin_access_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all access logs"
ON public.admin_access_logs
FOR SELECT
USING (public.is_admin());

-- Políticas RLS para active_sessions
CREATE POLICY "Users can insert own sessions"
ON public.active_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
ON public.active_sessions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sessions"
ON public.active_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions"
ON public.active_sessions
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can update any session"
ON public.active_sessions
FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can delete any session"
ON public.active_sessions
FOR DELETE
USING (public.is_admin());