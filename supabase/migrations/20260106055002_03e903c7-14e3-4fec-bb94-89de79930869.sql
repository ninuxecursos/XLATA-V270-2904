-- Adicionar colunas para controle de senha na tabela depot_employees
ALTER TABLE public.depot_employees
ADD COLUMN IF NOT EXISTS initial_password_set BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;

-- Atualizar RLS para permitir que funcionários acessem dados do dono
-- Política para funcionários verem materiais do dono
CREATE POLICY "employees_view_owner_materials" ON public.materials
FOR SELECT
USING (
  user_id IN (
    SELECT owner_user_id FROM public.depot_employees 
    WHERE employee_user_id = auth.uid() AND is_active = true
  )
);

-- Política para funcionários verem clientes do dono
CREATE POLICY "employees_view_owner_customers" ON public.customers
FOR SELECT
USING (
  user_id IN (
    SELECT owner_user_id FROM public.depot_employees 
    WHERE employee_user_id = auth.uid() AND is_active = true
  )
);

-- Política para funcionários verem orders do dono
CREATE POLICY "employees_view_owner_orders" ON public.orders
FOR SELECT
USING (
  user_id IN (
    SELECT owner_user_id FROM public.depot_employees 
    WHERE employee_user_id = auth.uid() AND is_active = true
  )
);

-- Política para funcionários verem order_items do dono
CREATE POLICY "employees_view_owner_order_items" ON public.order_items
FOR SELECT
USING (
  user_id IN (
    SELECT owner_user_id FROM public.depot_employees 
    WHERE employee_user_id = auth.uid() AND is_active = true
  )
);

-- Política para funcionários verem cash_registers do dono
CREATE POLICY "employees_view_owner_cash_registers" ON public.cash_registers
FOR SELECT
USING (
  user_id IN (
    SELECT owner_user_id FROM public.depot_employees 
    WHERE employee_user_id = auth.uid() AND is_active = true
  )
);

-- Política para funcionários verem depot_clients do dono
CREATE POLICY "employees_view_owner_depot_clients" ON public.depot_clients
FOR SELECT
USING (
  user_id IN (
    SELECT owner_user_id FROM public.depot_employees 
    WHERE employee_user_id = auth.uid() AND is_active = true
  )
);

-- Política para funcionários verem seus próprios dados
CREATE POLICY "employees_view_own_record" ON public.depot_employees
FOR SELECT
USING (employee_user_id = auth.uid());

-- Política para funcionários verem suas próprias permissões
CREATE POLICY "employees_view_own_permissions" ON public.employee_permissions
FOR SELECT
USING (
  employee_id IN (
    SELECT id FROM public.depot_employees 
    WHERE employee_user_id = auth.uid()
  )
);