-- Add DELETE policies for admin on cleanup tables

CREATE POLICY "Admins can delete old audit logs"
ON public.audit_log FOR DELETE TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete old access logs"
ON public.admin_access_logs FOR DELETE TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete old admin audit logs"
ON public.admin_audit_logs FOR DELETE TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete old employee logs"
ON public.employee_action_logs FOR DELETE TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete inactive pdv sessions"
ON public.pdv_sessions FOR DELETE TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete inactive unidade sessions"
ON public.unidade_sessions FOR DELETE TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete old presence records"
ON public.user_presence FOR DELETE TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete expired rate limits"
ON public.rate_limit_attempts FOR DELETE TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete message recipients"
ON public.admin_message_recipients FOR DELETE TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete expired notifications"
ON public.global_notifications FOR DELETE TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete notification recipients"
ON public.global_notification_recipients FOR DELETE TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete expired direct messages"
ON public.user_direct_messages FOR DELETE TO authenticated
USING (public.is_admin());