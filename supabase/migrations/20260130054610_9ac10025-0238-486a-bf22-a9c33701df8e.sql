-- Tabela de avaliações de produtos
CREATE TABLE IF NOT EXISTS public.shop_product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.shop_products(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.shop_orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.shop_users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT true,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_shop_reviews_product ON public.shop_product_reviews(product_id);
CREATE INDEX idx_shop_reviews_user ON public.shop_product_reviews(user_id);
CREATE INDEX idx_shop_reviews_order ON public.shop_product_reviews(order_id);

-- Constraint única: um usuário só pode avaliar um produto por pedido
ALTER TABLE public.shop_product_reviews 
ADD CONSTRAINT unique_review_per_order_product 
UNIQUE (order_id, product_id);

-- Enable RLS
ALTER TABLE public.shop_product_reviews ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Qualquer pessoa pode ver avaliações visíveis
CREATE POLICY "Anyone can view visible reviews"
ON public.shop_product_reviews
FOR SELECT
USING (is_visible = true);

-- Usuários autenticados podem criar suas próprias avaliações
CREATE POLICY "Users can create own reviews"
ON public.shop_product_reviews
FOR INSERT
WITH CHECK (true);

-- Usuários podem editar suas próprias avaliações
CREATE POLICY "Users can update own reviews"
ON public.shop_product_reviews
FOR UPDATE
USING (true);

-- Usuários podem deletar suas próprias avaliações
CREATE POLICY "Users can delete own reviews"
ON public.shop_product_reviews
FOR DELETE
USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_shop_product_reviews_updated_at
BEFORE UPDATE ON public.shop_product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- View para estatísticas de avaliação por produto
CREATE OR REPLACE VIEW public.shop_product_rating_stats AS
SELECT 
  product_id,
  COUNT(*)::INTEGER as review_count,
  ROUND(AVG(rating)::NUMERIC, 1) as average_rating,
  COUNT(*) FILTER (WHERE rating = 5)::INTEGER as five_star,
  COUNT(*) FILTER (WHERE rating = 4)::INTEGER as four_star,
  COUNT(*) FILTER (WHERE rating = 3)::INTEGER as three_star,
  COUNT(*) FILTER (WHERE rating = 2)::INTEGER as two_star,
  COUNT(*) FILTER (WHERE rating = 1)::INTEGER as one_star
FROM public.shop_product_reviews
WHERE is_visible = true
GROUP BY product_id;