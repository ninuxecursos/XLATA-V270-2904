import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface DepotEmployee {
  id: string;
  owner_user_id: string;
  employee_user_id: string | null;
  unidade_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  initial_password_set: boolean;
  password_changed_at: string | null;
  salary: number | null;
  work_start_time: string | null;
  work_end_time: string | null;
  work_days: number[] | null;
  discount_percentage: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeePermission {
  id: string;
  employee_id: string;
  permission: string;
  granted_at: string;
  granted_by: string | null;
}

export interface EmployeeFormData {
  name: string;
  email: string;
  phone?: string;
  role?: string;
  salary?: number | null;
  work_start_time?: string | null;
  work_end_time?: string | null;
  work_days?: number[] | null;
  discount_percentage?: number | null;
  notes?: string | null;
}

export interface CreateEmployeeResult {
  employee: DepotEmployee | null;
  generatedPassword: string | null;
}

export const AVAILABLE_PERMISSIONS = [
  { key: 'pdv_view', label: 'Visualizar PDV', category: 'PDV' },
  { key: 'pdv_create_order', label: 'Criar pedidos', category: 'PDV' },
  { key: 'pdv_complete_order', label: 'Finalizar pedidos', category: 'PDV' },
  { key: 'materials_view', label: 'Visualizar materiais', category: 'Materiais' },
  { key: 'materials_edit', label: 'Editar materiais', category: 'Materiais' },
  { key: 'stock_view', label: 'Visualizar estoque', category: 'Estoque' },
  { key: 'transactions_view', label: 'Ver transações', category: 'Financeiro' },
  { key: 'expenses_view', label: 'Ver despesas', category: 'Financeiro' },
  { key: 'expenses_create', label: 'Criar despesas', category: 'Financeiro' },
  { key: 'cash_register_open', label: 'Abrir caixa', category: 'Caixa' },
  { key: 'cash_register_close', label: 'Fechar caixa', category: 'Caixa' },
  { key: 'reports_view', label: 'Ver relatórios', category: 'Relatórios' },
  { key: 'clients_view', label: 'Visualizar clientes', category: 'Clientes' },
  { key: 'clients_edit', label: 'Editar clientes', category: 'Clientes' },
  { key: 'settings_view', label: 'Ver configurações', category: 'Configurações' },
];

export function useDepotEmployees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<DepotEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('depot_employees')
        .select('*')
        .eq('owner_user_id', user.id)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setEmployees(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar funcionários:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const createEmployee = async (formData: EmployeeFormData): Promise<CreateEmployeeResult> => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return { employee: null, generatedPassword: null };
    }

    try {
      // Call edge function to create user with password
      const { data: session } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('create-employee-user', {
        body: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          role: formData.role || 'operador',
        },
        headers: {
          Authorization: `Bearer ${session.session?.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao criar funcionário');
      }

      const result = response.data;
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar funcionário');
      }
      
      toast.success('Funcionário cadastrado com sucesso!');
      await fetchEmployees();
      
      return {
        employee: result.employee,
        generatedPassword: result.generatedPassword,
      };
    } catch (err: any) {
      console.error('Erro ao criar funcionário:', err);
      toast.error('Erro ao cadastrar funcionário: ' + err.message);
      return { employee: null, generatedPassword: null };
    }
  };

  const updateEmployee = async (id: string, formData: Partial<EmployeeFormData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('depot_employees')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Funcionário atualizado com sucesso!');
      await fetchEmployees();
      return true;
    } catch (err: any) {
      console.error('Erro ao atualizar funcionário:', err);
      toast.error('Erro ao atualizar funcionário: ' + err.message);
      return false;
    }
  };

  const deleteEmployee = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('depot_employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Funcionário removido com sucesso!');
      await fetchEmployees();
      return true;
    } catch (err: any) {
      console.error('Erro ao remover funcionário:', err);
      toast.error('Erro ao remover funcionário: ' + err.message);
      return false;
    }
  };

  const toggleEmployeeStatus = async (id: string, isActive: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('depot_employees')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(isActive ? 'Funcionário ativado!' : 'Funcionário desativado!');
      await fetchEmployees();
      return true;
    } catch (err: any) {
      console.error('Erro ao alterar status:', err);
      toast.error('Erro ao alterar status: ' + err.message);
      return false;
    }
  };

  const getEmployeePermissions = async (employeeId: string): Promise<EmployeePermission[]> => {
    try {
      const { data, error } = await supabase
        .from('employee_permissions')
        .select('*')
        .eq('employee_id', employeeId);

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Erro ao buscar permissões:', err);
      return [];
    }
  };

  const updateEmployeePermissions = async (employeeId: string, permissions: string[]): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      // Remove all existing permissions
      await supabase
        .from('employee_permissions')
        .delete()
        .eq('employee_id', employeeId);

      // Add new permissions
      if (permissions.length > 0) {
        const { error } = await supabase
          .from('employee_permissions')
          .insert(
            permissions.map(permission => ({
              employee_id: employeeId,
              permission,
              granted_by: user.id,
            }))
          );

        if (error) throw error;
      }

      toast.success('Permissões atualizadas com sucesso!');
      return true;
    } catch (err: any) {
      console.error('Erro ao atualizar permissões:', err);
      toast.error('Erro ao atualizar permissões: ' + err.message);
      return false;
    }
  };

  return {
    employees,
    loading,
    error,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    toggleEmployeeStatus,
    getEmployeePermissions,
    updateEmployeePermissions,
  };
}
