-- =============================================
-- VENDAS INTERATIVAS (Interactive Sales System)
-- =============================================

-- Enum para status do evento interativo
CREATE TYPE public.interactive_event_status AS ENUM (
  'scheduled',   -- agendado
  'active',      -- ativo
  'finished',    -- finalizado
  'cancelled'    -- cancelado
);

-- Tabela principal de eventos interativos
CREATE TABLE public.shop_interactive_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.shop_products(id) ON DELETE CASCADE,
  
  -- Valores
  initial_value DECIMAL(10, 2) NOT NULL,
  current_value DECIMAL(10, 2) NOT NULL,
  minimum_increment DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
  
  -- Temporização
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  
  -- Status
  status interactive_event_status NOT NULL DEFAULT 'scheduled',
  
  -- Resultado
  winner_user_id UUID REFERENCES public.shop_users(id) ON DELETE SET NULL,
  winning_offer_id UUID,
  final_order_id UUID REFERENCES public.shop_orders(id) ON DELETE SET NULL,
  
  -- Metadados
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Garantir que datas fazem sentido
  CONSTRAINT valid_dates CHECK (end_at > start_at),
  CONSTRAINT valid_values CHECK (current_value >= initial_value),
  CONSTRAINT valid_increment CHECK (minimum_increment > 0)
);

-- Tabela de ofertas interativas
CREATE TABLE public.shop_interactive_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.shop_interactive_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.shop_users(id) ON DELETE CASCADE,
  
  -- Valor da oferta
  offer_value DECIMAL(10, 2) NOT NULL,
  
  -- Status
  is_winning BOOLEAN NOT NULL DEFAULT false,
  is_valid BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadados
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Índice para evitar ofertas duplicadas rápidas
  CONSTRAINT positive_offer CHECK (offer_value > 0)
);

-- Adicionar referência circular após criação
ALTER TABLE public.shop_interactive_events 
ADD CONSTRAINT fk_winning_offer 
FOREIGN KEY (winning_offer_id) 
REFERENCES public.shop_interactive_offers(id) 
ON DELETE SET NULL;

-- Tabela de configurações globais para vendas interativas
CREATE TABLE public.shop_interactive_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Configurações padrão
  default_duration_minutes INTEGER NOT NULL DEFAULT 60,
  default_increment DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Textos customizáveis
  event_title_label TEXT NOT NULL DEFAULT 'Oferta Interativa',
  participate_button_text TEXT NOT NULL DEFAULT 'Participar',
  current_value_label TEXT NOT NULL DEFAULT 'Valor Atual',
  time_remaining_label TEXT NOT NULL DEFAULT 'Tempo Restante',
  
  -- Recursos
  enable_sounds BOOLEAN NOT NULL DEFAULT true,
  enable_animations BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadados
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inserir configuração padrão
INSERT INTO public.shop_interactive_config (id) VALUES (gen_random_uuid());

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX idx_interactive_events_status ON public.shop_interactive_events(status);
CREATE INDEX idx_interactive_events_product ON public.shop_interactive_events(product_id);
CREATE INDEX idx_interactive_events_dates ON public.shop_interactive_events(start_at, end_at);
CREATE INDEX idx_interactive_events_winner ON public.shop_interactive_events(winner_user_id);

CREATE INDEX idx_interactive_offers_event ON public.shop_interactive_offers(event_id);
CREATE INDEX idx_interactive_offers_user ON public.shop_interactive_offers(user_id);
CREATE INDEX idx_interactive_offers_winning ON public.shop_interactive_offers(event_id, is_winning) WHERE is_winning = true;
CREATE INDEX idx_interactive_offers_created ON public.shop_interactive_offers(created_at DESC);

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger para atualizar updated_at
CREATE TRIGGER update_shop_interactive_events_updated_at
  BEFORE UPDATE ON public.shop_interactive_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shop_interactive_config_updated_at
  BEFORE UPDATE ON public.shop_interactive_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE public.shop_interactive_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_interactive_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_interactive_config ENABLE ROW LEVEL SECURITY;

-- Eventos: leitura pública, escrita apenas admin
CREATE POLICY "Anyone can view active events"
  ON public.shop_interactive_events
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage events"
  ON public.shop_interactive_events
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ofertas: leitura pública (sem dados sensíveis), escrita por usuários da loja
CREATE POLICY "Anyone can view offers"
  ON public.shop_interactive_offers
  FOR SELECT
  USING (true);

CREATE POLICY "Shop users can create offers"
  ON public.shop_interactive_offers
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage offers"
  ON public.shop_interactive_offers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Config: leitura pública, escrita admin
CREATE POLICY "Anyone can view config"
  ON public.shop_interactive_config
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage config"
  ON public.shop_interactive_config
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================
-- FUNÇÕES PARA EVENTOS INTERATIVOS
-- =============================================

-- Função para criar uma oferta com validação
CREATE OR REPLACE FUNCTION public.create_interactive_offer(
  p_event_id UUID,
  p_user_id UUID,
  p_offer_value DECIMAL(10, 2)
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event RECORD;
  v_last_offer RECORD;
  v_new_offer_id UUID;
  v_min_required DECIMAL(10, 2);
BEGIN
  -- Buscar evento
  SELECT * INTO v_event
  FROM shop_interactive_events
  WHERE id = p_event_id
  FOR UPDATE;
  
  -- Validações
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Evento não encontrado');
  END IF;
  
  IF v_event.status != 'active' THEN
    RETURN json_build_object('success', false, 'error', 'Este evento não está ativo');
  END IF;
  
  IF now() < v_event.start_at THEN
    RETURN json_build_object('success', false, 'error', 'Este evento ainda não começou');
  END IF;
  
  IF now() > v_event.end_at THEN
    RETURN json_build_object('success', false, 'error', 'Este evento já encerrou');
  END IF;
  
  -- Verificar última oferta do mesmo usuário (anti-spam: 3 segundos)
  SELECT * INTO v_last_offer
  FROM shop_interactive_offers
  WHERE event_id = p_event_id 
    AND user_id = p_user_id
    AND created_at > now() - interval '3 seconds'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Aguarde alguns segundos antes de fazer outra oferta');
  END IF;
  
  -- Calcular valor mínimo
  v_min_required := v_event.current_value + v_event.minimum_increment;
  
  IF p_offer_value < v_min_required THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Valor mínimo: R$ ' || to_char(v_min_required, 'FM999G999D00')
    );
  END IF;
  
  -- Marcar ofertas anteriores como não vencedoras
  UPDATE shop_interactive_offers
  SET is_winning = false
  WHERE event_id = p_event_id AND is_winning = true;
  
  -- Criar nova oferta
  INSERT INTO shop_interactive_offers (event_id, user_id, offer_value, is_winning)
  VALUES (p_event_id, p_user_id, p_offer_value, true)
  RETURNING id INTO v_new_offer_id;
  
  -- Atualizar valor atual do evento
  UPDATE shop_interactive_events
  SET current_value = p_offer_value,
      updated_at = now()
  WHERE id = p_event_id;
  
  RETURN json_build_object(
    'success', true, 
    'offer_id', v_new_offer_id,
    'new_value', p_offer_value
  );
END;
$$;

-- Função para finalizar evento
CREATE OR REPLACE FUNCTION public.finalize_interactive_event(p_event_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event RECORD;
  v_winning_offer RECORD;
  v_order_id UUID;
  v_product RECORD;
BEGIN
  -- Buscar evento
  SELECT * INTO v_event
  FROM shop_interactive_events
  WHERE id = p_event_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Evento não encontrado');
  END IF;
  
  IF v_event.status = 'finished' THEN
    RETURN json_build_object('success', false, 'error', 'Evento já foi finalizado');
  END IF;
  
  IF v_event.status = 'cancelled' THEN
    RETURN json_build_object('success', false, 'error', 'Evento foi cancelado');
  END IF;
  
  -- Buscar oferta vencedora
  SELECT * INTO v_winning_offer
  FROM shop_interactive_offers
  WHERE event_id = p_event_id AND is_winning = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    -- Nenhuma oferta - cancelar evento
    UPDATE shop_interactive_events
    SET status = 'cancelled', updated_at = now()
    WHERE id = p_event_id;
    
    RETURN json_build_object('success', true, 'result', 'no_offers', 'message', 'Evento cancelado por falta de participação');
  END IF;
  
  -- Buscar produto
  SELECT * INTO v_product
  FROM shop_products
  WHERE id = v_event.product_id;
  
  -- Criar pedido automático
  INSERT INTO shop_orders (
    user_id,
    status,
    total,
    subtotal,
    notes
  )
  VALUES (
    v_winning_offer.user_id,
    'pending',
    v_winning_offer.offer_value,
    v_winning_offer.offer_value,
    'Pedido gerado automaticamente - Venda Interativa #' || v_event.id
  )
  RETURNING id INTO v_order_id;
  
  -- Criar item do pedido
  INSERT INTO shop_order_items (
    order_id,
    product_id,
    product_name,
    quantity,
    unit_price,
    subtotal
  )
  VALUES (
    v_order_id,
    v_event.product_id,
    v_product.name,
    1,
    v_winning_offer.offer_value,
    v_winning_offer.offer_value
  );
  
  -- Atualizar estoque do produto
  UPDATE shop_products
  SET stock_quantity = GREATEST(0, stock_quantity - 1),
      is_active = CASE WHEN stock_quantity <= 1 THEN false ELSE is_active END
  WHERE id = v_event.product_id;
  
  -- Finalizar evento
  UPDATE shop_interactive_events
  SET 
    status = 'finished',
    winner_user_id = v_winning_offer.user_id,
    winning_offer_id = v_winning_offer.id,
    final_order_id = v_order_id,
    updated_at = now()
  WHERE id = p_event_id;
  
  RETURN json_build_object(
    'success', true, 
    'result', 'completed',
    'winner_id', v_winning_offer.user_id,
    'final_value', v_winning_offer.offer_value,
    'order_id', v_order_id
  );
END;
$$;

-- Função para ativar evento agendado
CREATE OR REPLACE FUNCTION public.activate_scheduled_event(p_event_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE shop_interactive_events
  SET status = 'active', updated_at = now()
  WHERE id = p_event_id 
    AND status = 'scheduled'
    AND start_at <= now();
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Evento não pode ser ativado');
  END IF;
  
  RETURN json_build_object('success', true);
END;
$$;

-- Enable realtime for events and offers
ALTER PUBLICATION supabase_realtime ADD TABLE shop_interactive_events;
ALTER PUBLICATION supabase_realtime ADD TABLE shop_interactive_offers;