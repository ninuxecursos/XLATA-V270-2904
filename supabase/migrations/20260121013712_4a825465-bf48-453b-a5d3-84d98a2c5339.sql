-- ============================================
-- CORREÇÃO 1: Funções SQL sem search_path
-- ============================================

-- Corrigir update_depot_updated_at
CREATE OR REPLACE FUNCTION public.update_depot_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Corrigir update_landing_updated_at
CREATE OR REPLACE FUNCTION public.update_landing_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Corrigir update_payment_gateway_config_updated_at
CREATE OR REPLACE FUNCTION public.update_payment_gateway_config_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Corrigir update_static_pages_seo_updated_at
CREATE OR REPLACE FUNCTION public.update_static_pages_seo_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Corrigir update_campaign_updated_at
CREATE OR REPLACE FUNCTION public.update_campaign_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- ============================================
-- CORREÇÃO 2: Políticas RLS Permissivas
-- ============================================

-- admin_access_logs: Só usuários autenticados podem inserir
DROP POLICY IF EXISTS "Sistema pode inserir logs" ON admin_access_logs;
CREATE POLICY "Sistema pode inserir logs" ON admin_access_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- admin_audit_logs: Só admins podem inserir
DROP POLICY IF EXISTS "Sistema pode inserir logs de auditoria" ON admin_audit_logs;
CREATE POLICY "Sistema pode inserir logs de auditoria" ON admin_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- admin_message_recipients: Só sistema autenticado
DROP POLICY IF EXISTS "System can insert message receipts" ON admin_message_recipients;
CREATE POLICY "System can insert message receipts" ON admin_message_recipients
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- analytics_events: Só usuário autenticado para seus próprios eventos ou eventos anônimos
DROP POLICY IF EXISTS "Sistema pode inserir eventos" ON analytics_events;
CREATE POLICY "Sistema pode inserir eventos" ON analytics_events
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- recompensas_indicacao: Só próprio usuário ou admin pode inserir
DROP POLICY IF EXISTS "System can insert rewards" ON recompensas_indicacao;
CREATE POLICY "System can insert rewards" ON recompensas_indicacao
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- user_accounts: Só próprio usuário pode inserir (usa 'id' como referência)
DROP POLICY IF EXISTS "allow_insert_signup" ON user_accounts;
CREATE POLICY "allow_insert_signup" ON user_accounts
  FOR INSERT TO authenticated
  WITH CHECK (id::text = auth.uid()::text);