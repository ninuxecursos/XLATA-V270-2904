import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UseEmployeePermissions {
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  isOwner: boolean;
  isEmployee: boolean;
  permissions: string[];
  loading: boolean;
  ownerUserId: string | null;
}

export function useEmployeePermissions(): UseEmployeePermissions {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isOwner, setIsOwner] = useState(true);
  const [isEmployee, setIsEmployee] = useState(false);
  const [ownerUserId, setOwnerUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkUserRole = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Check if user is an employee of someone else
      const { data: employeeRecord, error } = await supabase
        .from('depot_employees')
        .select('id, owner_user_id, is_active')
        .eq('employee_user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Erro ao verificar papel do usuário:', error);
        setIsOwner(true);
        setIsEmployee(false);
        setLoading(false);
        return;
      }

      if (employeeRecord) {
        // User is an employee
        setIsEmployee(true);
        setIsOwner(false);
        setOwnerUserId(employeeRecord.owner_user_id);

        // Fetch permissions
        const { data: perms } = await supabase
          .from('employee_permissions')
          .select('permission')
          .eq('employee_id', employeeRecord.id);

        setPermissions(perms?.map(p => p.permission) || []);
      } else {
        // User is an owner (has their own account)
        setIsOwner(true);
        setIsEmployee(false);
        setOwnerUserId(null);
        setPermissions([]); // Owners have all permissions implicitly
      }
    } catch (err) {
      console.error('Erro ao verificar permissões:', err);
      setIsOwner(true);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    checkUserRole();
  }, [checkUserRole]);

  const hasPermission = useCallback((permission: string): boolean => {
    // Owners have all permissions
    if (isOwner) return true;
    // Employees need specific permission
    return permissions.includes(permission);
  }, [isOwner, permissions]);

  const hasAnyPermission = useCallback((perms: string[]): boolean => {
    if (isOwner) return true;
    return perms.some(p => permissions.includes(p));
  }, [isOwner, permissions]);

  return {
    hasPermission,
    hasAnyPermission,
    isOwner,
    isEmployee,
    permissions,
    loading,
    ownerUserId,
  };
}
