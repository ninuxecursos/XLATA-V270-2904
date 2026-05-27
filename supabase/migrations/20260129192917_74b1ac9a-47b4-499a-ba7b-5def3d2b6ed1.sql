-- =====================================================
-- LOJA DIGITAL XLATA - FASE 1
-- Sistema de loja independente do XLata
-- =====================================================

-- 1. Adicionar campos em shop_products
ALTER TABLE public.shop_products 
ADD COLUMN IF NOT EXISTS sale_type TEXT NOT NULL DEFAULT 'normal';

-- Adicionar check constraint separadamente para evitar erros se já existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shop_products_sale_type_check') THEN
    ALTER TABLE public.shop_products 
    ADD CONSTRAINT shop_products_sale_type_check CHECK (sale_type IN ('normal', 'interactive'));
  END IF;
END $$;

ALTER TABLE public.shop_products 
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true;

-- 2. Adicionar shop_user_id em shop_orders
ALTER TABLE public.shop_orders 
ADD COLUMN IF NOT EXISTS shop_user_id UUID;

-- 3. Criar tabela de usuários da loja (independente do XLata)
CREATE TABLE IF NOT EXISTS public.shop_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  email_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Adicionar FK depois que a tabela existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shop_orders_shop_user_id_fkey') THEN
    ALTER TABLE public.shop_orders 
    ADD CONSTRAINT shop_orders_shop_user_id_fkey 
    FOREIGN KEY (shop_user_id) REFERENCES public.shop_users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_shop_users_email ON public.shop_users(email);
CREATE INDEX IF NOT EXISTS idx_shop_users_status ON public.shop_users(status);
CREATE INDEX IF NOT EXISTS idx_shop_products_sale_type ON public.shop_products(sale_type);
CREATE INDEX IF NOT EXISTS idx_shop_products_is_visible ON public.shop_products(is_visible);
CREATE INDEX IF NOT EXISTS idx_shop_orders_shop_user_id ON public.shop_orders(shop_user_id);

-- 5. Trigger para updated_at em shop_users
CREATE OR REPLACE FUNCTION public.update_shop_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_shop_users_updated_at ON public.shop_users;
CREATE TRIGGER update_shop_users_updated_at
BEFORE UPDATE ON public.shop_users
FOR EACH ROW
EXECUTE FUNCTION public.update_shop_users_updated_at();

-- 6. Enable RLS
ALTER TABLE public.shop_users ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies para shop_users
DROP POLICY IF EXISTS "Shop users can view own data" ON public.shop_users;
CREATE POLICY "Shop users can view own data"
ON public.shop_users
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Shop users can update own data" ON public.shop_users;
CREATE POLICY "Shop users can update own data"
ON public.shop_users
FOR UPDATE
USING (id::text = current_setting('app.current_shop_user_id', true));

DROP POLICY IF EXISTS "Anyone can register as shop user" ON public.shop_users;
CREATE POLICY "Anyone can register as shop user"
ON public.shop_users
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "XLata admins can manage shop users" ON public.shop_users;
CREATE POLICY "XLata admins can manage shop users"
ON public.shop_users
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin_master', 'admin_operacional')
  )
);

-- 8. RLS de shop_products (usando is_active ao invés de status)
DROP POLICY IF EXISTS "Anyone can view visible products" ON public.shop_products;
CREATE POLICY "Anyone can view visible products"
ON public.shop_products
FOR SELECT
USING (is_visible = true AND is_active = true);

DROP POLICY IF EXISTS "Admins can manage all products" ON public.shop_products;
CREATE POLICY "Admins can manage all products"
ON public.shop_products
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin_master', 'admin_operacional')
  )
);

-- 9. RLS de shop_orders
DROP POLICY IF EXISTS "Shop users can view own orders" ON public.shop_orders;
CREATE POLICY "Shop users can view own orders"
ON public.shop_orders
FOR SELECT
USING (
  shop_user_id::text = current_setting('app.current_shop_user_id', true)
  OR EXISTS (
    SELECT 1 FROM public.admin_user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin_master', 'admin_operacional')
  )
);

DROP POLICY IF EXISTS "Shop users can create orders" ON public.shop_orders;
CREATE POLICY "Shop users can create orders"
ON public.shop_orders
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage all orders" ON public.shop_orders;
CREATE POLICY "Admins can manage all orders"
ON public.shop_orders
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin_master', 'admin_operacional')
  )
);

-- 10. Funções de autenticação
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.shop_user_authenticate(
  p_email TEXT,
  p_password TEXT
)
RETURNS TABLE(
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  user_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    su.id,
    su.email,
    su.name,
    su.status
  FROM public.shop_users su
  WHERE su.email = p_email
    AND su.password_hash = crypt(p_password, su.password_hash)
    AND su.status = 'active';
    
  UPDATE public.shop_users
  SET last_login_at = now()
  WHERE email = p_email
    AND password_hash = crypt(p_password, password_hash)
    AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.shop_user_register(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT,
  p_phone TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM public.shop_users WHERE email = p_email) THEN
    RAISE EXCEPTION 'Email já cadastrado';
  END IF;
  
  INSERT INTO public.shop_users (email, password_hash, name, phone)
  VALUES (p_email, crypt(p_password, gen_salt('bf')), p_name, p_phone)
  RETURNING id INTO new_user_id;
  
  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.shop_user_update_password(
  p_user_id UUID,
  p_old_password TEXT,
  p_new_password TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  is_valid BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.shop_users 
    WHERE id = p_user_id 
    AND password_hash = crypt(p_old_password, password_hash)
  ) INTO is_valid;
  
  IF NOT is_valid THEN
    RETURN FALSE;
  END IF;
  
  UPDATE public.shop_users
  SET password_hash = crypt(p_new_password, gen_salt('bf'))
  WHERE id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;