-- Ativar RLS nas tabelas que têm políticas mas o RLS está desabilitado
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Verificar se as tabelas possuem políticas adequadas
-- Se não tiverem, vamos criar políticas básicas de segurança

-- Política para subscriptions (assumindo que tem user_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'subscriptions' 
        AND schemaname = 'public'
        AND cmd = 'SELECT'
    ) THEN
        CREATE POLICY "Users can view their own subscriptions"
        ON public.subscriptions
        FOR SELECT
        USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Política para user_accounts (assumindo que tem user_id ou id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_accounts' 
        AND schemaname = 'public'
        AND cmd = 'SELECT'
    ) THEN
        CREATE POLICY "Users can view their own account"
        ON public.user_accounts
        FOR SELECT
        USING (auth.uid() = user_id OR auth.uid() = id);
    END IF;
END
$$;

-- Política para user_subscriptions (assumindo que tem user_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_subscriptions' 
        AND schemaname = 'public'
        AND cmd = 'SELECT'
    ) THEN
        CREATE POLICY "Users can view their own user subscriptions"
        ON public.user_subscriptions
        FOR SELECT
        USING (auth.uid() = user_id);
    END IF;
END
$$;