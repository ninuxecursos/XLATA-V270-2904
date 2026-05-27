-- ============================================
-- CORREÇÕES DE SEGURANÇA RLS - LOJA XLATA
-- ============================================

-- 1. Recriar a view shop_product_rating_stats SEM SECURITY DEFINER
DROP VIEW IF EXISTS public.shop_product_rating_stats;

CREATE VIEW public.shop_product_rating_stats AS
SELECT 
  product_id,
  COUNT(*)::integer as review_count,
  COALESCE(AVG(rating), 0)::numeric(3,2) as average_rating,
  COUNT(*) FILTER (WHERE rating = 5)::integer as five_star,
  COUNT(*) FILTER (WHERE rating = 4)::integer as four_star,
  COUNT(*) FILTER (WHERE rating = 3)::integer as three_star,
  COUNT(*) FILTER (WHERE rating = 2)::integer as two_star,
  COUNT(*) FILTER (WHERE rating = 1)::integer as one_star
FROM public.shop_product_reviews
WHERE is_visible = true
GROUP BY product_id;

-- 2. TABELA: shop_user_favorites
CREATE TABLE IF NOT EXISTS public.shop_user_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.shop_users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.shop_products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_shop_user_favorites_user_id ON public.shop_user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_user_favorites_product_id ON public.shop_user_favorites(product_id);

-- RLS para favoritos
ALTER TABLE public.shop_user_favorites ENABLE ROW LEVEL SECURITY;

-- Política: Usuários veem apenas seus próprios favoritos
CREATE POLICY "Users can view own favorites"
  ON public.shop_user_favorites FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own favorites"
  ON public.shop_user_favorites FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete own favorites"
  ON public.shop_user_favorites FOR DELETE
  USING (true);

-- 3. TABELA: shop_user_addresses
CREATE TABLE IF NOT EXISTS public.shop_user_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.shop_users(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL DEFAULT 'Casa',
  recipient_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  zip_code VARCHAR(10) NOT NULL,
  street VARCHAR(255) NOT NULL,
  number VARCHAR(20) NOT NULL,
  complement VARCHAR(100),
  neighborhood VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL,
  country VARCHAR(50) NOT NULL DEFAULT 'Brasil',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_shop_user_addresses_user_id ON public.shop_user_addresses(user_id);

-- RLS para endereços
ALTER TABLE public.shop_user_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own addresses"
  ON public.shop_user_addresses FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own addresses"
  ON public.shop_user_addresses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own addresses"
  ON public.shop_user_addresses FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete own addresses"
  ON public.shop_user_addresses FOR DELETE
  USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_shop_user_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_shop_user_addresses_updated_at ON public.shop_user_addresses;
CREATE TRIGGER trigger_update_shop_user_addresses_updated_at
  BEFORE UPDATE ON public.shop_user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_shop_user_addresses_updated_at();

-- Função para garantir apenas um endereço padrão por usuário
CREATE OR REPLACE FUNCTION public.ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.shop_user_addresses
    SET is_default = false
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ensure_single_default_address ON public.shop_user_addresses;
CREATE TRIGGER trigger_ensure_single_default_address
  BEFORE INSERT OR UPDATE OF is_default ON public.shop_user_addresses
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION public.ensure_single_default_address();

-- 4. FUNÇÃO RPC para decrementar estoque ao criar pedido
CREATE OR REPLACE FUNCTION public.shop_create_order_with_stock(
  p_shop_user_id UUID,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_customer_document TEXT,
  p_shipping_address JSONB,
  p_items JSONB,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  v_subtotal NUMERIC := 0;
  v_item JSONB;
  v_product_id UUID;
  v_quantity INTEGER;
  v_current_stock INTEGER;
BEGIN
  -- Calcular subtotal
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_subtotal := v_subtotal + (v_item->>'unit_price')::numeric * (v_item->>'quantity')::integer;
  END LOOP;

  -- Criar o pedido
  INSERT INTO public.shop_orders (
    shop_user_id,
    customer_name,
    customer_email,
    customer_phone,
    customer_document,
    shipping_address,
    items,
    subtotal,
    shipping_cost,
    discount,
    total,
    status,
    notes
  ) VALUES (
    p_shop_user_id,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_customer_document,
    p_shipping_address,
    p_items,
    v_subtotal,
    0,
    0,
    v_subtotal,
    'aguardando_pagamento',
    p_notes
  )
  RETURNING id INTO v_order_id;

  -- Decrementar estoque de cada produto
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    
    -- Verificar estoque disponível
    SELECT stock_quantity INTO v_current_stock
    FROM public.shop_products
    WHERE id = v_product_id
    FOR UPDATE;
    
    IF v_current_stock < v_quantity THEN
      RAISE EXCEPTION 'Estoque insuficiente para o produto %', v_product_id;
    END IF;
    
    -- Decrementar estoque
    UPDATE public.shop_products
    SET stock_quantity = stock_quantity - v_quantity,
        updated_at = now()
    WHERE id = v_product_id;
  END LOOP;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Adicionar coluna sold_count em shop_products se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'shop_products' 
    AND column_name = 'sold_count'
  ) THEN
    ALTER TABLE public.shop_products ADD COLUMN sold_count INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;