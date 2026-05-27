-- Tabela de Clientes do Depósito
CREATE TABLE public.depot_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  unidade_id UUID REFERENCES public.unidades(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT,
  cpf TEXT,
  address_number TEXT,
  address_neighborhood TEXT,
  address_city TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para depot_clients
CREATE INDEX idx_depot_clients_user_id ON public.depot_clients(user_id);
CREATE INDEX idx_depot_clients_cpf ON public.depot_clients(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX idx_depot_clients_whatsapp ON public.depot_clients(whatsapp);

-- RLS para depot_clients
ALTER TABLE public.depot_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clients" ON public.depot_clients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own clients" ON public.depot_clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients" ON public.depot_clients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients" ON public.depot_clients
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all clients" ON public.depot_clients
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_user_roles WHERE user_id = auth.uid())
  );

-- Tabela de Funcionários do Depósito
CREATE TABLE public.depot_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  employee_user_id UUID,
  unidade_id UUID REFERENCES public.unidades(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'operador',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para depot_employees
CREATE INDEX idx_depot_employees_owner ON public.depot_employees(owner_user_id);
CREATE INDEX idx_depot_employees_employee ON public.depot_employees(employee_user_id) WHERE employee_user_id IS NOT NULL;
CREATE INDEX idx_depot_employees_email ON public.depot_employees(email);

-- RLS para depot_employees
ALTER TABLE public.depot_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage employees" ON public.depot_employees
  FOR ALL USING (auth.uid() = owner_user_id);

CREATE POLICY "Employees can view own record" ON public.depot_employees
  FOR SELECT USING (auth.uid() = employee_user_id);

CREATE POLICY "Admins can manage all employees" ON public.depot_employees
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_user_roles WHERE user_id = auth.uid())
  );

-- Tabela de Permissões de Funcionários
CREATE TABLE public.employee_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.depot_employees(id) ON DELETE CASCADE NOT NULL,
  permission TEXT NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT now(),
  granted_by UUID,
  UNIQUE(employee_id, permission)
);

-- Índice para employee_permissions
CREATE INDEX idx_employee_permissions_employee ON public.employee_permissions(employee_id);

-- RLS para employee_permissions
ALTER TABLE public.employee_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage permissions" ON public.employee_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.depot_employees 
      WHERE id = employee_permissions.employee_id 
      AND owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Employees can view own permissions" ON public.employee_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.depot_employees 
      WHERE id = employee_permissions.employee_id 
      AND employee_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all permissions" ON public.employee_permissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_user_roles WHERE user_id = auth.uid())
  );

-- Adicionar colunas na tabela orders para vínculo com cliente
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS depot_client_id UUID REFERENCES public.depot_clients(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'approved';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS receipt_saved BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS receipt_saved_at TIMESTAMPTZ;

-- Índice para orders com depot_client
CREATE INDEX idx_orders_depot_client ON public.orders(depot_client_id) WHERE depot_client_id IS NOT NULL;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_depot_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_depot_clients_updated_at
  BEFORE UPDATE ON public.depot_clients
  FOR EACH ROW EXECUTE FUNCTION update_depot_updated_at();

CREATE TRIGGER update_depot_employees_updated_at
  BEFORE UPDATE ON public.depot_employees
  FOR EACH ROW EXECUTE FUNCTION update_depot_updated_at();