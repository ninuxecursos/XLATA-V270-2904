import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type AdminRole = 'admin_master' | 'admin_operacional' | 'suporte' | 'leitura';

interface AdminRoleInfo {
  role: AdminRole;
  grantedAt: string;
  grantedBy: string | null;
}

export function useAdminRoles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AdminRoleInfo[]>([]);
  const [highestRole, setHighestRole] = useState<AdminRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const roleHierarchy: Record<AdminRole, number> = {
    'admin_master': 1,
    'admin_operacional': 2,
    'suporte': 3,
    'leitura': 4
  };

  const fetchRoles = useCallback(async () => {
    if (!user) {
      setRoles([]);
      setHighestRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('admin_user_roles')
        .select('role, granted_at, granted_by')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      const roleInfos: AdminRoleInfo[] = (data || []).map(r => ({
        role: r.role as AdminRole,
        grantedAt: r.granted_at,
        grantedBy: r.granted_by
      }));

      setRoles(roleInfos);

      // Determine highest role
      if (roleInfos.length > 0) {
        const sorted = roleInfos.sort((a, b) => 
          roleHierarchy[a.role] - roleHierarchy[b.role]
        );
        setHighestRole(sorted[0].role);
      } else {
        setHighestRole(null);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching admin roles:', err);
      setError('Erro ao carregar permissões');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const hasRole = useCallback((role: AdminRole): boolean => {
    return roles.some(r => r.role === role);
  }, [roles]);

  const hasMinimumRole = useCallback((minimumRole: AdminRole): boolean => {
    if (!highestRole) return false;
    return roleHierarchy[highestRole] <= roleHierarchy[minimumRole];
  }, [highestRole]);

  const canManageUsers = useCallback((): boolean => {
    return hasMinimumRole('admin_operacional');
  }, [hasMinimumRole]);

  const canManageContent = useCallback((): boolean => {
    return hasMinimumRole('admin_operacional');
  }, [hasMinimumRole]);

  const canManageSecurity = useCallback((): boolean => {
    return hasMinimumRole('admin_master');
  }, [hasMinimumRole]);

  const canManageSystem = useCallback((): boolean => {
    return hasMinimumRole('admin_master');
  }, [hasMinimumRole]);

  const canViewAnalytics = useCallback((): boolean => {
    return hasMinimumRole('leitura');
  }, [hasMinimumRole]);

  const canSendMessages = useCallback((): boolean => {
    return hasMinimumRole('suporte');
  }, [hasMinimumRole]);

  const isAdminMaster = useCallback((): boolean => {
    return hasRole('admin_master');
  }, [hasRole]);

  return {
    roles,
    highestRole,
    loading,
    error,
    refetch: fetchRoles,
    hasRole,
    hasMinimumRole,
    canManageUsers,
    canManageContent,
    canManageSecurity,
    canManageSystem,
    canViewAnalytics,
    canSendMessages,
    isAdminMaster
  };
}
