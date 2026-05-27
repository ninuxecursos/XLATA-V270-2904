-- Lock down payment_gateway_config: only admins should read access tokens.
DROP POLICY IF EXISTS "Authenticated users can read active gateway config" ON public.payment_gateway_config;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'public.payment_gateway_config'::regclass
      AND polname = 'Admins can read gateway config'
  ) THEN
    CREATE POLICY "Admins can read gateway config"
      ON public.payment_gateway_config
      FOR SELECT
      TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

-- Restrict shop_config writes to admins (keep read open for storefront)
DROP POLICY IF EXISTS "Authenticated users can manage shop config" ON public.shop_config;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'public.shop_config'::regclass
      AND polname = 'Admins can manage shop config'
  ) THEN
    CREATE POLICY "Admins can manage shop config"
      ON public.shop_config
      FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;