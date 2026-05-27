
-- =============================================
-- SECURITY FIX: Drop exposed payment_gateway_config policy
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can read active gateway config" ON payment_gateway_config;

-- =============================================
-- SECURITY FIX: Restrict shop_config to admin only
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can manage shop config" ON shop_config;
DROP POLICY IF EXISTS "Anyone can read shop config" ON shop_config;

-- Allow public read (needed for shop frontend)
CREATE POLICY "Anyone can read shop config" ON shop_config
  FOR SELECT TO anon, authenticated
  USING (true);

-- Only admin can modify
CREATE POLICY "Admin can manage shop config" ON shop_config
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =============================================
-- SECURITY FIX: Restrict telegram_bot_config to admin only
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can manage telegram bot config" ON telegram_bot_config;

CREATE POLICY "Admin can manage telegram bot config" ON telegram_bot_config
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =============================================
-- SECURITY FIX: Restrict shop_interactive_config to admin only
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can manage interactive config" ON shop_interactive_config;

CREATE POLICY "Public can read interactive config" ON shop_interactive_config
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admin can manage interactive config" ON shop_interactive_config
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =============================================
-- SECURITY FIX: Restrict shop_interactive_events to admin only
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can manage interactive events" ON shop_interactive_events;

CREATE POLICY "Public can read interactive events" ON shop_interactive_events
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admin can manage interactive events" ON shop_interactive_events
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =============================================
-- SECURITY FIX: Restrict shop_interactive_offers to admin only
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can manage interactive offers" ON shop_interactive_offers;

CREATE POLICY "Public can read interactive offers" ON shop_interactive_offers
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admin can manage interactive offers" ON shop_interactive_offers
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =============================================
-- SECURITY FIX: Fix search_path on functions without it
-- =============================================
ALTER FUNCTION public.update_shop_user_addresses_updated_at() SET search_path TO 'public';
ALTER FUNCTION public.ensure_single_default_address() SET search_path TO 'public';
ALTER FUNCTION public.prevent_ledger_modification() SET search_path TO 'public';
ALTER FUNCTION public.audit_trigger() SET search_path TO 'public';
