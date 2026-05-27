-- 1. Remove a política restritiva existente
DROP POLICY IF EXISTS "Admins can manage telegram bot config" ON public.telegram_bot_config;

-- 2. Cria política permissiva para usuários autenticados
CREATE POLICY "Authenticated users can manage telegram config"
ON public.telegram_bot_config FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);